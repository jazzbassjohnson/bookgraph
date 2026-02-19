import { useState, useEffect, useCallback } from 'react';
import type { Book, BookWithAnalysis } from '../types';
import { fetchBooksWithAnalyses, createBook, updateBook, deleteBook, analyzeBook } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function useBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzingBookIds, setAnalyzingBookIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchBooksWithAnalyses();
      setBooks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addBook = useCallback(async (bookData: Omit<Book, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Not authenticated');

    const newBook = await createBook({ ...bookData, user_id: user.id });
    setBooks((prev) => [{ ...newBook }, ...prev]);

    // Trigger analysis in background
    setAnalyzingBookIds((prev) => new Set(prev).add(newBook.id));
    analyzeBook(newBook.id)
      .then(() => refresh())
      .then(() => backfillFromAnalysis(newBook.id))
      .then(() => refresh())
      .catch((err) => {
        console.error('Analysis failed:', err);
        alert(`Analysis failed: ${err instanceof Error ? err.message : err}`);
      })
      .finally(() => {
        setAnalyzingBookIds((prev) => {
          const next = new Set(prev);
          next.delete(newBook.id);
          return next;
        });
      });

    return newBook;
  }, [user, refresh]);

  const editBook = useCallback(async (id: string, updates: Partial<Book>) => {
    const updated = await updateBook(id, updates);
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...updated, analysis: b.analysis } : b)));
    return updated;
  }, []);

  const removeBook = useCallback(async (id: string) => {
    await deleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // After analysis, copy AI results into empty book fields
  const backfillFromAnalysis = useCallback(async (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (!book?.analysis) {
      // Re-fetch to get latest analysis data
      const freshBooks = await fetchBooksWithAnalyses();
      setBooks(freshBooks);
      const freshBook = freshBooks.find((b) => b.id === bookId);
      if (!freshBook?.analysis) return;
      return backfillFields(freshBook);
    }
    return backfillFields(book);

    async function backfillFields(b: BookWithAnalysis) {
      const a = b.analysis!;
      const updates: Partial<Book> = {};
      if (b.themes.length === 0 && a.ai_themes.length > 0) updates.themes = a.ai_themes;
      if (b.tags.length === 0 && a.ai_tags.length > 0) updates.tags = a.ai_tags;
      if (!b.notes && a.ai_summary) updates.notes = a.ai_summary;
      if (Object.keys(updates).length > 0) {
        await updateBook(bookId, updates);
      }
    }
  }, [books]);

  const reanalyzeBook = useCallback(async (bookId: string) => {
    setAnalyzingBookIds((prev) => new Set(prev).add(bookId));
    try {
      await analyzeBook(bookId);
      await refresh();
      await backfillFromAnalysis(bookId);
      await refresh();
    } catch (err) {
      console.error('Re-analysis failed:', err);
      alert(`Re-analysis failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setAnalyzingBookIds((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
    }
  }, [refresh, backfillFromAnalysis]);

  const bulkImport = useCallback(async (booksData: Omit<Book, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    if (!user) throw new Error('Not authenticated');

    const created: Book[] = [];
    for (const bookData of booksData) {
      const newBook = await createBook({ ...bookData, user_id: user.id });
      created.push(newBook);
    }

    setBooks((prev) => [...created.map((b) => ({ ...b })), ...prev]);
    return created;
  }, [user]);

  return {
    books,
    loading,
    error,
    analyzingBookIds,
    addBook,
    editBook,
    removeBook,
    reanalyzeBook,
    bulkImport,
    refresh,
  };
}
