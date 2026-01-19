import type { Book } from '../types';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
}

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="book-card">
      <div className="book-card-header">
        <h3>{book.title}</h3>
        <div className="book-card-actions">
          <button
            className="btn btn-secondary btn-small"
            onClick={() => onEdit(book)}
          >
            Edit
          </button>
          <button
            className="btn btn-danger btn-small"
            onClick={() => onDelete(book.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {book.authors.length > 0 && (
        <p className="book-authors">{book.authors.join(', ')}</p>
      )}

      <div className="book-meta">
        {book.year && <span>Published: {book.year}</span>}
        {book.rating && (
          <span className="star-rating">{renderStars(book.rating)}</span>
        )}
        {book.dateRead && <span>Read: {book.dateRead}</span>}
      </div>

      <div className="book-attributes">
        {book.topics.map((topic) => (
          <span key={topic} className="attribute-badge badge-topic">
            {topic}
          </span>
        ))}
        {book.themes.map((theme) => (
          <span key={theme} className="attribute-badge badge-theme">
            {theme}
          </span>
        ))}
        {book.tags.map((tag) => (
          <span key={tag} className="attribute-badge badge-tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
