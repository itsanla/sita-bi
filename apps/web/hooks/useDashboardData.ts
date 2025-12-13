import { useQuery, UseQueryResult } from '@tanstack/react-query';
import api from '@/lib/api';
import { usePeriode } from '@/context/PeriodeContext';

interface DashboardStats {
  tugasAkhir: {
    total: number;
    disetujui: number;
    pending: number;
    ditolak: number;
  };
  bimbingan: { total: number; bulanIni: number; rataRata: number };
  sidang: { status: string; tanggal: string | null };
  progress: { percentage: number; tahap: string };
}

interface Activity {
  id: string;
  type:
    | 'approval'
    | 'bimbingan'
    | 'pengajuan'
    | 'perubahan_status'
    | 'rejection';
  title: string;
  description: string;
  createdAt: string;
}

interface Schedule {
  id: string;
  title: string;
  type: 'bimbingan' | 'sidang';
  date: string;
  time: string;
  location: string;
  with: string;
  status: 'completed' | 'today' | 'upcoming';
}

interface ProgressData {
  statusTA: string;
  bimbinganCount: number;
  minBimbingan: number;
  tanggalDisetujui?: string;
}

interface SystemStats {
  totalDosen: number;
  totalMahasiswa: number;
  totalJudulTA: number;
}

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;

export function useDashboardStats(): UseQueryResult<DashboardStats> {
  const { selectedPeriodeId } = usePeriode();
  return useQuery<DashboardStats>({
    queryKey: ['mahasiswaDashboardStats', selectedPeriodeId],
    queryFn: async () => {
      const params = selectedPeriodeId
        ? `?periode_ta_id=${selectedPeriodeId}`
        : '';
      const response = await api.get(`/dashboard/mahasiswa/stats${params}`);
      return response.data.data;
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
    enabled: !!selectedPeriodeId,
  });
}

export function useDashboardActivities(limit = 10): UseQueryResult<Activity[]> {
  const { selectedPeriodeId } = usePeriode();
  return useQuery<Activity[]>({
    queryKey: ['mahasiswaActivities', limit, selectedPeriodeId],
    queryFn: async () => {
      const params = selectedPeriodeId
        ? `&periode_ta_id=${selectedPeriodeId}`
        : '';
      const response = await api.get(
        `/dashboard/mahasiswa/activities?limit=${limit}${params}`,
      );
      return response.data.data;
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
    enabled: !!selectedPeriodeId,
  });
}

export function useDashboardSchedule(limit = 5): UseQueryResult<Schedule[]> {
  const { selectedPeriodeId } = usePeriode();
  return useQuery<Schedule[]>({
    queryKey: ['mahasiswaSchedule', limit, selectedPeriodeId],
    queryFn: async () => {
      const params = selectedPeriodeId
        ? `&periode_ta_id=${selectedPeriodeId}`
        : '';
      const response = await api.get(
        `/dashboard/mahasiswa/schedule?limit=${limit}${params}`,
      );
      return response.data.data;
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
    enabled: !!selectedPeriodeId,
  });
}

export function useDashboardProgress(): UseQueryResult<ProgressData> {
  const { selectedPeriodeId } = usePeriode();
  return useQuery<ProgressData>({
    queryKey: ['mahasiswaProgress', selectedPeriodeId],
    queryFn: async () => {
      const params = selectedPeriodeId
        ? `?periode_ta_id=${selectedPeriodeId}`
        : '';
      const response = await api.get(`/dashboard/mahasiswa/progress${params}`);
      return response.data.data;
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
    enabled: !!selectedPeriodeId,
  });
}

export function useSystemStats(): UseQueryResult<SystemStats> {
  const { selectedPeriodeId } = usePeriode();
  return useQuery<SystemStats>({
    queryKey: ['systemStats', selectedPeriodeId],
    queryFn: async () => {
      const params = selectedPeriodeId
        ? `?periode_ta_id=${selectedPeriodeId}`
        : '';
      const response = await api.get(
        `/dashboard/mahasiswa/system-stats${params}`,
      );
      return response.data.data;
    },
    staleTime: STALE_TIME * 2,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
    enabled: !!selectedPeriodeId,
  });
}
