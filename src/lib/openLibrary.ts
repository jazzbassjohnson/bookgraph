export interface OpenLibraryResult {
  title: string;
  authors: string[];
  year?: number;
  coverUrl?: string;
  subjects: string[];
}

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
}

interface OpenLibraryResponse {
  docs: OpenLibraryDoc[];
}

export async function searchBooks(query: string): Promise<OpenLibraryResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '8',
    fields: 'title,author_name,first_publish_year,cover_i,subject',
  });

  const response = await fetch(
    `https://openlibrary.org/search.json?${params}`
  );

  if (!response.ok) {
    throw new Error(`Open Library search failed: ${response.status}`);
  }

  const data: OpenLibraryResponse = await response.json();

  return data.docs.map((doc) => ({
    title: doc.title,
    authors: doc.author_name ?? [],
    year: doc.first_publish_year,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`
      : undefined,
    subjects: doc.subject?.slice(0, 8) ?? [],
  }));
}
