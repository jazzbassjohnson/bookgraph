import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { searchBooks, type OpenLibraryResult } from '../lib/openLibrary';
import type { Book } from '../types';
import { Modal } from './Modal';

interface BookSearchModalProps {
  onAdd: (book: Book) => void;
  onManualAdd: () => void;
  onClose: () => void;
}

export function BookSearchModal({ onAdd, onManualAdd, onClose }: BookSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchBooks(query.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = (result: OpenLibraryResult) => {
    const book: Book = {
      id: uuidv4(),
      user_id: '',
      title: result.title,
      authors: result.authors,
      year: result.year,
      topics: [],
      themes: [],
      tags: [],
    };
    onAdd(book);
  };

  return (
    <Modal title="Add Book" onClose={onClose}>
      <input
        ref={inputRef}
        type="text"
        className="book-search-input"
        placeholder="Search by title or author..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="book-search-results">
        {loading && (
          <div className="book-search-loading">
            <div className="loading-spinner small">
              <div className="spinner" />
              <p className="spinner-message">Searching...</p>
            </div>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="no-results">
            <p>No books found for "{query}"</p>
          </div>
        )}

        {!loading &&
          results.map((result, index) => (
            <div key={index} className="book-search-result-item">
              {result.coverUrl ? (
                <img
                  className="book-cover-thumb"
                  src={result.coverUrl}
                  alt=""
                />
              ) : (
                <div className="book-cover-thumb book-cover-placeholder" />
              )}
              <div className="book-search-result-info">
                <div className="book-search-result-title">{result.title}</div>
                {result.authors.length > 0 && (
                  <div className="book-search-result-author">
                    {result.authors.join(', ')}
                  </div>
                )}
                {result.year && (
                  <div className="book-search-result-year">{result.year}</div>
                )}
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => handleAdd(result)}
              >
                Add
              </button>
            </div>
          ))}
      </div>

      <div className="book-search-footer">
        <button className="book-search-manual-link" onClick={onManualAdd}>
          Add manually instead
        </button>
      </div>
    </Modal>
  );
}
