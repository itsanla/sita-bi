'use client';

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
  Suspense,
  lazy,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/config';

const ConfirmDialog = dynamic(() => import('@/components/ConfirmDialog'), {
  ssr: false,
});
const CheckCircle = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.CheckCircle })),
);
const XCircle = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.XCircle })),
);
const Clock = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.Clock })),
);
const AlertCircle = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.AlertCircle })),
);
const Search = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.Search })),
);
const UserCheck = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.UserCheck })),
);
const Send = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.Send })),
);
const X = lazy(() => import('lucide-react').then((m) => ({ default: m.X })));
const Users = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.Users })),
);
const Award = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.Award })),
);
const HelpCircle = lazy(() =>
  import('lucide-react').then((m) => ({ default: m.HelpCircle })),
);

interface Mahasiswa {
  id: number;
  user: { id: number; name: string; email: string };
  nim: string;
  prodi: string;
  kelas: string;
  judul_ta: string;
  has_pembimbing1: boolean;
  has_pembimbing2: boolean;
  available_for_p1: boolean;
  available_for_p2: boolean;
}

interface Pengajuan {
  id: number;
  peran_yang_diajukan: string;
  diinisiasi_oleh: string;
  status: string;
  mahasiswa: {
    id: number;
    user: { name: string; email: string };
    nim: string;
  };
  created_at: string;
  updated_at: string;
}

interface MahasiswaBimbingan {
  id: number;
  peran: string;
  tugasAkhir: {
    mahasiswa: {
      user: { name: string; email: string };
      nim: string;
    };
  };
  pengajuanPelepasanBimbingan?: Array<{
    id: number;
    diajukan_oleh_user_id: number;
    status: string;
  }>;
}

interface PengajuanPelepasan {
  id: number;
  peran_dosen_ta_id: number;
  diajukan_oleh_user_id: number;
  status: string;
  diajukanOleh: {
    id: number;
    name: string;
  };
  created_at: string;
}

