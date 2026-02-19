import { useState, useRef } from 'react';
import './App.css';
import type { Book } from './types';
import { exportLibrary, importLibrary, downloadJson } from './storage';
import { generateSeedData } from './seedData';
import { useAuth } from './contexts/AuthContext';
import { useBooks } from './hooks/useBooks';
import { useConnections } from './hooks/useConnections';
import { useSuggestions } from './hooks/useSuggestions';
import { analyzeLibrary, suggestBooks } from './lib/api';
import { Library } from './components/Library';
import { GraphView } from './components/GraphView';
import { AuthPage } from './components/AuthPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { MigrationBanner } from './components/MigrationBanner';

type View = 'library' | 'graph';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    books,
    loading: booksLoading,
    analyzingBookIds,
    addBook,
    editBook,
    removeBook,
    reanalyzeBook,
    bulkImport,
    refresh: refreshBooks,
  } = useBooks();
  const { connections, refresh: refreshConnections } = useConnections();
  const { suggestions, dismiss: dismissSuggestion, refresh: refreshSuggestions } = useSuggestions();

  const [view, setView] = useState<View>('library');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [suggestingBooks, setSuggestingBooks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (authLoading) {
    return (
      <div className="app loading-screen">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleAddBook = async (book: Book) => {
    await addBook({
      title: book.title,
      authors: book.authors,
      topics: book.topics,
      themes: book.themes,
      tags: book.tags,
      year: book.year,
      rating: book.rating,
      dateRead: book.dateRead,
      notes: book.notes,
    });
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    await editBook(updatedBook.id, updatedBook);
  };

  const handleDeleteBook = async (id: string) => {
    await removeBook(id);
  };

  const handleBulkImport = async (newBooks: Omit<Book, 'user_id'>[]) => {
    await bulkImport(
      newBooks.map((b) => ({
        title: b.title,
        authors: b.authors,
        topics: b.topics,
        themes: b.themes,
        tags: b.tags,
        year: b.year,
        rating: b.rating,
        dateRead: b.dateRead,
        notes: b.notes,
      }))
    );
  };

  const handleExport = () => {
    const json = exportLibrary(books);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadJson(json, `bookgraph-library-${timestamp}.json`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const importedBooks = importLibrary(content);
        await bulkImport(
          importedBooks.map((b) => ({
            title: b.title,
            authors: b.authors,
            topics: b.topics,
            themes: b.themes,
            tags: b.tags,
            year: b.year,
            rating: b.rating,
            dateRead: b.dateRead,
            notes: b.notes,
          }))
        );
        alert(`Successfully imported ${importedBooks.length} books!`);
      } catch {
        alert('Failed to import: Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadSeedData = async () => {
    if (books.length > 0) {
      if (!confirm('This will add sample books to your library. Continue?')) {
        return;
      }
    }
    const seedBooks = generateSeedData();
    await bulkImport(
      seedBooks.map((b) => ({
        title: b.title,
        authors: b.authors,
        topics: b.topics,
        themes: b.themes,
        tags: b.tags,
        year: b.year,
        rating: b.rating,
        dateRead: b.dateRead,
        notes: b.notes,
      }))
    );
  };

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true);
    try {
      await analyzeLibrary();
      await refreshBooks();
      await refreshConnections();
    } catch (err) {
      console.error('Library analysis failed:', err);
      alert('Library analysis failed. Please try again.');
    } finally {
      setAnalyzingAll(false);
    }
  };

  const handleSuggestBooks = async () => {
    setSuggestingBooks(true);
    try {
      await suggestBooks();
      await refreshSuggestions();
      setShowSuggestions(true);
    } catch (err) {
      console.error('Suggestion generation failed:', err);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setSuggestingBooks(false);
    }
  };

  const handleAddSuggestionToLibrary = async (title: string, authors: string[]) => {
    await addBook({
      title,
      authors,
      topics: [],
      themes: [],
      tags: [],
    });
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
                className="btn btn-secondary"
                onClick={handleAnalyzeAll}
                disabled={analyzingAll || books.length === 0}
              >
                {analyzingAll ? 'Analyzing...' : 'Analyze Library'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSuggestBooks}
                disabled={suggestingBooks || books.length === 0}
              >
                {suggestingBooks ? 'Thinking...' : 'Get Suggestions'}
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
          <button className="btn btn-secondary" onClick={signOut}>
            Sign Out
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </header>

      <MigrationBanner onMigrated={refreshBooks} />

      {view === 'library' && (
        <>
          {booksLoading ? (
            <div className="loading-screen">
              <LoadingSpinner message="Loading your library..." />
            </div>
          ) : (
            <Library
              books={books}
              analyzingBookIds={analyzingBookIds}
              onAddBook={handleAddBook}
              onUpdateBook={handleUpdateBook}
              onDeleteBook={handleDeleteBook}
              onBulkImport={handleBulkImport}
              onReanalyze={reanalyzeBook}
            />
          )}
          {showSuggestions && (
            <SuggestionsPanel
              suggestions={suggestions}
              books={books}
              onDismiss={dismissSuggestion}
              onAddToLibrary={handleAddSuggestionToLibrary}
              onClose={() => setShowSuggestions(false)}
            />
          )}
        </>
      )}

      {view === 'graph' && (
        <GraphView
          books={books}
          connections={connections}
          suggestions={suggestions}
        />
      )}
    </div>
  );
}

export default App;
