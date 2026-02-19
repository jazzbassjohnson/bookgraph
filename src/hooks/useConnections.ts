import { useState, useEffect, useCallback } from 'react';
import type { BookConnection } from '../types';
import { fetchConnections } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function useConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<BookConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchConnections();
      setConnections(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { connections, loading, error, refresh };
}
