import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface BimbinganSession {
  id: number;
  status_bimbingan: string;
  tanggal_bimbingan: string | null;
  jam_bimbingan: string | null;
  catatan: unknown[];
  lampiran: unknown[];
}

interface TugasAkhir {
  id: number;
  judul: string;
  status: string;
  mahasiswa: {
    user: { name: string; email: string };
  };
  bimbinganTa: BimbinganSession[];
}

export function useBimbinganDosen() {
  return useQuery<{ data: TugasAkhir[] }>({
    queryKey: ['dosenBimbinganList'],
    queryFn: async () => {
      const response = await api.get('/bimbingan/sebagai-dosen');
      return response.data;
    },
  });
}

export function useBimbinganMahasiswa() {
  return useQuery({
    queryKey: ['mahasiswaBimbingan'],
    queryFn: async () => {
      const response = await api.get('/bimbingan/sebagai-mahasiswa');
      return response.data;
    },
  });
}

export function useScheduleBimbingan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tugasAkhirId,
      tanggal_bimbingan,
      jam_bimbingan,
    }: {
      tugasAkhirId: number;
      tanggal_bimbingan: string;
      jam_bimbingan: string;
    }) => {
      const response = await api.post(`/bimbingan/${tugasAkhirId}/jadwal`, {
        tanggal_bimbingan,
        jam_bimbingan,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Sesi bimbingan berhasil dijadwalkan');
      queryClient.invalidateQueries({ queryKey: ['dosenBimbinganList'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menjadwalkan sesi bimbingan');
    },
  });
}

export function useUploadLampiran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bimbinganId,
      files,
    }: {
      bimbinganId: number;
      files: FileList;
    }) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/bimbingan/sesi/${bimbinganId}/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload gagal');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('File berhasil diupload');
      queryClient.invalidateQueries({ queryKey: ['mahasiswaBimbingan'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupload file');
    },
  });
}

export function useKonfirmasiBimbingan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bimbinganId: number) => {
      const response = await api.post(
        `/bimbingan/sesi/${bimbinganId}/konfirmasi`,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Bimbingan berhasil dikonfirmasi');
      queryClient.invalidateQueries({ queryKey: ['dosenBimbinganList'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengkonfirmasi bimbingan');
    },
  });
}

export function useSelesaikanBimbingan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bimbinganId: number) => {
      const response = await api.post(
        `/bimbingan/sesi/${bimbinganId}/selesaikan`,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Sesi bimbingan berhasil diselesaikan');
      queryClient.invalidateQueries({ queryKey: ['dosenBimbinganList'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyelesaikan sesi bimbingan');
    },
  });
}

export function useCancelBimbingan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bimbinganId: number) => {
      const response = await api.post(`/bimbingan/sesi/${bimbinganId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Sesi bimbingan berhasil dibatalkan');
      queryClient.invalidateQueries({ queryKey: ['dosenBimbinganList'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membatalkan sesi bimbingan');
    },
  });
}
