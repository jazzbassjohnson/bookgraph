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
      `- ID: ${b.id} | "${b.title}" by ${(b.authors as string[]).join(', ')}${b.year ? ` (${b.year})` : ''}`
    ).join('\n');

    const prompt = `Based on this book library, suggest 5-10 books the reader would enjoy that are NOT already in their library.

Library:
${booksContext}

Return ONLY valid JSON with this exact structure:
{
  "suggestions": [
    {
      "title": "Book Title",
      "authors": ["Author Name"],
      "reason": "Why this reader would enjoy this book based on their library",
      "related_book_ids": ["id-of-library-book-that-inspired-this-suggestion"]
    }
  ]
}

Each suggestion should relate to specific books in the library. Include 1-3 related_book_ids per suggestion.`;

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
        max_tokens: 2048,
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

    const validBookIds = new Set(books.map((b: Record<string, unknown>) => b.id as string));

    // Clear previous non-dismissed suggestions and insert new ones
    await supabase
      .from('book_suggestions')
      .delete()
      .eq('user_id', user.id)
      .eq('dismissed', false);

    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      for (const suggestion of parsed.suggestions) {
        const relatedIds = (suggestion.related_book_ids || [])
          .filter((id: string) => validBookIds.has(id));

        await supabase.from('book_suggestions').insert({
          user_id: user.id,
          title: suggestion.title,
          authors: suggestion.authors || [],
          reason: suggestion.reason || null,
          related_book_ids: relatedIds,
          dismissed: false,
        });
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
