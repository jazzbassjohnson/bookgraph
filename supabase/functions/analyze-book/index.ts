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
    const { bookId } = await req.json();

    if (!bookId) {
      return new Response(JSON.stringify({ error: 'bookId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the target book
    const { data: targetBook, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError || !targetBook) {
      return new Response(JSON.stringify({ error: 'Book not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all other books for connection context
    const { data: allBooks } = await supabase
      .from('books')
      .select('id, title, authors, topics, themes, tags')
      .eq('user_id', user.id)
      .neq('id', bookId);

    const otherBooks = allBooks || [];
    const otherBooksContext = otherBooks.length > 0
      ? `\n\nOther books in this user's library:\n${otherBooks.map((b: Record<string, unknown>) =>
          `- "${b.title}" by ${(b.authors as string[]).join(', ')}`
        ).join('\n')}`
      : '';

    const prompt = `Analyze this book and return a JSON response. Be consistent with terminology across analyses.

Book: "${targetBook.title}" by ${targetBook.authors.join(', ')}
${targetBook.year ? `Year: ${targetBook.year}` : ''}
${targetBook.notes ? `Reader's notes: ${targetBook.notes}` : ''}
${otherBooksContext}

Return ONLY valid JSON with this exact structure:
{
  "topics": ["3-6 concrete subjects the book covers"],
  "themes": ["3-6 abstract concepts or themes explored"],
  "tags": ["3-6 genre/style/mood descriptors"],
  "summary": "A concise 1-2 sentence summary of what makes this book notable",
  "connections": [
    {
      "book_id": "id of a connected book from the library",
      "connection_type": "thematic|stylistic|topical|influence|author",
      "strength": 0.7,
      "explanation": "Brief explanation of the connection"
    }
  ]
}

For connections, only reference books from the user's library listed above. Use strength 0-1 where 1 is strongest. Include connections array even if empty.`;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.content[0].text;

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    // Upsert book analysis
    const { error: analysisError } = await supabase
      .from('book_analyses')
      .upsert({
        book_id: bookId,
        user_id: user.id,
        ai_topics: parsed.topics || [],
        ai_themes: parsed.themes || [],
        ai_tags: parsed.tags || [],
        ai_summary: parsed.summary || null,
        raw_response: parsed,
        model_used: 'claude-sonnet-4-20250514',
        analyzed_at: new Date().toISOString(),
      }, { onConflict: 'book_id' });

    if (analysisError) throw analysisError;

    // Delete existing connections for this book then insert new ones
    await supabase
      .from('book_connections')
      .delete()
      .or(`book_a_id.eq.${bookId},book_b_id.eq.${bookId}`);

    if (parsed.connections && Array.isArray(parsed.connections)) {
      for (const conn of parsed.connections) {
        if (!conn.book_id) continue;
        // Enforce book_a_id < book_b_id ordering
        const [bookA, bookB] = bookId < conn.book_id
          ? [bookId, conn.book_id]
          : [conn.book_id, bookId];

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
