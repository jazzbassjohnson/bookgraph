import type { Book, BookSuggestion } from '../types';

interface SuggestionsPanelProps {
  suggestions: BookSuggestion[];
  books: Book[];
  onDismiss: (id: string) => void;
  onAddToLibrary: (title: string, authors: string[]) => void;
  onClose: () => void;
}

export function SuggestionsPanel({
  suggestions,
  books,
  onDismiss,
  onAddToLibrary,
  onClose,
}: SuggestionsPanelProps) {
  const getRelatedBookTitles = (relatedIds: string[]) => {
    return relatedIds
      .map((id) => books.find((b) => b.id === id))
      .filter(Boolean)
      .map((b) => b!.title);
  };

  if (suggestions.length === 0) {
    return (
      <div className="suggestions-panel">
        <div className="suggestions-header">
          <h2>Book Suggestions</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <p className="suggestions-empty">
          No suggestions yet. Click "Get Suggestions" to get AI-powered recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="suggestions-panel">
      <div className="suggestions-header">
        <h2>Book Suggestions</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      <div className="suggestions-list">
        {suggestions.map((suggestion) => {
          const relatedTitles = getRelatedBookTitles(suggestion.related_book_ids);
          return (
            <div key={suggestion.id} className="suggestion-card">
              <div className="suggestion-card-header">
                <h3>{suggestion.title}</h3>
                {suggestion.authors.length > 0 && (
                  <p className="book-authors">{suggestion.authors.join(', ')}</p>
                )}
              </div>
              {suggestion.reason && (
                <p className="suggestion-reason">{suggestion.reason}</p>
              )}
              {relatedTitles.length > 0 && (
                <p className="suggestion-related">
                  Based on: {relatedTitles.join(', ')}
                </p>
              )}
              <div className="suggestion-actions">
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => onAddToLibrary(suggestion.title, suggestion.authors)}
                >
                  Add to Library
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => onDismiss(suggestion.id)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
