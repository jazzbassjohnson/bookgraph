import { useState, useEffect, useCallback } from 'react';
import type { Book } from '../types';
import { fetchBooks, createBook, updateBook, deleteBook } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function useBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchBooks();
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

    return newBook;
  }, [user]);

  const editBook = useCallback(async (id: string, updates: Partial<Book>) => {
    const updated = await updateBook(id, updates);
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }, []);

  const removeBook = useCallback(async (id: string) => {
    await deleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

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
    addBook,
    editBook,
    removeBook,
    bulkImport,
    refresh,
  };
}
