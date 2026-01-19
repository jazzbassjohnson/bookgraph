import type { Book, LibraryData } from './types';

const STORAGE_KEY = 'bookgraph.library.v1';
const CURRENT_VERSION = 1;

export function loadLibrary(): Book[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data: LibraryData = JSON.parse(stored);
    return data.books || [];
  } catch {
    console.error('Failed to load library from localStorage');
    return [];
  }
}

export function saveLibrary(books: Book[]): void {
  try {
    const data: LibraryData = {
      books,
      version: CURRENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save library to localStorage', error);
  }
}

export function exportLibrary(books: Book[]): string {
  const data: LibraryData = {
    books,
    version: CURRENT_VERSION,
  };
  return JSON.stringify(data, null, 2);
}

export function importLibrary(jsonString: string): Book[] {
  const data: LibraryData = JSON.parse(jsonString);
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
