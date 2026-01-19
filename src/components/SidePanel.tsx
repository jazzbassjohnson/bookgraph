import type { Book, GraphNode } from '../types';
import { findRelatedBooks, getConnectedBooks } from '../graphBuilder';

interface SidePanelProps {
  node: GraphNode;
  books: Book[];
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
}

export function SidePanel({ node, books, onClose, onNodeClick }: SidePanelProps) {
  const isBookNode = node.type === 'book';
  const book = isBookNode
    ? books.find((b) => b.id === node.bookId)
    : null;

  const connectedBooks = !isBookNode
    ? getConnectedBooks(node.id, books)
    : [];

  const relatedBooks = book ? findRelatedBooks(book, books) : [];

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'book':
        return 'rgba(99, 102, 241, 0.3)';
      case 'author':
        return 'rgba(245, 158, 11, 0.3)';
      case 'topic':
        return 'rgba(16, 185, 129, 0.3)';
      case 'theme':
        return 'rgba(236, 72, 153, 0.3)';
      case 'tag':
        return 'rgba(139, 92, 246, 0.3)';
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case 'book':
        return 'var(--accent-primary)';
      case 'author':
        return 'var(--author-color)';
      case 'topic':
        return 'var(--topic-color)';
      case 'theme':
        return 'var(--theme-color)';
      case 'tag':
        return 'var(--tag-color)';
      default:
        return 'var(--text-primary)';
    }
  };

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h2>{node.name}</h2>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
      </div>

      <span
        className="node-type-badge"
        style={{
          background: getTypeColor(node.type),
          color: getTypeTextColor(node.type),
        }}
      >
        {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
      </span>

      {isBookNode && book && (
        <>
          {book.authors.length > 0 && (
            <div className="side-panel-section">
              <h3>Authors</h3>
              <div className="attribute-list">
                {book.authors.map((author) => (
                  <span
                    key={author}
                    className="attribute-chip chip-author"
                    onClick={() => onNodeClick(`author:${author}`)}
                  >
                    {author}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="side-panel-section">
            <h3>Details</h3>
            <div className="book-meta">
              {book.year && <span>Published: {book.year}</span>}
              {book.rating && (
                <span className="star-rating">{renderStars(book.rating)}</span>
              )}
              {book.dateRead && <span>Read: {book.dateRead}</span>}
            </div>
          </div>

          {book.topics.length > 0 && (
            <div className="side-panel-section">
              <h3>Topics</h3>
              <div className="attribute-list">
                {book.topics.map((topic) => (
                  <span
                    key={topic}
                    className="attribute-chip chip-topic"
                    onClick={() => onNodeClick(`topic:${topic}`)}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {book.themes.length > 0 && (
            <div className="side-panel-section">
              <h3>Themes</h3>
              <div className="attribute-list">
                {book.themes.map((theme) => (
                  <span
                    key={theme}
                    className="attribute-chip chip-theme"
                    onClick={() => onNodeClick(`theme:${theme}`)}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {book.tags.length > 0 && (
            <div className="side-panel-section">
              <h3>Tags</h3>
              <div className="attribute-list">
                {book.tags.map((tag) => (
                  <span
                    key={tag}
                    className="attribute-chip chip-tag"
                    onClick={() => onNodeClick(`tag:${tag}`)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {book.notes && (
            <div className="side-panel-section">
              <h3>Notes</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                {book.notes}
              </p>
            </div>
          )}

          {relatedBooks.length > 0 && (
            <div className="side-panel-section">
              <h3>Related Books ({relatedBooks.length})</h3>
              <div className="book-list">
                {relatedBooks.map((relatedBook) => (
                  <div
                    key={relatedBook.id}
                    className="book-list-item"
                    onClick={() => onNodeClick(`book:${relatedBook.id}`)}
                  >
                    <strong>{relatedBook.title}</strong>
                    {relatedBook.authors.length > 0 && (
                      <p className="book-authors">
                        {relatedBook.authors.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!isBookNode && (
        <div className="side-panel-section">
          <h3>Connected Books ({connectedBooks.length})</h3>
          <div className="book-list">
            {connectedBooks.map((connectedBook) => (
              <div
                key={connectedBook.id}
                className="book-list-item"
                onClick={() => onNodeClick(`book:${connectedBook.id}`)}
              >
                <strong>{connectedBook.title}</strong>
                {connectedBook.authors.length > 0 && (
                  <p className="book-authors">
                    {connectedBook.authors.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
