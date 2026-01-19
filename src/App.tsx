import { useState, useEffect, useRef } from 'react';
import './App.css';
import type { Book } from './types';
import { loadLibrary, saveLibrary, exportLibrary, importLibrary, downloadJson } from './storage';
import { generateSeedData } from './seedData';
import { Library } from './components/Library';
import { GraphView } from './components/GraphView';

type View = 'library' | 'graph';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [view, setView] = useState<View>('library');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadLibrary();
    setBooks(stored);
  }, []);

  // Save to localStorage when books change
  useEffect(() => {
    saveLibrary(books);
  }, [books]);

  const handleAddBook = (book: Book) => {
    setBooks((prev) => [...prev, book]);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks((prev) =>
      prev.map((book) => (book.id === updatedBook.id ? updatedBook : book))
    );
  };

  const handleDeleteBook = (id: string) => {
    setBooks((prev) => prev.filter((book) => book.id !== id));
  };

  const handleBulkImport = (newBooks: Book[]) => {
    setBooks((prev) => [...prev, ...newBooks]);
  };

  const handleExport = () => {
    const json = exportLibrary(books);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadJson(json, `bookgraph-library-${timestamp}.json`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedBooks = importLibrary(content);
        setBooks(importedBooks);
        alert(`Successfully imported ${importedBooks.length} books!`);
      } catch (error) {
        alert('Failed to import: Invalid file format');
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  const handleLoadSeedData = () => {
    if (books.length > 0) {
      if (!confirm('This will replace your current library. Continue?')) {
        return;
      }
    }
    const seedBooks = generateSeedData();
    setBooks(seedBooks);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>BookGraph</h1>
        <div className="header-actions">
          {view === 'library' && (
            <>
              <button className="btn btn-secondary" onClick={handleLoadSeedData}>
                Load Sample Data
              </button>
              <button className="btn btn-secondary" onClick={handleImportClick}>
                Import JSON
              </button>
              <button className="btn btn-secondary" onClick={handleExport}>
                Export JSON
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setView('graph')}
                disabled={books.length === 0}
              >
                Open Graph View
              </button>
            </>
          )}
          {view === 'graph' && (
            <button
              className="btn btn-secondary"
              onClick={() => setView('library')}
            >
              Back to Library
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </header>

      {view === 'library' && (
        <Library
          books={books}
          onAddBook={handleAddBook}
          onUpdateBook={handleUpdateBook}
          onDeleteBook={handleDeleteBook}
          onBulkImport={handleBulkImport}
        />
      )}

      {view === 'graph' && <GraphView books={books} />}
    </div>
  );
}

export default App;
