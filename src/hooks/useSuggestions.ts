import { useState, useEffect, useCallback } from 'react';
import type { BookSuggestion } from '../types';
import { fetchSuggestions, dismissSuggestion } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function useSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchSuggestions();
      setSuggestions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dismiss = useCallback(async (id: string) => {
    await dismissSuggestion(id);
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { suggestions, loading, error, dismiss, refresh };
}
