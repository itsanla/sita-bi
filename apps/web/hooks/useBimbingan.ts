import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import api from '@/lib/api';
import { usePeriode } from '@/context/PeriodeContext';

interface Bimbingan {
  id: number;
  sesi_ke: number;
  tanggal_bimbingan: string | null;
  jam_bimbingan: string | null;
  status_bimbingan: string;
  is_konfirmasi: boolean;
  dosen: {
    user: {
      name: string;
    };
  };
  peran: string;
}

interface TugasAkhirWithBimbingan {
  bimbinganTa: Bimbingan[];
}

export function useBimbinganMahasiswa(): UseQueryResult<Bimbingan[]> {
  const { selectedPeriodeId } = usePeriode();
  return useQuery<Bimbingan[]>({
    queryKey: ['bimbinganMahasiswa', selectedPeriodeId],
    queryFn: async () => {
      const response = await api.get<TugasAkhirWithBimbingan>(
        '/bimbingan/sebagai-mahasiswa',
      );
      return response.data.data?.bimbinganTa ?? [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: 1000,
    enabled: !!selectedPeriodeId,
  });
}

export function useCreateSesi() {
  return useMutation({
    mutationFn: async (tugasAkhirId: number) => {
      const response = await api.post('/bimbingan/sesi', {
        tugas_akhir_id: tugasAkhirId,
      });
      return response.data;
    },
  });
}

export function useDeleteSesi() {
  return useMutation({
    mutationFn: async (sesiId: number) => {
      const response = await api.delete(`/bimbingan/sesi/${sesiId}`);
      return response.data;
    },
  });
}

export function useSetJadwalSesi() {
  return useMutation({
    mutationFn: async (data: {
      bimbinganId: number;
      tanggal_bimbingan: string;
      jam_bimbingan: string;
      jam_selesai: string;
    }) => {
      const response = await api.put(
        `/bimbingan/sesi/${data.bimbinganId}/jadwal`,
        {
          tanggal_bimbingan: data.tanggal_bimbingan,
          jam_bimbingan: data.jam_bimbingan,
          jam_selesai: data.jam_selesai,
        },
      );
      return response.data;
    },
  });
}

export function useUploadLampiran() {
  return useMutation({
    mutationFn: async (data: { bimbinganId: number; files: FileList }) => {
      const formData = new FormData();
      Array.from(data.files).forEach((file) => formData.append('files', file));
      const token = localStorage.getItem('token');
      const periodeId = localStorage.getItem('selectedPeriodeId');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bimbingan/sesi/${data.bimbinganId}/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            ...(periodeId && { 'x-periode-id': periodeId }),
          },
          body: formData,
        },
      );
      if (!response.ok) throw new Error('Upload gagal');
      return response.json();
    },
  });
}

export function useAddCatatan() {
  return useMutation({
    mutationFn: async (data: { bimbingan_ta_id: number; catatan: string }) => {
      const response = await api.post('/bimbingan/catatan', data);
      return response.data;
    },
  });
}

export function useCheckEligibility(tugasAkhirId: number) {
  const { selectedPeriodeId } = usePeriode();
  return useQuery({
    queryKey: ['eligibility', tugasAkhirId, selectedPeriodeId],
    queryFn: async () => {
      const response = await api.get(`/bimbingan/eligibility/${tugasAkhirId}`);
      return response.data;
    },
    enabled: tugasAkhirId > 0 && !!selectedPeriodeId,
  });
}
