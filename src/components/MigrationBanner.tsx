import { useState, useEffect } from 'react';
import { hasLocalData, loadLibrary, clearLocalData } from '../storage';
import { createBook } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface MigrationBannerProps {
  onMigrated: () => void;
}

export function MigrationBanner({ onMigrated }: MigrationBannerProps) {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (user && hasLocalData()) {
      setShowBanner(true);
    }
  }, [user]);

  if (!showBanner) return null;

  const handleMigrate = async () => {
    if (!user) return;
    setMigrating(true);
    try {
      const localBooks = loadLibrary();
      for (const book of localBooks) {
        await createBook({
          user_id: user.id,
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
      }
      clearLocalData();
      setShowBanner(false);
      onMigrated();
    } catch (err) {
      console.error('Migration failed:', err);
      alert('Migration failed. Your local data is preserved.');
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  return (
    <div className="migration-banner">
      <p>
        We found {loadLibrary().length} books in your browser's local storage.
        Would you like to import them into your account?
      </p>
      <div className="migration-actions">
        <button
          className="btn btn-primary btn-small"
          onClick={handleMigrate}
          disabled={migrating}
        >
          {migrating ? 'Importing...' : 'Import Books'}
        </button>
        <button
          className="btn btn-secondary btn-small"
          onClick={handleDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
