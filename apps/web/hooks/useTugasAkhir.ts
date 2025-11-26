import { useState, useEffect } from 'react';
import request from '@/lib/api';

interface TugasAkhir {
  id: number;
  judul: string;
  status: string;
  peranDosenTa: { peran: string; dosen: { user: { name: string } } }[];
}

interface TawaranTopik {
  id: number;
  judul_topik: string;
  deskripsi: string;
  kuota: number;
  dosenPencetus: {
    name: string;
  };
}

export function useTugasAkhir() {
  const [tugasAkhir, setTugasAkhir] = useState<TugasAkhir | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const taResponse = await request<{ data: TugasAkhir | null }>(
        '/tugas-akhir/my-ta',
      );
      setTugasAkhir(taResponse.data?.data || null);
    } catch (err: unknown) {
      if (
        (err as { response?: { status?: number } }).response?.status !== 404
      ) {
        setError((err as Error).message || 'Failed to fetch data');
      }
      setTugasAkhir(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteTugasAkhir = async () => {
    try {
      await request('/tugas-akhir/my-ta', { method: 'DELETE' });
      await fetchData();
    } catch (err: unknown) {
      throw new Error((err as Error).message);
    }
  };

  return { tugasAkhir, loading, error, refetch: fetchData, deleteTugasAkhir };
}

export function useRecommendedTopics() {
  const [recommendedTitles, setRecommendedTitles] = useState<TawaranTopik[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const fetchRecommendedTitles = async () => {
    setLoading(true);
    try {
      const topicsResponse = await request<{
        data: { topics: TawaranTopik[] };
      }>('/tawaran-topik/available');
      setRecommendedTitles(topicsResponse.data.data.topics || []);
    } catch {
      // Silently fail for recommended topics
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendedTitles();
  }, []);

  return { recommendedTitles, loading };
}

export function useAllTitles() {
  const [allTitles, setAllTitles] = useState<{ judul: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllTitles = async () => {
    setLoading(true);
    try {
      const titlesResponse = await request<{ data: { judul: string }[] }>(
        '/tugas-akhir/all-titles',
      );
      setAllTitles(titlesResponse.data.data || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTitles();
  }, []);

  return { allTitles, loading, refetch: fetchAllTitles };
}

interface SimilarityResult {
  id: number;
  judul: string;
  similarity: number;
}

export function useSimilarityCheck() {
  const [similarityResults, setSimilarityResults] = useState<
    SimilarityResult[] | null
  >(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkSimilarity = async (judul: string) => {
    setIsChecking(true);
    setSimilarityResults(null);
    setIsBlocked(false);
    try {
      const response = await request<{
        data: {
          results: SimilarityResult[];
          isBlocked: boolean;
        };
      }>('/tugas-akhir/check-similarity', {
        method: 'POST',
        data: { judul },
      });
      setSimilarityResults(response.data.data.results || []);
      setIsBlocked(response.data.data.isBlocked || false);
    } catch (err: unknown) {
      throw new Error((err as Error).message);
    } finally {
      setIsChecking(false);
    }
  };

  const reset = () => {
    setSimilarityResults(null);
    setIsBlocked(false);
  };

  return {
    similarityResults,
    isBlocked,
    isChecking,
    checkSimilarity,
    reset,
  };
}

export function useSubmitTitle() {
  const [loading, setLoading] = useState(false);

  const submitTitle = async (judul: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      await request('/tugas-akhir/', {
        method: 'POST',
        data: { judul },
      });
      onSuccess?.();
    } catch (err: unknown) {
      throw new Error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { submitTitle, loading };
}
