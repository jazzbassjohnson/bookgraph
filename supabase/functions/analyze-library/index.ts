import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const { supabase, user } = await getUser(authHeader);

    // Fetch all books
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id);

    if (booksError) throw booksError;
    if (!books || books.length === 0) {
      return new Response(JSON.stringify({ error: 'No books in library' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const booksContext = books.map((b: Record<string, unknown>) =>
      `- ID: ${b.id} | "${b.title}" by ${(b.authors as string[]).join(', ')}${b.year ? ` (${b.year})` : ''}${b.notes ? ` | Notes: ${b.notes}` : ''}`
    ).join('\n');

    const prompt = `Analyze this entire book library and find connections between books. Be consistent with terminology.

Library:
${booksContext}

Return ONLY valid JSON with this exact structure:
{
  "books": [
    {
      "id": "book-id-from-above",
      "topics": ["3-6 concrete subjects"],
      "themes": ["3-6 abstract themes"],
      "tags": ["3-6 genre/style/mood"],
      "summary": "1-2 sentence summary"
    }
  ],
  "connections": [
    {
      "book_a_id": "id-of-first-book",
      "book_b_id": "id-of-second-book",
      "connection_type": "thematic|stylistic|topical|influence|author",
      "strength": 0.8,
      "explanation": "Why these books are connected"
    }
  ]
}

Find meaningful connections. Use strength 0-1 (1=strongest). Include cross-book thematic patterns, stylistic similarities, topical overlaps, and influence relationships.`;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.content[0].text;

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    // Valid book IDs set
    const validBookIds = new Set(books.map((b: Record<string, unknown>) => b.id));

    // Upsert analyses for each book
    if (parsed.books && Array.isArray(parsed.books)) {
      for (const bookAnalysis of parsed.books) {
        if (!validBookIds.has(bookAnalysis.id)) continue;
        await supabase.from('book_analyses').upsert({
          book_id: bookAnalysis.id,
          user_id: user.id,
          ai_topics: bookAnalysis.topics || [],
          ai_themes: bookAnalysis.themes || [],
          ai_tags: bookAnalysis.tags || [],
          ai_summary: bookAnalysis.summary || null,
          raw_response: bookAnalysis,
          model_used: 'claude-sonnet-4-6',
          analyzed_at: new Date().toISOString(),
        }, { onConflict: 'book_id' });
      }
    }

    // Clear and re-insert all connections
    await supabase
      .from('book_connections')
      .delete()
      .eq('user_id', user.id);

    if (parsed.connections && Array.isArray(parsed.connections)) {
      for (const conn of parsed.connections) {
        if (!validBookIds.has(conn.book_a_id) || !validBookIds.has(conn.book_b_id)) continue;
        // Enforce ordering
        const [bookA, bookB] = conn.book_a_id < conn.book_b_id
          ? [conn.book_a_id, conn.book_b_id]
          : [conn.book_b_id, conn.book_a_id];

        await supabase.from('book_connections').upsert({
          user_id: user.id,
          book_a_id: bookA,
          book_b_id: bookB,
          connection_type: conn.connection_type || 'thematic',
          strength: Math.min(1, Math.max(0, conn.strength || 0.5)),
          explanation: conn.explanation || null,
        }, { onConflict: 'book_a_id,book_b_id,connection_type' });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
