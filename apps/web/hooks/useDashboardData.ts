import { useQuery, UseQueryResult } from '@tantml:parameter>query';
import api from '@/lib/api';

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
  return useQuery<DashboardStats>({
    queryKey: ['mahasiswaDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/mahasiswa/stats');
      return response.data.data;
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
  });
}

export function useDashboardActivities(limit = 10): UseQueryResult<Activity[]> {
  return useQuery<Activity[]>({
    queryKey: ['mahasiswaActivities', limit],
    queryFn: async () => {
      const response = await api.get(
        `/dashboard/mahasiswa/activities?limit=${limit}`,
      );
      return response.data.data;
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
  });
}

export function useDashboardSchedule(limit = 5): UseQueryResult<Schedule[]> {
  return useQuery<Schedule[]>({
    queryKey: ['mahasiswaSchedule', limit],
    queryFn: async () => {
      const response = await api.get(
        `/dashboard/mahasiswa/schedule?limit=${limit}`,
      );
      return response.data.data;
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
  });
}

export function useDashboardProgress(): UseQueryResult<ProgressData> {
  return useQuery<ProgressData>({
    queryKey: ['mahasiswaProgress'],
    queryFn: async () => {
      const response = await api.get('/dashboard/mahasiswa/progress');
      return response.data.data;
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
  });
}

export function useSystemStats(): UseQueryResult<SystemStats> {
  return useQuery<SystemStats>({
    queryKey: ['systemStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/mahasiswa/system-stats');
      return response.data.data;
    },
    staleTime: STALE_TIME * 2, // 10 minutes for system stats
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
  });
}
