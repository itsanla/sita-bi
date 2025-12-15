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

import PeriodeGuard from '@/components/shared/PeriodeGuard';

export default function PengajuanMahasiswaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [selectedPeran, setSelectedPeran] = useState<
    'pembimbing1' | 'pembimbing2'
  >('pembimbing1');
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
  const [dosenSortBy, setDosenSortBy] = useState<
    'bimbingan_asc' | 'bimbingan_desc' | 'nama_asc' | 'nama_desc'
  >('bimbingan_asc');
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

  const { data: dosenData, isLoading: dosenLoading } = useQuery({
    queryKey: ['dosen-tersedia', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/pengajuan/dosen-tersedia`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.json();
    },
    staleTime: 30000,
    enabled: !!user?.id,
  });

  const { data: pengajuanData, isLoading: pengajuanLoading } = useQuery({
    queryKey: ['pengajuan-mahasiswa', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/pengajuan/mahasiswa`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.json();
    },
    staleTime: 10000,
    refetchInterval: 30000,
    enabled: !!user?.id,
  });

  const dosenList = dosenData?.data || [];
  const pengajuanList = pengajuanData?.data || [];
  const pembimbingAktif = pengajuanData?.pembimbingAktif || [];

  useEffect(() => {
    if (!dosenLoading && !pengajuanLoading) {
      setLoading(false);
    }
  }, [dosenLoading, pengajuanLoading]);

  const ajukanMutation = useMutation({
    mutationFn: async ({
      dosenId,
      peran,
    }: {
      dosenId: number;
      peran: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/pengajuan/mahasiswa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ dosenId, peran }),
      });
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['pengajuan-mahasiswa'] });
      const previous = queryClient.getQueryData(['pengajuan-mahasiswa']);
      return { previous };
    },
    onSuccess: (data) => {
      if (data.status === 'sukses') {
        toast.success('Berhasil mengajukan pembimbing', {
          description: `Pengajuan sebagai ${selectedPeran === 'pembimbing1' ? 'Pembimbing 1' : 'Pembimbing 2'} telah dikirim ke dosen`,
        });
        queryClient.invalidateQueries({ queryKey: ['pengajuan-mahasiswa'] });
      } else {
        toast.error('Gagal mengajukan pembimbing', {
          description: data.message || 'Terjadi kesalahan saat mengajukan',
        });
      }
    },
    onError: (_error, _variables, context: { previous?: unknown }) => {
      if (context?.previous) {
        queryClient.setQueryData(['pengajuan-mahasiswa'], context.previous);
      }
      toast.error('Terjadi kesalahan', {
        description: 'Tidak dapat terhubung ke server',
      });
    },
  });

  const handleAjukan = useCallback(
    (dosenId: number, dosenName: string) => {
      if (!dosenId) {
        toast.error('Error', { description: 'ID dosen tidak valid' });
        return;
      }
      setConfirmDialog({
        open: true,
        title: 'Konfirmasi Pengajuan Pembimbing',
        description: `Apakah Anda yakin ingin mengajukan ${dosenName} sebagai ${selectedPeran === 'pembimbing1' ? 'Pembimbing 1' : 'Pembimbing 2'}?`,
        variant: 'info',
        onConfirm: () =>
          ajukanMutation.mutate({ dosenId, peran: selectedPeran }),
      });
    },
    [selectedPeran, ajukanMutation],
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
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        },
      );
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data.status === 'sukses') {
        const messages = {
          terima: {
            title: 'Tawaran diterima',
            desc: 'Dosen berhasil ditambahkan sebagai pembimbing Anda',
          },
          tolak: {
            title: 'Tawaran ditolak',
            desc: 'Tawaran pembimbing telah ditolak',
          },
          batalkan: {
            title: 'Pengajuan dibatalkan',
            desc: 'Pengajuan pembimbing telah dibatalkan',
          },
        };
        toast.success(
          messages[variables.action as keyof typeof messages].title,
          {
            description:
              messages[variables.action as keyof typeof messages].desc,
          },
        );
        queryClient.invalidateQueries({ queryKey: ['pengajuan-mahasiswa'] });
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
      dosenName?: string,
    ) => {
      if (action === 'batalkan') {
        setConfirmDialog({
          open: true,
          title: 'Batalkan Pengajuan',
          description: `Apakah Anda yakin ingin membatalkan pengajuan pembimbing kepada ${dosenName}?`,
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ peranDosenTaId }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'sukses') {
        toast.success('Pengajuan pelepasan dikirim', {
          description: 'Menunggu konfirmasi dari dosen pembimbing',
        });
        queryClient.invalidateQueries({ queryKey: ['pengajuan-mahasiswa'] });
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
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        },
      );
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'sukses') {
        toast.success('Pengajuan pelepasan dibatalkan', {
          description: 'Pengajuan pelepasan bimbingan telah dibatalkan',
        });
        queryClient.invalidateQueries({ queryKey: ['pengajuan-mahasiswa'] });
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
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        },
      );
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data.status === 'sukses') {
        if (variables.action === 'konfirmasi') {
          toast.success('Pelepasan bimbingan disetujui', {
            description: 'Pembimbing telah dilepaskan dari tugas akhir Anda',
          });
        } else {
          toast.info('Pelepasan bimbingan ditolak', {
            description: 'Pengajuan pelepasan telah ditolak',
          });
        }
        queryClient.invalidateQueries({ queryKey: ['pengajuan-mahasiswa'] });
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

  const handleKonfirmasiPelepasan = useCallback(
    (pengajuanId: number, action: 'konfirmasi' | 'tolak') => {
      konfirmasiPelepasanMutation.mutate({ pengajuanId, action });
    },
    [konfirmasiPelepasanMutation],
  );

  const pengajuanStats = useMemo(() => {
    const pengajuanP1 = pengajuanList.filter(
      (p) => p.peran_yang_diajukan === 'pembimbing1',
    );
    const pengajuanP2 = pengajuanList.filter(
      (p) => p.peran_yang_diajukan === 'pembimbing2',
    );
    return {
      pengajuanAktifP1: pengajuanP1.filter(
        (p) =>
          p.status === 'MENUNGGU_PERSETUJUAN_DOSEN' &&
          p.diinisiasi_oleh === 'mahasiswa',
      ).length,
      pengajuanAktifP2: pengajuanP2.filter(
        (p) =>
          p.status === 'MENUNGGU_PERSETUJUAN_DOSEN' &&
          p.diinisiasi_oleh === 'mahasiswa',
      ).length,
      hasPembimbing1: pembimbingAktif.some((p) => p.peran === 'pembimbing1'),
      hasPembimbing2: pembimbingAktif.some((p) => p.peran === 'pembimbing2'),
    };
  }, [pengajuanList, pembimbingAktif]);

  const { pengajuanAktifP1, pengajuanAktifP2, hasPembimbing1, hasPembimbing2 } =
    pengajuanStats;

  const filteredDosen = useMemo(() => {
    return dosenList
      .filter(
        (d) =>
          d.user.name
            .toLowerCase()
            .includes(deferredSearchQuery.toLowerCase()) ||
          d.nip.toLowerCase().includes(deferredSearchQuery.toLowerCase()),
      )
      .sort((a, b) => {
        if (dosenSortBy === 'bimbingan_asc')
          return a.jumlah_bimbingan - b.jumlah_bimbingan;
        if (dosenSortBy === 'bimbingan_desc')
          return b.jumlah_bimbingan - a.jumlah_bimbingan;
        if (dosenSortBy === 'nama_asc')
          return a.user.name.localeCompare(b.user.name);
        return b.user.name.localeCompare(a.user.name);
      });
  }, [dosenList, deferredSearchQuery, dosenSortBy]);

  const paginatedDosen = useMemo(() => {
    const totalPages = Math.ceil(filteredDosen.length / itemsPerPage);
    return {
      data: filteredDosen.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
      totalPages,
    };
  }, [filteredDosen, currentPage]);

  const filteredRiwayat = useMemo(() => {
    return pengajuanList
      .filter((p) => p.diinisiasi_oleh === 'mahasiswa')
      .filter((p) => {
        const matchSearch = p.dosen.user.name
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

  const tawaranData = useMemo(() => {
    const tawaranDosen = pengajuanList.filter(
      (p) => p.diinisiasi_oleh === 'dosen',
    );
    const totalPages = Math.ceil(tawaranDosen.length / tawaranPerPage);
    return {
      data: tawaranDosen.slice(
        (tawaranPage - 1) * tawaranPerPage,
        tawaranPage * tawaranPerPage,
      ),
      total: tawaranDosen.length,
      totalPages,
    };
  }, [pengajuanList, tawaranPage]);

  const pembimbingPlaceholder = useMemo(
    () => [
      { peran: 'pembimbing1', exists: hasPembimbing1 },
      { peran: 'pembimbing2', exists: hasPembimbing2 },
    ],
    [hasPembimbing1, hasPembimbing2],
  );

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
    <PeriodeGuard>
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
                  Ajukan dosen pembimbing untuk tugas akhir Anda
                </p>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl shadow-base border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Pembimbing 1
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-700 mt-2">
                      {hasPembimbing1
                        ? '✓'
                        : pengajuanAktifP1 > 0
                          ? pengajuanAktifP1
                          : '-'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {hasPembimbing1
                        ? 'Sudah disetujui'
                        : pengajuanAktifP1 > 0
                          ? `${pengajuanAktifP1}/3 pengajuan aktif`
                          : 'Belum ada pengajuan'}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${hasPembimbing1 ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    {hasPembimbing1 ? (
                      <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                    ) : (
                      <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-base border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Pembimbing 2
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-700 mt-2">
                      {hasPembimbing2
                        ? '✓'
                        : pengajuanAktifP2 > 0
                          ? pengajuanAktifP2
                          : '-'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {hasPembimbing2
                        ? 'Sudah disetujui'
                        : pengajuanAktifP2 > 0
                          ? `${pengajuanAktifP2}/3 pengajuan aktif`
                          : 'Belum ada pengajuan'}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${hasPembimbing2 ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    {hasPembimbing2 ? (
                      <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                    ) : (
                      <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] rounded-xl shadow-base p-4 sm:p-6 text-white hover:shadow-md transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-red-100 uppercase tracking-wide">
                      Total Dosen
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold mt-2">
                      {dosenList.length}
                    </p>
                    <p className="text-xs text-red-100 mt-1">
                      {dosenList.filter((d) => d.available).length} tersedia
                    </p>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                </div>
              </div>
            </div>

            {/* Selector Peran */}
            <div className="bg-white rounded-xl shadow-base border border-gray-200 p-4 sm:p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Pilih Peran Pembimbing
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedPeran('pembimbing1')}
                  disabled={hasPembimbing1}
                  className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 ${
                    selectedPeran === 'pembimbing1'
                      ? 'bg-[#7f1d1d] text-white shadow-md sm:scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${hasPembimbing1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Pembimbing 1</span>
                    {pengajuanAktifP1 > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        ({pengajuanAktifP1}/3)
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setSelectedPeran('pembimbing2')}
                  disabled={hasPembimbing2}
                  className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 ${
                    selectedPeran === 'pembimbing2'
                      ? 'bg-[#7f1d1d] text-white shadow-md sm:scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${hasPembimbing2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Pembimbing 2</span>
                    {pengajuanAktifP2 > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        ({pengajuanAktifP2}/3)
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Dosen List */}
            <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-700">
                    Daftar Dosen Tersedia
                  </h2>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      Pilih dosen yang tersedia dan ajukan sebagai pembimbing.
                      Anda dapat mengajukan maksimal 3 dosen untuk setiap peran
                      pembimbing.
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari nama atau NIP dosen..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                    />
                  </div>
                  <select
                    value={dosenSortBy}
                    onChange={(e) => {
                      setDosenSortBy(
                        e.target.value as
                          | 'bimbingan_asc'
                          | 'bimbingan_desc'
                          | 'nama_asc'
                          | 'nama_desc',
                      );
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                  >
                    <option value="bimbingan_asc">Membimbing Tersedikit</option>
                    <option value="bimbingan_desc">Membimbing Terbanyak</option>
                    <option value="nama_asc">Nama A-Z</option>
                    <option value="nama_desc">Nama Z-A</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {paginatedDosen.data.map((dosen) => (
                  <div
                    key={dosen.id}
                    className="p-3 sm:p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          {dosen.user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {dosen.user.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                            <p className="text-xs text-gray-500">
                              NIP: {dosen.nip}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[#7f1d1d] h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(dosen.jumlah_bimbingan / dosen.kuota_bimbingan) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                                {dosen.jumlah_bimbingan}/{dosen.kuota_bimbingan}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAjukan(dosen.id, dosen.user.name)}
                        disabled={
                          !dosen.available ||
                          (selectedPeran === 'pembimbing1' &&
                            (hasPembimbing1 || pengajuanAktifP1 >= 3)) ||
                          (selectedPeran === 'pembimbing2' &&
                            (hasPembimbing2 || pengajuanAktifP2 >= 3))
                        }
                        className="w-full sm:w-auto px-4 py-2 bg-[#7f1d1d] text-white rounded-lg text-sm font-semibold hover:bg-[#991b1b] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        <span>{dosen.available ? 'Ajukan' : 'Penuh'}</span>
                      </button>
                    </div>
                  </div>
                ))}
                {paginatedDosen.data.length === 0 && (
                  <div className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">
                      Tidak ada dosen yang ditemukan
                    </p>
                  </div>
                )}
              </div>

              {paginatedDosen.totalPages > 1 && (
                <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(currentPage * itemsPerPage, filteredDosen.length)}{' '}
                    dari {filteredDosen.length} dosen
                  </p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Prev
                    </button>
                    {Array.from(
                      { length: Math.min(5, paginatedDosen.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (paginatedDosen.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          currentPage >=
                          paginatedDosen.totalPages - 2
                        ) {
                          pageNum = paginatedDosen.totalPages - 4 + i;
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
                    <button
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(paginatedDosen.totalPages, p + 1),
                        )
                      }
                      disabled={currentPage === paginatedDosen.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                      Riwayat Pengajuan
                    </h2>
                    <div className="group relative">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        Riwayat lengkap pengajuan pembimbing yang Anda ajukan
                        beserta tanggal, waktu, dan status responsnya.
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari nama dosen..."
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
                        setRiwayatSortBy(
                          e.target.value as 'terbaru' | 'terlama',
                        );
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
                      <option value="MENUNGGU_PERSETUJUAN_DOSEN">
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
                        case 'MENUNGGU_PERSETUJUAN_DOSEN':
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
                          return {
                            icon: XCircle,
                            color: 'red',
                            text: 'Ditolak',
                          };
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
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                              {pengajuan.dosen.user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                  {pengajuan.dosen.user.name}
                                </h3>
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {pengajuan.peran_yang_diajukan ===
                                  'pembimbing1'
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
                            'MENUNGGU_PERSETUJUAN_DOSEN' && (
                            <button
                              onClick={() =>
                                handleAction(
                                  pengajuan.id,
                                  'batalkan',
                                  pengajuan.dosen.user.name,
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
                        Belum ada pengajuan yang dikirim
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
                        onClick={() =>
                          setRiwayatPage((p) => Math.max(1, p - 1))
                        }
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
                {/* Pembimbing Aktif */}
                <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-700">
                      Pembimbing Aktif
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Dosen pembimbing yang sudah disetujui
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {pembimbingPlaceholder.map((placeholder) => {
                      const pembimbing = pembimbingAktif.find(
                        (p) => p.peran === placeholder.peran,
                      );

                      if (!placeholder.exists) {
                        return (
                          <div
                            key={placeholder.peran}
                            className="p-3 sm:p-4 bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                                <UserCheck className="w-5 h-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 italic">
                                  Belum terhubung dengan{' '}
                                  {placeholder.peran === 'pembimbing1'
                                    ? 'Pembimbing 1'
                                    : 'Pembimbing 2'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (!pembimbing) return null;
                      const pengajuanAktif =
                        pembimbing.pengajuanPelepasanBimbingan?.[0];
                      const isUserYangMengajukan =
                        pengajuanAktif?.diajukan_oleh_user_id === user?.id;

                      return (
                        <div
                          key={pembimbing.id}
                          className="p-3 sm:p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                                {pembimbing.dosen.user.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-gray-900">
                                    {pembimbing.dosen.user.name}
                                  </h3>
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    {pembimbing.peran === 'pembimbing1'
                                      ? 'P1'
                                      : 'P2'}
                                  </span>
                                </div>
                                {!!pengajuanAktif && (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                    Pengajuan Pelepasan
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="w-full sm:w-auto sm:flex-shrink-0">
                              {pengajuanAktif ? (
                                isUserYangMengajukan ? (
                                  <button
                                    onClick={() => {
                                      setConfirmDialog({
                                        open: true,
                                        title: 'Batalkan Pengajuan Pelepasan',
                                        description:
                                          'Apakah Anda yakin ingin membatalkan pengajuan pelepasan bimbingan ini?',
                                        variant: 'info',
                                        onConfirm: () =>
                                          batalkanPelepasanMutation.mutate(
                                            pengajuanAktif.id,
                                          ),
                                      });
                                    }}
                                    className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <X className="w-4 h-4" />
                                    Batalkan
                                  </button>
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
                                    handleLepaskanBimbingan(pembimbing.id)
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
                  </div>
                </div>

                {/* Tawaran dari Dosen */}
                <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-700">
                        Tawaran dari Dosen
                      </h2>
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          Dosen yang menawarkan diri untuk membimbing Anda. Anda
                          dapat menerima atau menolak tawaran ini.
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Dosen yang menawarkan diri sebagai pembimbing Anda
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {tawaranData.data.map((pengajuan) => {
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
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                                {pengajuan.dosen.user.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                    {pengajuan.dosen.user.name}
                                  </h3>
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                    {pengajuan.peran_yang_diajukan ===
                                    'pembimbing1'
                                      ? 'P1'
                                      : 'P2'}
                                  </span>
                                  {pengajuan.status === 'DITOLAK' && (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                      Ditolak
                                    </span>
                                  )}
                                  {pengajuan.status === 'DISETUJUI' && (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      Disetujui
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Diajukan: {formatWIB(createdDate)} WIB
                                </p>
                              </div>
                            </div>
                            {pengajuan.status ===
                              'MENUNGGU_PERSETUJUAN_MAHASISWA' && (
                              <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0">
                                <button
                                  onClick={() =>
                                    handleAction(pengajuan.id, 'terima')
                                  }
                                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Terima
                                </button>
                                <button
                                  onClick={() =>
                                    handleAction(pengajuan.id, 'tolak')
                                  }
                                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {tawaranData.total === 0 && (
                      <div className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">
                          Belum ada tawaran dari dosen
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Tawaran akan muncul di sini ketika dosen menawarkan
                          diri
                        </p>
                      </div>
                    )}
                  </div>
                  {tawaranData.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {(tawaranPage - 1) * tawaranPerPage + 1} -{' '}
                        {Math.min(
                          tawaranPage * tawaranPerPage,
                          tawaranData.total,
                        )}{' '}
                        dari {tawaranData.total}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setTawaranPage((p) => Math.max(1, p - 1))
                          }
                          disabled={tawaranPage === 1}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() =>
                            setTawaranPage((p) =>
                              Math.min(tawaranData.totalPages, p + 1),
                            )
                          }
                          disabled={tawaranPage === tawaranData.totalPages}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <ConfirmDialog
            open={confirmDialog.open}
            onOpenChange={(open) =>
              setConfirmDialog({ ...confirmDialog, open })
            }
            title={confirmDialog.title}
            description={confirmDialog.description}
            confirmText="Ya, Lanjutkan"
            cancelText="Batal"
            onConfirm={confirmDialog.onConfirm}
            variant={confirmDialog.variant}
          />
        </div>
      </Suspense>
    </PeriodeGuard>
  );
}
