import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface UseFetchOptions<T> {
  endpoint: string;
  dependencies?: unknown[];
  transform?: (_data: unknown) => T;
  enabled?: boolean;
}

interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFetch<T = unknown>({
  endpoint,
  dependencies = [],
  transform,
  enabled = true,
}: UseFetchOptions<T>): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api<{ data: unknown }>(endpoint);
      const transformedData = transform
        ? transform(response.data)
        : (response.data as T);
      setData(transformedData);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, enabled, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
}
