import { supabase } from './supabase';
import type { Book, BookAnalysis, BookConnection, BookSuggestion, BookWithAnalysis } from '../types';
import type { DbBook, DbBookAnalysis, DbBookConnection, DbBookSuggestion } from './database.types';

// --- Books ---

export async function fetchBooksWithAnalyses(): Promise<BookWithAnalysis[]> {
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (booksError) throw booksError;

  const { data: analyses, error: analysesError } = await supabase
    .from('book_analyses')
    .select('*');

  if (analysesError) throw analysesError;

  const analysisMap = new Map<string, BookAnalysis>();
  for (const a of (analyses || []) as DbBookAnalysis[]) {
    analysisMap.set(a.book_id, {
      id: a.id,
      book_id: a.book_id,
      ai_topics: a.ai_topics,
      ai_themes: a.ai_themes,
      ai_tags: a.ai_tags,
      ai_summary: a.ai_summary,
      raw_response: a.raw_response,
      model_used: a.model_used,
      analyzed_at: a.analyzed_at,
    });
  }

  return ((books || []) as DbBook[]).map((b) => ({
    id: b.id,
    user_id: b.user_id,
    title: b.title,
    authors: b.authors,
    topics: b.topics,
    themes: b.themes,
    tags: b.tags,
    year: b.year ?? undefined,
    rating: b.rating ?? undefined,
    dateRead: b.date_read ?? undefined,
    notes: b.notes ?? undefined,
    created_at: b.created_at,
    updated_at: b.updated_at,
    analysis: analysisMap.get(b.id),
  }));
}

export async function createBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .insert({
      user_id: book.user_id,
      title: book.title,
      authors: book.authors,
      topics: book.topics,
      themes: book.themes,
      tags: book.tags,
      year: book.year ?? null,
      rating: book.rating ?? null,
      date_read: book.dateRead ?? null,
      notes: book.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  const row = data as DbBook;

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    authors: row.authors,
    topics: row.topics,
    themes: row.themes,
    tags: row.tags,
    year: row.year ?? undefined,
    rating: row.rating ?? undefined,
    dateRead: row.date_read ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function updateBook(id: string, updates: Partial<Book>): Promise<Book> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.authors !== undefined) dbUpdates.authors = updates.authors;
  if (updates.topics !== undefined) dbUpdates.topics = updates.topics;
  if (updates.themes !== undefined) dbUpdates.themes = updates.themes;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.year !== undefined) dbUpdates.year = updates.year ?? null;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating ?? null;
  if (updates.dateRead !== undefined) dbUpdates.date_read = updates.dateRead ?? null;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes ?? null;

  const { data, error } = await supabase
    .from('books')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  const row = data as DbBook;

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    authors: row.authors,
    topics: row.topics,
    themes: row.themes,
    tags: row.tags,
    year: row.year ?? undefined,
    rating: row.rating ?? undefined,
    dateRead: row.date_read ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

// --- Connections ---

export async function fetchConnections(): Promise<BookConnection[]> {
  const { data, error } = await supabase
    .from('book_connections')
    .select('*');

  if (error) throw error;

  return ((data || []) as DbBookConnection[]).map((c) => ({
    id: c.id,
    book_a_id: c.book_a_id,
    book_b_id: c.book_b_id,
    connection_type: c.connection_type as BookConnection['connection_type'],
    strength: c.strength,
    explanation: c.explanation,
  }));
}

// --- Suggestions ---

export async function fetchSuggestions(): Promise<BookSuggestion[]> {
  const { data, error } = await supabase
    .from('book_suggestions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data || []) as DbBookSuggestion[])
    .filter((s) => !s.dismissed)
    .map((s) => ({
      id: s.id,
      title: s.title,
      authors: s.authors,
      reason: s.reason,
      related_book_ids: s.related_book_ids,
      dismissed: s.dismissed,
    }));
}

export async function dismissSuggestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('book_suggestions')
    .update({ dismissed: true })
    .eq('id', id);
  if (error) throw error;
}

// --- Edge Functions ---

export async function analyzeBook(bookId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase.functions.invoke('analyze-book', {
    body: { bookId },
  });

  if (error) {
    // Extract the actual error message from the edge function response
    let detail = error.message;
    try {
      const context = (error as unknown as { context: Response }).context;
      if (context) {
        const body = await context.json();
        detail = body.error || detail;
      }
    } catch {
      // Fall back to generic message
    }
    throw new Error(detail);
  }
}

export async function analyzeLibrary(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase.functions.invoke('analyze-library', {});

  if (error) throw error;
}

export async function suggestBooks(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase.functions.invoke('suggest-books', {});

  if (error) throw error;
}
