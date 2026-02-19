import type { Book } from './types';

interface LegacyLibraryData {
  books: Omit<Book, 'user_id'>[];
  version: number;
}

const STORAGE_KEY = 'bookgraph.library.v1';
const CURRENT_VERSION = 1;

/**
 * Check if there's existing data in localStorage (for migration to Supabase).
 */
export function hasLocalData(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const data: LegacyLibraryData = JSON.parse(stored);
    return Array.isArray(data.books) && data.books.length > 0;
  } catch {
    return false;
  }
}

/**
 * Load books from localStorage (for migration purposes only).
 */
export function loadLibrary(): Omit<Book, 'user_id'>[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data: LegacyLibraryData = JSON.parse(stored);
    return data.books || [];
  } catch {
    console.error('Failed to load library from localStorage');
    return [];
  }
}

/**
 * Clear localStorage data after successful migration.
 */
export function clearLocalData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportLibrary(books: Omit<Book, 'user_id'>[]): string {
  const data: LegacyLibraryData = {
    books,
    version: CURRENT_VERSION,
  };
  return JSON.stringify(data, null, 2);
}

export function importLibrary(jsonString: string): Omit<Book, 'user_id'>[] {
  const data: LegacyLibraryData = JSON.parse(jsonString);
  if (!data.books || !Array.isArray(data.books)) {
    throw new Error('Invalid library data format');
  }
  return data.books;
}

export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
