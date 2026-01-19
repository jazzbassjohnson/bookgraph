import { useState, useMemo } from 'react';
import type { Book } from '../types';
import { BookCard } from './BookCard';
import { BookForm } from './BookForm';
import { Modal } from './Modal';
import { BulkImportModal } from './BulkImportModal';

interface LibraryProps {
  books: Book[];
  onAddBook: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onBulkImport: (books: Book[]) => void;
}

export function Library({
  books,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onBulkImport,
}: LibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [filterValue, setFilterValue] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Collect all unique values for filters
  const filterOptions = useMemo(() => {
    const authors = new Set<string>();
    const topics = new Set<string>();
    const themes = new Set<string>();
    const tags = new Set<string>();

    books.forEach((book) => {
      book.authors.forEach((a) => authors.add(a));
      book.topics.forEach((t) => topics.add(t));
      book.themes.forEach((t) => themes.add(t));
      book.tags.forEach((t) => tags.add(t));
    });

    return {
      authors: Array.from(authors).sort(),
      topics: Array.from(topics).sort(),
      themes: Array.from(themes).sort(),
      tags: Array.from(tags).sort(),
    };
  }, [books]);

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        book.title.toLowerCase().includes(searchLower) ||
        book.authors.some((a) => a.toLowerCase().includes(searchLower)) ||
        book.topics.some((t) => t.toLowerCase().includes(searchLower)) ||
        book.themes.some((t) => t.toLowerCase().includes(searchLower)) ||
        book.tags.some((t) => t.toLowerCase().includes(searchLower));

      // Category filter
      let matchesFilter = true;
      if (filterBy !== 'all' && filterValue) {
        switch (filterBy) {
          case 'author':
            matchesFilter = book.authors.includes(filterValue);
            break;
          case 'topic':
            matchesFilter = book.topics.includes(filterValue);
            break;
          case 'theme':
            matchesFilter = book.themes.includes(filterValue);
            break;
          case 'tag':
            matchesFilter = book.tags.includes(filterValue);
            break;
        }
      }

      return matchesSearch && matchesFilter;
    });
  }, [books, searchTerm, filterBy, filterValue]);

  const handleSave = (book: Book) => {
    if (editingBook) {
      onUpdateBook(book);
      setEditingBook(null);
    } else {
      onAddBook(book);
      setShowAddModal(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      onDeleteBook(id);
    }
  };

  const getFilterValues = () => {
    switch (filterBy) {
      case 'author':
        return filterOptions.authors;
      case 'topic':
        return filterOptions.topics;
      case 'theme':
        return filterOptions.themes;
      case 'tag':
        return filterOptions.tags;
      default:
        return [];
    }
  };

  return (
    <div className="library-view">
      <div className="library-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="filter-select"
          value={filterBy}
          onChange={(e) => {
            setFilterBy(e.target.value);
            setFilterValue('');
          }}
        >
          <option value="all">All Books</option>
          <option value="author">Filter by Author</option>
          <option value="topic">Filter by Topic</option>
          <option value="theme">Filter by Theme</option>
          <option value="tag">Filter by Tag</option>
        </select>

        {filterBy !== 'all' && (
          <select
            className="filter-select"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          >
            <option value="">Select {filterBy}...</option>
            {getFilterValues().map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        )}

        <button
          className="btn btn-secondary"
          onClick={() => setShowBulkImport(true)}
        >
          Bulk Import
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          Add Book
        </button>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="empty-state">
          <h2>No books found</h2>
          <p>
            {books.length === 0
              ? 'Add your first book to get started!'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={setEditingBook}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <Modal title="Add New Book" onClose={() => setShowAddModal(false)}>
          <BookForm
            onSave={handleSave}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {editingBook && (
        <Modal title="Edit Book" onClose={() => setEditingBook(null)}>
          <BookForm
            book={editingBook}
            onSave={handleSave}
            onCancel={() => setEditingBook(null)}
          />
        </Modal>
      )}

      {showBulkImport && (
        <BulkImportModal
          onImport={onBulkImport}
          onClose={() => setShowBulkImport(false)}
        />
      )}
    </div>
  );
}
