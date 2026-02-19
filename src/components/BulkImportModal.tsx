import { useState } from 'react';
import type { Book } from '../types';
import { parseBulkInput } from '../bulkParser';
import { Modal } from './Modal';

interface BulkImportModalProps {
  onImport: (books: Omit<Book, 'user_id'>[]) => void;
  onClose: () => void;
}

export function BulkImportModal({ onImport, onClose }: BulkImportModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    setError(null);
    try {
      const books = parseBulkInput(text);
      if (books.length === 0) {
        setError('No books found in input');
        return;
      }
      onImport(books);
      onClose();
    } catch {
      setError('Failed to parse input');
    }
  };

  return (
    <Modal title="Bulk Import Books" onClose={onClose}>
      <textarea
        className="bulk-import-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Enter books, one per line. Supported formats:

Title by Author
Title - Author
Title | Author | Topics | Themes | Tags`}
      />
      <div className="bulk-import-hint">
        <p>
          <strong>Supported formats:</strong>
        </p>
        <p>
          <code>Title by Author</code>
        </p>
        <p>
          <code>Title - Author</code>
        </p>
        <p>
          <code>Title | Author | Topics | Themes | Tags</code> (comma-separated
          within each field)
        </p>
      </div>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleImport}>
          Import Books
        </button>
      </div>
    </Modal>
  );
}
