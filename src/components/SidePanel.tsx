import type { BookWithAnalysis, BookConnection, BookSuggestion, GraphNode } from '../types';
import { findRelatedBooks, getConnectedBooks } from '../graphBuilder';

interface SidePanelProps {
  node: GraphNode;
  books: BookWithAnalysis[];
  connections: BookConnection[];
  suggestions: BookSuggestion[];
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
}

export function SidePanel({ node, books, connections, suggestions, onClose, onNodeClick }: SidePanelProps) {
  const isBookNode = node.type === 'book';
  const isSuggestionNode = node.type === 'suggestion';

  const book = isBookNode
    ? books.find((b) => b.id === node.bookId)
    : null;

  const suggestion = isSuggestionNode
    ? suggestions.find((s) => s.id === node.suggestionId)
    : null;

  const connectedBooks = (!isBookNode && !isSuggestionNode)
    ? getConnectedBooks(node.id, books)
    : [];

  const relatedBooks = book ? findRelatedBooks(book, books) : [];

  // AI connections for this book
  const aiConnections = book
    ? connections.filter((c) => c.book_a_id === book.id || c.book_b_id === book.id)
    : [];

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
      case 'suggestion':
        return 'rgba(99, 102, 241, 0.2)';
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
      case 'suggestion':
        return 'var(--text-secondary)';
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
        {node.type === 'suggestion' ? 'Suggestion' : node.type.charAt(0).toUpperCase() + node.type.slice(1)}
      </span>

      {/* Book node details */}
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

          {book.analysis?.ai_summary && (
            <div className="side-panel-section">
              <h3>AI Summary</h3>
              <p className="ai-summary-text">{book.analysis.ai_summary}</p>
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

          {(book.topics.length > 0 || (book.analysis?.ai_topics || []).length > 0) && (
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
                {(book.analysis?.ai_topics || [])
                  .filter((t) => !book.topics.includes(t))
                  .map((topic) => (
                    <span
                      key={`ai-${topic}`}
                      className="attribute-chip chip-topic chip-ai"
                      onClick={() => onNodeClick(`topic:${topic}`)}
                    >
                      {topic}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {(book.themes.length > 0 || (book.analysis?.ai_themes || []).length > 0) && (
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
                {(book.analysis?.ai_themes || [])
                  .filter((t) => !book.themes.includes(t))
                  .map((theme) => (
                    <span
                      key={`ai-${theme}`}
                      className="attribute-chip chip-theme chip-ai"
                      onClick={() => onNodeClick(`theme:${theme}`)}
                    >
                      {theme}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {(book.tags.length > 0 || (book.analysis?.ai_tags || []).length > 0) && (
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
                {(book.analysis?.ai_tags || [])
                  .filter((t) => !book.tags.includes(t))
                  .map((tag) => (
                    <span
                      key={`ai-${tag}`}
                      className="attribute-chip chip-tag chip-ai"
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

          {aiConnections.length > 0 && (
            <div className="side-panel-section">
              <h3>AI Connections ({aiConnections.length})</h3>
              <div className="book-list">
                {aiConnections.map((conn) => {
                  const otherBookId = conn.book_a_id === book.id ? conn.book_b_id : conn.book_a_id;
                  const otherBook = books.find((b) => b.id === otherBookId);
                  if (!otherBook) return null;
                  return (
                    <div
                      key={conn.id}
                      className="book-list-item ai-connection-item"
                      onClick={() => onNodeClick(`book:${otherBookId}`)}
                    >
                      <strong>{otherBook.title}</strong>
                      <span className="connection-type-badge">
                        {conn.connection_type}
                      </span>
                      <span className="connection-strength">
                        {Math.round(conn.strength * 100)}%
                      </span>
                      {conn.explanation && (
                        <p className="connection-explanation">{conn.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
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

      {/* Suggestion node details */}
      {isSuggestionNode && suggestion && (
        <>
          {suggestion.authors.length > 0 && (
            <div className="side-panel-section">
              <h3>Authors</h3>
              <p className="book-authors">{suggestion.authors.join(', ')}</p>
            </div>
          )}

          {suggestion.reason && (
            <div className="side-panel-section">
              <h3>Why This Book?</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                {suggestion.reason}
              </p>
            </div>
          )}

          {suggestion.related_book_ids.length > 0 && (
            <div className="side-panel-section">
              <h3>Based On</h3>
              <div className="book-list">
                {suggestion.related_book_ids.map((id) => {
                  const relBook = books.find((b) => b.id === id);
                  if (!relBook) return null;
                  return (
                    <div
                      key={id}
                      className="book-list-item"
                      onClick={() => onNodeClick(`book:${id}`)}
                    >
                      <strong>{relBook.title}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Attribute node details */}
      {!isBookNode && !isSuggestionNode && (
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
