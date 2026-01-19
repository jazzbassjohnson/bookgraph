import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Book } from '../types';

interface BookFormProps {
  book?: Book;
  onSave: (book: Book) => void;
  onCancel: () => void;
}

export function BookForm({ book, onSave, onCancel }: BookFormProps) {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [topics, setTopics] = useState('');
  const [themes, setThemes] = useState('');
  const [tags, setTags] = useState('');
  const [year, setYear] = useState('');
  const [rating, setRating] = useState('');
  const [dateRead, setDateRead] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthors(book.authors.join(', '));
      setTopics(book.topics.join(', '));
      setThemes(book.themes.join(', '));
      setTags(book.tags.join(', '));
      setYear(book.year?.toString() || '');
      setRating(book.rating?.toString() || '');
      setDateRead(book.dateRead || '');
      setNotes(book.notes || '');
    }
  }, [book]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newBook: Book = {
      id: book?.id || uuidv4(),
      title: title.trim(),
      authors: parseCommaSeparated(authors),
      topics: parseCommaSeparated(topics),
      themes: parseCommaSeparated(themes),
      tags: parseCommaSeparated(tags),
      year: year ? parseInt(year, 10) : undefined,
      rating: rating ? parseInt(rating, 10) : undefined,
      dateRead: dateRead || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(newBook);
  };

  const parseCommaSeparated = (str: string): string[] => {
    return str
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Book title"
        />
      </div>

      <div className="form-group">
        <label htmlFor="authors">Author(s)</label>
        <input
          id="authors"
          type="text"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="Author 1, Author 2"
        />
        <p className="form-hint">Separate multiple authors with commas</p>
      </div>

      <div className="form-group">
        <label htmlFor="topics">Topics</label>
        <input
          id="topics"
          type="text"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="Technology, Science, History"
        />
        <p className="form-hint">Separate with commas</p>
      </div>

      <div className="form-group">
        <label htmlFor="themes">Themes</label>
        <input
          id="themes"
          type="text"
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
          placeholder="Freedom, Identity, Love"
        />
        <p className="form-hint">Separate with commas</p>
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="sci-fi, classic, must-read"
        />
        <p className="form-hint">Separate with commas</p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="year">Year Published</label>
          <input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="1984"
            min="1"
            max={new Date().getFullYear() + 1}
          />
        </div>

        <div className="form-group">
          <label htmlFor="rating">Rating (1-5)</label>
          <input
            id="rating"
            type="number"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="5"
            min="1"
            max="5"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="dateRead">Date Read</label>
        <input
          id="dateRead"
          type="date"
          value={dateRead}
          onChange={(e) => setDateRead(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Your thoughts about this book..."
        />
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {book ? 'Update' : 'Add'} Book
        </button>
      </div>
    </form>
  );
}
