import type { BookWithAnalysis } from '../types';

interface BookCardProps {
  book: BookWithAnalysis;
  isAnalyzing?: boolean;
  onEdit: (book: BookWithAnalysis) => void;
  onDelete: (id: string) => void;
  onReanalyze?: (id: string) => void;
}

export function BookCard({ book, isAnalyzing, onEdit, onDelete, onReanalyze }: BookCardProps) {
  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const analysis = book.analysis;

  return (
    <div className="book-card">
      <div className="book-card-header">
        <h3>{book.title}</h3>
        <div className="book-card-actions">
          {onReanalyze && (
            <button
              className="btn btn-secondary btn-small"
              onClick={() => onReanalyze(book.id)}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
          )}
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

      {analysis?.ai_summary && (
        <p className="book-ai-summary">{analysis.ai_summary}</p>
      )}

      {isAnalyzing && (
        <p className="book-analyzing-indicator">Analyzing with AI...</p>
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
          <span key={`user-topic-${topic}`} className="attribute-badge badge-topic">
            {topic}
          </span>
        ))}
        {book.themes.map((theme) => (
          <span key={`user-theme-${theme}`} className="attribute-badge badge-theme">
            {theme}
          </span>
        ))}
        {book.tags.map((tag) => (
          <span key={`user-tag-${tag}`} className="attribute-badge badge-tag">
            {tag}
          </span>
        ))}
      </div>

      {analysis && (
        <div className="book-ai-attributes">
          {analysis.ai_topics.filter((t) => !book.topics.includes(t)).map((topic) => (
            <span key={`ai-topic-${topic}`} className="attribute-badge badge-topic badge-ai">
              {topic}
            </span>
          ))}
          {analysis.ai_themes.filter((t) => !book.themes.includes(t)).map((theme) => (
            <span key={`ai-theme-${theme}`} className="attribute-badge badge-theme badge-ai">
              {theme}
            </span>
          ))}
          {analysis.ai_tags.filter((t) => !book.tags.includes(t)).map((tag) => (
            <span key={`ai-tag-${tag}`} className="attribute-badge badge-tag badge-ai">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
