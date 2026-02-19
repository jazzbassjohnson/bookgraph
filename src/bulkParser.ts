import { v4 as uuidv4 } from 'uuid';
import type { Book } from './types';

type ParsedBook = Omit<Book, 'user_id'>;

/**
 * Parse bulk text input into books.
 * Supports formats:
 * 1. "Title by Author" (one per line)
 * 2. "Title - Author" (one per line)
 * 3. "Title | Author | Topics | Themes | Tags" (pipe-separated)
 */
export function parseBulkInput(text: string): ParsedBook[] {
  const lines = text.split('\n').filter((line) => line.trim());
  const books: ParsedBook[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let book: ParsedBook | null = null;

    // Try pipe-separated format first (more specific)
    if (trimmed.includes('|')) {
      book = parsePipeSeparated(trimmed);
    }
    // Try "by" format
    else if (trimmed.toLowerCase().includes(' by ')) {
      book = parseByFormat(trimmed);
    }
    // Try dash format
    else if (trimmed.includes(' - ')) {
      book = parseDashFormat(trimmed);
    }
    // Fallback: just title
    else {
      book = {
        id: uuidv4(),
        title: trimmed,
        authors: [],
        topics: [],
        themes: [],
        tags: [],
      };
    }

    if (book) {
      books.push(book);
    }
  }

  return books;
}

function parseByFormat(line: string): ParsedBook {
  const match = line.match(/^(.+?)\s+by\s+(.+)$/i);
  if (match) {
    return {
      id: uuidv4(),
      title: match[1].trim(),
      authors: parseCommaSeparated(match[2]),
      topics: [],
      themes: [],
      tags: [],
    };
  }
  return {
    id: uuidv4(),
    title: line,
    authors: [],
    topics: [],
    themes: [],
    tags: [],
  };
}

function parseDashFormat(line: string): ParsedBook {
  const parts = line.split(' - ');
  return {
    id: uuidv4(),
    title: parts[0].trim(),
    authors: parts[1] ? parseCommaSeparated(parts[1]) : [],
    topics: [],
    themes: [],
    tags: [],
  };
}

function parsePipeSeparated(line: string): ParsedBook {
  const parts = line.split('|').map((p) => p.trim());
  return {
    id: uuidv4(),
    title: parts[0] || 'Untitled',
    authors: parts[1] ? parseCommaSeparated(parts[1]) : [],
    topics: parts[2] ? parseCommaSeparated(parts[2]) : [],
    themes: parts[3] ? parseCommaSeparated(parts[3]) : [],
    tags: parts[4] ? parseCommaSeparated(parts[4]) : [],
  };
}

function parseCommaSeparated(str: string): string[] {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