export default function PengajuanDosenPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [riwayatSearchQuery, setRiwayatSearchQuery] = useState('');
  const deferredRiwayatSearch = useDeferredValue(riwayatSearchQuery);
  const [riwayatSortBy, setRiwayatSortBy] = useState<'terbaru' | 'terlama'>(
    'terbaru',
  );
  const [riwayatFilterStatus, setRiwayatFilterStatus] =
    useState<string>('semua');
  const [riwayatPage, setRiwayatPage] = useState(1);
  const [tawaranPage, setTawaranPage] = useState(1);
  const [pengajuanSearchQuery, setPengajuanSearchQuery] = useState('');
  const deferredPengajuanSearch = useDeferredValue(pengajuanSearchQuery);
  const [mahasiswaSortBy, setMahasiswaSortBy] = useState<
    'nama_asc' | 'nama_desc' | 'ipk_desc' | 'ipk_asc'
  >('nama_asc');
  const itemsPerPage = 5;
  const tawaranPerPage = 4;

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'warning',
  });

  const [peranDialog, setPeranDialog] = useState<{
    open: boolean;
    mahasiswaId: number;
    mahasiswaName: string;
  }>({ open: false, mahasiswaId: 0, mahasiswaName: '' });

  const { data: mahasiswaData, isLoading: mahasiswaLoading } = useQuery({
    queryKey: ['mahasiswa-tersedia', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/pengajuan/mahasiswa-tersedia`, {
        headers: { 'x-user-id': user?.id?.toString() || '' },
      });
      return res.json();
    },
    staleTime: 30000,
    enabled: !!user?.id,
  });

  const { data: pengajuanData, isLoading: pengajuanLoading } = useQuery({
    queryKey: ['pengajuan-dosen', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/pengajuan/dosen`, {
        headers: { 'x-user-id': user?.id?.toString() || '' },
      });
      return res.json();
    },
    staleTime: 10000,
    refetchInterval: 30000,
    enabled: !!user?.id,
  });

  const mahasiswaList = mahasiswaData?.data || [];
  const pengajuanList = pengajuanData?.data || [];
  const mahasiswaBimbingan = pengajuanData?.mahasiswaBimbingan || [];
  const kuotaInfo = { current: mahasiswaBimbingan.length || 0, max: 4 };

  useEffect(() => {
    if (!mahasiswaLoading && !pengajuanLoading) {
      setLoading(false);
    }
  }, [mahasiswaLoading, pengajuanLoading]);

  const tawarkanMutation = useMutation({
    mutationFn: async ({
      mahasiswaId,
      peran,
    }: {
      mahasiswaId: number;
      peran: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/pengajuan/dosen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
        },
        body: JSON.stringify({ mahasiswaId, peran }),
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data.status === 'sukses') {
        toast.success('Berhasil menawarkan pembimbing', {
          description: `Tawaran sebagai ${variables.peran === 'pembimbing1' ? 'Pembimbing 1' : 'Pembimbing 2'} telah dikirim`,
        });
        queryClient.invalidateQueries({ queryKey: ['pengajuan-dosen'] });
      } else {
        toast.error('Gagal menawarkan pembimbing', {
          description: data.message || 'Terjadi kesalahan',
        });
      }
    },
    onError: () => {
      toast.error('Terjadi kesalahan', {
        description: 'Tidak dapat terhubung ke server',
      });
    },
  });

  const handleTawarkan = useCallback(
    (mahasiswaId: number, mahasiswaName: string) => {
      setPeranDialog({ open: true, mahasiswaId, mahasiswaName });
    },
    [],
  );

  const handleSelectPeran = useCallback(
    (peran: 'pembimbing1' | 'pembimbing2') => {
      setPeranDialog({ open: false, mahasiswaId: 0, mahasiswaName: '' });
      setConfirmDialog({
        open: true,
        title: 'Konfirmasi Tawaran Pembimbing',
        description: `Apakah Anda yakin ingin menawarkan diri sebagai ${peran === 'pembimbing1' ? 'Pembimbing 1' : 'Pembimbing 2'} untuk ${peranDialog.mahasiswaName}?`,
        variant: 'info',
        onConfirm: () =>
          tawarkanMutation.mutate({
            mahasiswaId: peranDialog.mahasiswaId,
            peran,
          }),
      });
    },
    [peranDialog, tawarkanMutation],
  );

  const actionMutation = useMutation({
    mutationFn: async ({
      pengajuanId,
      action,
    }: {
      pengajuanId: number;
      action: string;
    }) => {
      const res = await fetch(
        `${API_BASE_URL}/pengajuan/${pengajuanId}/${action}`,
        {
          method: 'POST',
          headers: { 'x-user-id': user?.id?.toString() || '' },
        },
      );
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data.status === 'sukses') {
        const messages = {
          terima: {
            title: 'Pengajuan diterima',
            desc: 'Mahasiswa berhasil ditambahkan sebagai bimbingan Anda',
          },
          tolak: {
            title: 'Pengajuan ditolak',
            desc: 'Pengajuan mahasiswa telah ditolak',
          },
          batalkan: {
            title: 'Tawaran dibatalkan',
            desc: 'Tawaran pembimbing telah dibatalkan',
          },
        };
        toast.success(
          messages[variables.action as keyof typeof messages].title,
          {
            description:
              messages[variables.action as keyof typeof messages].desc,
          },
        );
        queryClient.invalidateQueries({ queryKey: ['pengajuan-dosen'] });
      } else {
        toast.error(`Gagal ${variables.action} pengajuan`, {
          description: data.message || 'Terjadi kesalahan',
        });
      }
    },
    onError: () => {
      toast.error('Terjadi kesalahan', {
        description: 'Tidak dapat terhubung ke server',
      });
    },
  });

  const handleAction = useCallback(
    (
      pengajuanId: number,
      action: 'terima' | 'tolak' | 'batalkan',
      mahasiswaName?: string,
    ) => {
      if (action === 'batalkan') {
        setConfirmDialog({
          open: true,
          title: 'Batalkan Tawaran',
          description: `Apakah Anda yakin ingin membatalkan tawaran pembimbing kepada ${mahasiswaName}?`,
          variant: 'warning',
          onConfirm: () => actionMutation.mutate({ pengajuanId, action }),
        });
      } else {
        actionMutation.mutate({ pengajuanId, action });
      }
    },
    [actionMutation],
  );

  const lepaskanMutation = useMutation({
    mutationFn: async (peranDosenTaId: number) => {
      const res = await fetch(`${API_BASE_URL}/pengajuan/lepaskan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
        },
        body: JSON.stringify({ peranDosenTaId }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'sukses') {
        toast.success('Pengajuan pelepasan dikirim', {
          description: 'Menunggu konfirmasi dari mahasiswa',
        });
        queryClient.invalidateQueries({ queryKey: ['pengajuan-dosen'] });
      } else {
        toast.error('Gagal mengajukan pelepasan', {
          description: data.message || 'Terjadi kesalahan',
        });
      }
    },
    onError: () => {
      toast.error('Terjadi kesalahan', {
        description: 'Tidak dapat terhubung ke server',
      });
    },
  });

  const handleLepaskanBimbingan = useCallback(
    (peranDosenTaId: number) => {
      setConfirmDialog({
        open: true,
        title: 'Konfirmasi Pelepasan Bimbingan',
        description:
          'Apakah Anda yakin ingin mengajukan pelepasan bimbingan ini? Tindakan ini memerlukan konfirmasi dari dosen pembimbing.',
        variant: 'warning',
        onConfirm: () => lepaskanMutation.mutate(peranDosenTaId),
      });
    },
    [lepaskanMutation],
  );

  const batalkanPelepasanMutation = useMutation({
    mutationFn: async (pengajuanId: number) => {
      const res = await fetch(
        `${API_BASE_URL}/pengajuan/lepaskan/${pengajuanId}/batalkan`,
        {
          method: 'POST',
          headers: { 'x-user-id': user?.id?.toString() || '' },
        },
      );
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'sukses') {
        toast.success('Pengajuan pelepasan dibatalkan', {
          description: 'Pengajuan pelepasan bimbingan telah dibatalkan',
        });
        queryClient.invalidateQueries({ queryKey: ['pengajuan-dosen'] });
      } else {
        toast.error('Gagal membatalkan pengajuan', {
          description: data.message || 'Terjadi kesalahan',
        });
      }
    },
    onError: () => {
      toast.error('Terjadi kesalahan', {
        description: 'Tidak dapat terhubung ke server',
      });
    },
  });

  const konfirmasiPelepasanMutation = useMutation({
    mutationFn: async ({
      pengajuanId,
      action,
    }: {
      pengajuanId: number;
      action: string;
    }) => {
      const res = await fetch(
        `${API_BASE_URL}/pengajuan/lepaskan/${pengajuanId}/${action}`,
        {
          method: 'POST',
          headers: { 'x-user-id': user?.id?.toString() || '' },
        },
      );
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data.status === 'sukses') {
        if (variables.action === 'konfirmasi') {
          toast.success('Pelepasan bimbingan disetujui', {
            description: 'Mahasiswa telah dilepaskan dari bimbingan Anda',
          });
        } else {
          toast.info('Pelepasan bimbingan ditolak', {
            description: 'Pengajuan pelepasan telah ditolak',
          });
        }
        queryClient.invalidateQueries({ queryKey: ['pengajuan-dosen'] });
      } else {
        toast.error(`Gagal ${variables.action} pelepasan`, {
          description: data.message || 'Terjadi kesalahan',
        });
      }
    },
    onError: () => {
      toast.error('Terjadi kesalahan', {
        description: 'Tidak dapat terhubung ke server',
      });
    },
  });

  const handleBatalkanPelepasan = useCallback(
    (pengajuanId: number) => {
      setConfirmDialog({
        open: true,
        title: 'Batalkan Pengajuan Pelepasan',
        description:
          'Apakah Anda yakin ingin membatalkan pengajuan pelepasan bimbingan ini?',
        variant: 'info',
        onConfirm: () => batalkanPelepasanMutation.mutate(pengajuanId),
      });
    },
    [batalkanPelepasanMutation],
  );

  const handleKonfirmasiPelepasan = useCallback(
    (pengajuanId: number, action: 'konfirmasi' | 'tolak') => {
      konfirmasiPelepasanMutation.mutate({ pengajuanId, action });
    },
    [konfirmasiPelepasanMutation],
  );

  const tawaranAktif = pengajuanList.filter(
    (p) =>
      p.diinisiasi_oleh === 'dosen' &&
      p.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA',
  ).length;
  const kuotaPenuh = kuotaInfo.current >= kuotaInfo.max;
  const pengajuanMasuk = pengajuanList.filter(
    (p) =>
      p.diinisiasi_oleh === 'mahasiswa' &&
      p.status === 'MENUNGGU_PERSETUJUAN_DOSEN',
  );

  const filteredMahasiswa = useMemo(() => {
    return mahasiswaList
      .filter(
        (m) =>
          m.user.name
            .toLowerCase()
            .includes(deferredSearchQuery.toLowerCase()) ||
          m.nim.toLowerCase().includes(deferredSearchQuery.toLowerCase()),
      )
      .sort((a, b) => {
        if (mahasiswaSortBy === 'nama_asc')
          return a.user.name.localeCompare(b.user.name);
        if (mahasiswaSortBy === 'nama_desc')
          return b.user.name.localeCompare(a.user.name);
        if (mahasiswaSortBy === 'ipk_desc') return 0; // IPK tertinggi (placeholder)
        if (mahasiswaSortBy === 'ipk_asc') return 0; // IPK terendah (placeholder)
        return 0;
      });
  }, [mahasiswaList, deferredSearchQuery, mahasiswaSortBy]);

  const paginatedMahasiswa = useMemo(() => {
    const totalPages = Math.ceil(filteredMahasiswa.length / itemsPerPage);
    return {
      data: filteredMahasiswa.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
      totalPages,
    };
  }, [filteredMahasiswa, currentPage]);

  const filteredRiwayat = useMemo(() => {
    return pengajuanList
      .filter((p) => p.diinisiasi_oleh === 'dosen')
      .filter((p) => {
        const matchSearch = p.mahasiswa.user.name
          .toLowerCase()
          .includes(deferredRiwayatSearch.toLowerCase());
        const matchStatus =
          riwayatFilterStatus === 'semua' || p.status === riwayatFilterStatus;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return riwayatSortBy === 'terbaru' ? dateB - dateA : dateA - dateB;
      });
  }, [
    pengajuanList,
    deferredRiwayatSearch,
    riwayatFilterStatus,
    riwayatSortBy,
  ]);

  const paginatedRiwayat = useMemo(() => {
    const totalPages = Math.ceil(filteredRiwayat.length / itemsPerPage);
    return {
      data: filteredRiwayat.slice(
        (riwayatPage - 1) * itemsPerPage,
        riwayatPage * itemsPerPage,
      ),
      totalPages,
    };
  }, [filteredRiwayat, riwayatPage]);

  const filteredPengajuanMasuk = useMemo(() => {
    return pengajuanMasuk.filter(
      (p) =>
        p.mahasiswa.user.name
          .toLowerCase()
          .includes(deferredPengajuanSearch.toLowerCase()) ||
        p.mahasiswa.nim
          .toLowerCase()
          .includes(deferredPengajuanSearch.toLowerCase()),
    );
  }, [pengajuanMasuk, deferredPengajuanSearch]);

  const pengajuanMasukData = useMemo(() => {
    const totalPages = Math.ceil(
      filteredPengajuanMasuk.length / tawaranPerPage,
    );
    return {
      data: filteredPengajuanMasuk.slice(
        (tawaranPage - 1) * tawaranPerPage,
        tawaranPage * tawaranPerPage,
      ),
      total: filteredPengajuanMasuk.length,
      totalPages,
    };
  }, [filteredPengajuanMasuk, tawaranPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7f1d1d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#7f1d1d] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 px-2 py-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-700">
                Pengajuan Pembimbing
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                Kelola pengajuan dan tawaran pembimbing mahasiswa
              </p>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-base border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Kuota Bimbingan
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-700 mt-2">
                    {kuotaInfo.current}/{kuotaInfo.max}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {kuotaPenuh
                      ? 'Kuota penuh'
                      : `${kuotaInfo.max - kuotaInfo.current} slot tersisa`}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${kuotaPenuh ? 'bg-red-100' : 'bg-green-100'}`}
                >
                  <Users
                    className={`w-6 h-6 sm:w-7 sm:h-7 ${kuotaPenuh ? 'text-red-600' : 'text-green-600'}`}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-base border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Pengajuan Masuk
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-700 mt-2">
                    {pengajuanMasuk.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Menunggu persetujuan
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] rounded-xl shadow-base p-4 sm:p-6 text-white hover:shadow-md transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-red-100 uppercase tracking-wide">
                    Mengajukan Tawaran
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold mt-2">
                    {tawaranAktif}/5
                  </p>
                  <p className="text-xs text-red-100 mt-1">
                    Maksimal 5 tawaran
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
            </div>
          </div>

          {/* Pengajuan dari Mahasiswa */}
          <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-gray-700">
                  Pengajuan dari Mahasiswa
                </h2>
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    Mahasiswa yang mengajukan Anda sebagai pembimbing. Anda
                    dapat menerima atau menolak pengajuan ini.
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Mahasiswa yang mengajukan Anda sebagai pembimbing
              </p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIM mahasiswa..."
                  value={pengajuanSearchQuery}
                  onChange={(e) => {
                    setPengajuanSearchQuery(e.target.value);
                    setTawaranPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {pengajuanMasukData.data.map((pengajuan) => {
                const createdDate = new Date(pengajuan.created_at);
                const formatWIB = (date: Date) => {
                  return new Intl.DateTimeFormat('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(date);
                };

                return (
                  <div
                    key={pengajuan.id}
                    className="p-3 sm:p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          {pengajuan.mahasiswa.user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                              {pengajuan.mahasiswa.user.name}
                            </h3>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {pengajuan.peran_yang_diajukan === 'pembimbing1'
                                ? 'P1'
                                : 'P2'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            NIM: {pengajuan.mahasiswa.nim}
                          </p>
                          <p className="text-xs text-gray-500">
                            Diajukan: {formatWIB(createdDate)} WIB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0">
                        <button
                          onClick={() => handleAction(pengajuan.id, 'terima')}
                          disabled={kuotaPenuh}
                          className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Terima
                        </button>
                        <button
                          onClick={() => handleAction(pengajuan.id, 'tolak')}
                          className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {pengajuanMasukData.total === 0 && (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">
                    Belum ada pengajuan dari mahasiswa
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Pengajuan akan muncul di sini ketika mahasiswa mengajukan
                  </p>
                </div>
              )}
            </div>
            {pengajuanMasukData.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {(tawaranPage - 1) * tawaranPerPage + 1} -{' '}
                  {Math.min(
                    tawaranPage * tawaranPerPage,
                    pengajuanMasukData.total,
                  )}{' '}
                  dari {pengajuanMasukData.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTawaranPage((p) => Math.max(1, p - 1))}
                    disabled={tawaranPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setTawaranPage((p) =>
                        Math.min(pengajuanMasukData.totalPages, p + 1),
                      )
                    }
                    disabled={tawaranPage === pengajuanMasukData.totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dosen List */}
          <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-700">
                  Daftar Mahasiswa Tersedia
                </h2>
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    Pilih mahasiswa yang tersedia dan tawarkan diri sebagai
                    pembimbing. Anda dapat menawarkan maksimal 5 mahasiswa
                    secara bersamaan.
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau NIM mahasiswa..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                  />
                </div>
                <select
                  value={mahasiswaSortBy}
                  onChange={(e) => {
                    setMahasiswaSortBy(
                      e.target.value as
                        | 'nama_asc'
                        | 'nama_desc'
                        | 'ipk_desc'
                        | 'ipk_asc',
                    );
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                >
                  <option value="nama_asc">Nama A-Z</option>
                  <option value="nama_desc">Nama Z-A</option>
                  <option value="ipk_desc">IPK Tertinggi</option>
                  <option value="ipk_asc">IPK Terendah</option>
                </select>
              </div>
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[35%]">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[20%]">
                      NIM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[10%]">
                      IPK
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[15%]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-[20%]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedMahasiswa.data.map((mahasiswa) => (
                    <tr
                      key={mahasiswa.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer h-14"
                      onClick={() =>
                        setPeranDialog({
                          open: true,
                          mahasiswaId: mahasiswa.id,
                          mahasiswaName: mahasiswa.user.name,
                        })
                      }
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {mahasiswa.user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {mahasiswa.nim}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">-</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 h-6 items-center">
                          {mahasiswa.has_pembimbing1 && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded whitespace-nowrap">
                              P1
                            </span>
                          )}
                          {mahasiswa.has_pembimbing2 && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded whitespace-nowrap">
                              P2
                            </span>
                          )}
                          {!mahasiswa.has_pembimbing1 &&
                            !mahasiswa.has_pembimbing2 && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(mahasiswa.available_for_p1 ||
                          mahasiswa.available_for_p2) && (
                          <button
                            onClick={() =>
                              handleTawarkan(mahasiswa.id, mahasiswa.user.name)
                            }
                            disabled={kuotaPenuh || tawaranAktif >= 5}
                            className="px-3 py-1.5 bg-[#7f1d1d] text-white rounded-lg text-xs font-semibold hover:bg-[#991b1b] disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Tawarkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedMahasiswa.data.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">
                          Tidak ada mahasiswa yang ditemukan
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-gray-200">
              {paginatedMahasiswa.data.map((mahasiswa) => (
                <div
                  key={mahasiswa.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setPeranDialog({
                      open: true,
                      mahasiswaId: mahasiswa.id,
                      mahasiswaName: mahasiswa.user.name,
                    })
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {mahasiswa.user.name}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0">
                          {mahasiswa.has_pembimbing1 && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                              P1
                            </span>
                          )}
                          {mahasiswa.has_pembimbing2 && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                              P2
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {mahasiswa.nim} • {mahasiswa.prodi}
                      </p>
                    </div>
                    {(mahasiswa.available_for_p1 ||
                      mahasiswa.available_for_p2) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTawarkan(mahasiswa.id, mahasiswa.user.name);
                        }}
                        disabled={kuotaPenuh || tawaranAktif >= 5}
                        className="px-3 py-1.5 bg-[#7f1d1d] text-white rounded-lg text-xs font-semibold hover:bg-[#991b1b] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Tawarkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {paginatedMahasiswa.data.length === 0 && (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">
                    Tidak ada mahasiswa yang ditemukan
                  </p>
                </div>
              )}
            </div>

            {paginatedMahasiswa.totalPages > 1 && (
              <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredMahasiswa.length,
                  )}{' '}
                  dari {filteredMahasiswa.length} mahasiswa
                </p>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    Prev
                  </button>
                  <div className="hidden sm:flex gap-2">
                    {Array.from(
                      { length: Math.min(5, paginatedMahasiswa.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (paginatedMahasiswa.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          currentPage >=
                          paginatedMahasiswa.totalPages - 2
                        ) {
                          pageNum = paginatedMahasiswa.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                              currentPage === pageNum
                                ? 'bg-[#7f1d1d] text-white shadow-md'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}
                  </div>
                  <span className="sm:hidden text-sm text-gray-600 px-2">
                    {currentPage}/{paginatedMahasiswa.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(paginatedMahasiswa.totalPages, p + 1),
                      )
                    }
                    disabled={currentPage === paginatedMahasiswa.totalPages}
                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Grid Layout untuk Riwayat, Pembimbing Aktif, dan Tawaran */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Riwayat Pengajuan */}
            <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-700">
                    Tawaran Saya
                  </h2>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      Riwayat lengkap tawaran pembimbing yang Anda tawarkan
                      beserta tanggal, waktu, dan status responsnya.
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari nama mahasiswa..."
                      value={riwayatSearchQuery}
                      onChange={(e) => {
                        setRiwayatSearchQuery(e.target.value);
                        setRiwayatPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                    />
                  </div>
                  <select
                    value={riwayatSortBy}
                    onChange={(e) => {
                      setRiwayatSortBy(e.target.value as 'terbaru' | 'terlama');
                      setRiwayatPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                  >
                    <option value="terbaru">Terbaru</option>
                    <option value="terlama">Terlama</option>
                  </select>
                  <select
                    value={riwayatFilterStatus}
                    onChange={(e) => {
                      setRiwayatFilterStatus(e.target.value);
                      setRiwayatPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                  >
                    <option value="semua">Semua Status</option>
                    <option value="MENUNGGU_PERSETUJUAN_MAHASISWA">
                      Menunggu
                    </option>
                    <option value="DISETUJUI">Diterima</option>
                    <option value="DITOLAK">Ditolak</option>
                    <option value="DIBATALKAN_MAHASISWA">Dibatalkan</option>
                  </select>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {paginatedRiwayat.data.map((pengajuan) => {
                  const createdDate = new Date(pengajuan.created_at);
                  const updatedDate = new Date(pengajuan.updated_at);
                  const formatWIB = (date: Date) => {
                    return new Intl.DateTimeFormat('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(date);
                  };

                  const getStatusInfo = (status: string) => {
                    switch (status) {
                      case 'MENUNGGU_PERSETUJUAN_MAHASISWA':
                        return {
                          icon: Clock,
                          color: 'amber',
                          text: 'Menunggu',
                        };
                      case 'DISETUJUI':
                        return {
                          icon: CheckCircle,
                          color: 'green',
                          text: 'Diterima',
                        };
                      case 'DITOLAK':
                        return { icon: XCircle, color: 'red', text: 'Ditolak' };
                      case 'DIBATALKAN_MAHASISWA':
                        return { icon: X, color: 'gray', text: 'Dibatalkan' };
                      default:
                        return {
                          icon: AlertCircle,
                          color: 'gray',
                          text: status,
                        };
                    }
                  };

                  const statusInfo = getStatusInfo(pengajuan.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={pengajuan.id}
                      className="p-3 sm:p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                            {pengajuan.mahasiswa.user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                {pengajuan.mahasiswa.user.name}
                              </h3>
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                {pengajuan.peran_yang_diajukan === 'pembimbing1'
                                  ? 'P1'
                                  : 'P2'}
                              </span>
                              <div className="flex items-center gap-1">
                                <StatusIcon
                                  className={`w-4 h-4 text-${statusInfo.color}-500`}
                                />
                                <span
                                  className={`text-xs text-${statusInfo.color}-600 font-medium`}
                                >
                                  {statusInfo.text}
                                </span>
                              </div>
                            </div>
                            <div className="mt-1 space-y-0.5">
                              <p className="text-xs text-gray-500">
                                Diajukan: {formatWIB(createdDate)} WIB
                              </p>
                              {pengajuan.status !==
                                'MENUNGGU_PERSETUJUAN_DOSEN' && (
                                <p className="text-xs text-gray-500">
                                  Respon: {formatWIB(updatedDate)} WIB
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {pengajuan.status ===
                          'MENUNGGU_PERSETUJUAN_MAHASISWA' && (
                          <button
                            onClick={() =>
                              handleAction(
                                pengajuan.id,
                                'batalkan',
                                pengajuan.mahasiswa.user.name,
                              )
                            }
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                            Batalkan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {paginatedRiwayat.data.length === 0 && (
                  <div className="p-8 text-center">
                    <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">
                      Belum ada tawaran yang dikirim
                    </p>
                  </div>
                )}
              </div>
              {paginatedRiwayat.totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {(riwayatPage - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(
                      riwayatPage * itemsPerPage,
                      filteredRiwayat.length,
                    )}{' '}
                    dari {filteredRiwayat.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRiwayatPage((p) => Math.max(1, p - 1))}
                      disabled={riwayatPage === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setRiwayatPage((p) =>
                          Math.min(paginatedRiwayat.totalPages, p + 1),
                        )
                      }
                      disabled={riwayatPage === paginatedRiwayat.totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Pembimbing Aktif & Tawaran */}
            <div className="space-y-6">
              {/* Mahasiswa Bimbingan Aktif */}
              <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-700">
                    Mahasiswa Bimbingan Aktif
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Mahasiswa yang sedang Anda bimbing
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {mahasiswaBimbingan.map((bimbingan) => {
                    const pengajuanAktif =
                      bimbingan.pengajuanPelepasanBimbingan?.[0];
                    const isUserYangMengajukan =
                      pengajuanAktif?.diajukan_oleh_user_id === user?.id;

                    return (
                      <div
                        key={bimbingan.id}
                        className="p-3 sm:p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                              {bimbingan.tugasAkhir.mahasiswa.user.name.charAt(
                                0,
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900">
                                  {bimbingan.tugasAkhir.mahasiswa.user.name}
                                </h3>
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  {bimbingan.peran === 'pembimbing1'
                                    ? 'P1'
                                    : 'P2'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                NIM: {bimbingan.tugasAkhir.mahasiswa.nim}
                              </p>
                              {pengajuanAktif && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                  Pengajuan Pelepasan
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full sm:w-auto sm:flex-shrink-0">
                            {pengajuanAktif ? (
                              isUserYangMengajukan ? (
                                <span className="text-sm text-gray-500">
                                  Menunggu konfirmasi mahasiswa
                                </span>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleKonfirmasiPelepasan(
                                        pengajuanAktif.id,
                                        'konfirmasi',
                                      )
                                    }
                                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Setuju
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleKonfirmasiPelepasan(
                                        pengajuanAktif.id,
                                        'tolak',
                                      )
                                    }
                                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Tolak
                                  </button>
                                </div>
                              )
                            ) : (
                              <button
                                onClick={() =>
                                  handleLepaskanBimbingan(bimbingan.id)
                                }
                                className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                              >
                                <X className="w-4 h-4" />
                                Lepaskan
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {mahasiswaBimbingan.length === 0 && (
                    <div className="p-8 text-center">
                      <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">
                        Belum ada mahasiswa bimbingan
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText="Ya, Lanjutkan"
          cancelText="Batal"
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant}
        />

        {peranDialog.open &&
          (() => {
            const mahasiswa = mahasiswaList.find(
              (m) => m.id === peranDialog.mahasiswaId,
            );
            if (!mahasiswa) return null;
            return (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() =>
                  setPeranDialog({
                    open: false,
                    mahasiswaId: 0,
                    mahasiswaName: '',
                  })
                }
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Detail Mahasiswa
                  </h3>
                  <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Nama</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {mahasiswa.user.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">NIM</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {mahasiswa.nim}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Prodi</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {mahasiswa.prodi}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Kelas</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {mahasiswa.kelas}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">IPK</p>
                        <p className="text-sm font-semibold text-gray-900">-</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Status Pembimbing
                        </p>
                        <div className="flex gap-1 mt-1">
                          {mahasiswa.has_pembimbing1 && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                              Sudah ada P1
                            </span>
                          )}
                          {mahasiswa.has_pembimbing2 && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                              Sudah ada P2
                            </span>
                          )}
                          {!mahasiswa.has_pembimbing1 &&
                            !mahasiswa.has_pembimbing2 && (
                              <span className="text-sm text-gray-400">
                                Belum ada pembimbing
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Judul Tugas Akhir
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {mahasiswa.judul_ta}
                      </p>
                    </div>
                  </div>
                  {(mahasiswa.available_for_p1 ||
                    mahasiswa.available_for_p2) && (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        Pilih peran pembimbing yang akan Anda tawarkan:
                      </p>
                      <div className="space-y-2">
                        {mahasiswa.available_for_p1 && (
                          <button
                            onClick={() => handleSelectPeran('pembimbing1')}
                            disabled={kuotaPenuh || tawaranAktif >= 5}
                            className="w-full px-6 py-3 bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Award className="w-5 h-5" />
                            <span>Tawarkan sebagai Pembimbing 1</span>
                          </button>
                        )}
                        {mahasiswa.available_for_p2 && (
                          <button
                            onClick={() => handleSelectPeran('pembimbing2')}
                            disabled={kuotaPenuh || tawaranAktif >= 5}
                            className="w-full px-6 py-3 bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Award className="w-5 h-5" />
                            <span>Tawarkan sebagai Pembimbing 2</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  <button
                    onClick={() =>
                      setPeranDialog({
                        open: false,
                        mahasiswaId: 0,
                        mahasiswaName: '',
                      })
                    }
                    className="w-full mt-3 px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            );
          })()}
      </div>
    </Suspense>
  );
}
