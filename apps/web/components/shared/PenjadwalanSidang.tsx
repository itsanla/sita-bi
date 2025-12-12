'use client';

import {
  Calendar,
  Clock,
  Zap,
  Users,
  CheckCircle,
  XCircle,
  Search,
  FileDown,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface JadwalSidang {
  id?: number;
  tanggal_generate: string | null;
  status: 'BELUM_DIJADWALKAN' | 'DIJADWALKAN' | 'SELESAI';
}

export default function PenjadwalanSidang() {
  const [loading, setLoading] = useState(true);
  const [jadwal, setJadwal] = useState<JadwalSidang | null>(null);
  const [tanggalGenerate, setTanggalGenerate] = useState('');
  const [jamGenerate, setJamGenerate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [mahasiswaSiap, setMahasiswaSiap] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [jadwalResult, setJadwalResult] = useState<any[]>([]);
  const [jadwalTersimpan, setJadwalTersimpan] = useState<any[]>([]);
  const [loadingJadwal, setLoadingJadwal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editModal, setEditModal] = useState<any>(null);
  const [editOptions, setEditOptions] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [searchMhs, setSearchMhs] = useState('');
  const [searchKetua, setSearchKetua] = useState('');
  const [searchAnggota1, setSearchAnggota1] = useState('');
  const [searchAnggota2, setSearchAnggota2] = useState('');
  const [searchRuangan, setSearchRuangan] = useState('');
  const [showDropdownKetua, setShowDropdownKetua] = useState(false);
  const [showDropdownAnggota1, setShowDropdownAnggota1] = useState(false);
  const [showDropdownAnggota2, setShowDropdownAnggota2] = useState(false);
  const [showDropdownRuangan, setShowDropdownRuangan] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveDateFrom, setMoveDateFrom] = useState('');
  const [moveDateTo, setMoveDateTo] = useState('');
  const [movingJadwal, setMovingJadwal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapMhs1, setSwapMhs1] = useState('');
  const [swapMhs2, setSwapMhs2] = useState('');
  const [swapJadwal1, setSwapJadwal1] = useState<any>(null);
  const [swapJadwal2, setSwapJadwal2] = useState<any>(null);
  const [swappingJadwal, setSwappingJadwal] = useState(false);
  const [showDropdownMhs1, setShowDropdownMhs1] = useState(false);
  const [showDropdownMhs2, setShowDropdownMhs2] = useState(false);
  const [searchMahasiswa, setSearchMahasiswa] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [currentPageMhs, setCurrentPageMhs] = useState(1);
  const itemsPerPageMhs = 5;
  const [detailMahasiswa, setDetailMahasiswa] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const fetchJadwal = async () => {
    console.log('[FRONTEND] 🔄 Fetching jadwal dan mahasiswa siap...');
    try {
      const [jadwalRes, mahasiswaRes, jadwalTersimpanRes, optionsRes] =
        await Promise.all([
          api.get('/penjadwalan-sidang/pengaturan'),
          api.get('/jadwal-sidang-smart/mahasiswa-siap'),
          api.get('/jadwal-sidang-smart/jadwal'),
          api.get('/jadwal-sidang-smart/options'),
        ]);

      console.log('[FRONTEND] ✅ Jadwal response:', jadwalRes.data);
      console.log('[FRONTEND] ✅ Mahasiswa siap response:', mahasiswaRes.data);
      console.log(
        '[FRONTEND] ✅ Jadwal tersimpan response:',
        jadwalTersimpanRes.data,
      );

      setJadwal(jadwalRes.data.data);
      setMahasiswaSiap(mahasiswaRes.data.data || []);
      setJadwalTersimpan(jadwalTersimpanRes.data.data || []);
      setEditOptions(optionsRes.data.data);

      if (jadwalRes.data.data?.tanggal_generate) {
        const date = new Date(jadwalRes.data.data.tanggal_generate);
        console.log('[FRONTEND] 📅 Tanggal generate:', date);
        setTanggalGenerate(date.toISOString().split('T')[0]);
        setJamGenerate(date.toTimeString().slice(0, 5));
      }
    } catch (error: any) {
      console.error('[FRONTEND] ❌ Error fetching jadwal:', error);
      console.error('[FRONTEND] ❌ Error response:', error.response?.data);
      if (error.response?.status !== 404) {
        toast.error('Gagal memuat pengaturan jadwal');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  useEffect(() => {
    if (!jadwal?.tanggal_generate) return;

    // Jika status SELESAI tapi jadwal tersimpan masih kosong, polling sampai ada data
    if (jadwal.status === 'SELESAI' && jadwalTersimpan.length === 0) {
      const intervalId = setInterval(() => {
        fetchJadwal();
      }, 3000);
      return () => clearInterval(intervalId);
    }

    if (jadwal.status === 'SELESAI') return;

    const targetTime = new Date(jadwal.tanggal_generate).getTime();
    const now = Date.now();
    const timeUntilGenerate = targetTime - now;

    if (timeUntilGenerate <= 0) {
      // Waktu sudah lewat, polling setiap 5 detik untuk cek status
      const intervalId = setInterval(() => {
        fetchJadwal();
      }, 5000);
      return () => clearInterval(intervalId);
    }

    if (timeUntilGenerate <= 60000) {
      // Kurang dari 1 menit, polling setiap 5 detik
      const intervalId = setInterval(() => {
        fetchJadwal();
      }, 5000);
      return () => clearInterval(intervalId);
    }

    if (timeUntilGenerate <= 3600000) {
      // Kurang dari 1 jam, set timeout tepat di waktu generate
      const timeoutId = setTimeout(() => {
        fetchJadwal();
      }, timeUntilGenerate);
      return () => clearTimeout(timeoutId);
    }
  }, [jadwal, jadwalTersimpan.length]);

  const handleAturJadwal = async () => {
    console.log('[FRONTEND] 🎯 Atur jadwal clicked');
    console.log('[FRONTEND] 📅 Tanggal:', tanggalGenerate, 'Jam:', jamGenerate);

    if (!tanggalGenerate || !jamGenerate) {
      console.warn('[FRONTEND] ⚠️ Tanggal atau jam kosong');
      toast.error('Tanggal dan jam harus diisi');
      return;
    }

    const datetime = `${tanggalGenerate}T${jamGenerate}:00`;
    const targetDate = new Date(datetime);
    console.log('[FRONTEND] 🕐 Target datetime:', datetime, targetDate);

    if (targetDate <= new Date()) {
      console.warn('[FRONTEND] ⚠️ Tanggal di masa lalu');
      toast.error('Tanggal dan jam harus di masa depan');
      return;
    }

    setProcessing(true);
    try {
      console.log('[FRONTEND] 📤 Sending atur jadwal request...');
      await api.post('/penjadwalan-sidang/pengaturan', {
        tanggal_generate: datetime,
      });
      console.log('[FRONTEND] ✅ Jadwal berhasil diatur');
      toast.success('Jadwal generate sidang berhasil diatur');
      await fetchJadwal();
    } catch (error: any) {
      console.error('[FRONTEND] ❌ Error atur jadwal:', error);
      console.error('[FRONTEND] ❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Gagal mengatur jadwal');
    } finally {
      setProcessing(false);
    }
  };

  const handleBatalkan = async () => {
    if (!confirm('Yakin ingin membatalkan jadwal generate?')) return;

    setProcessing(true);
    try {
      await api.delete('/penjadwalan-sidang/pengaturan');
      toast.success('Jadwal generate dibatalkan');
      setJadwal(null);
      setTanggalGenerate('');
      setJamGenerate('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membatalkan jadwal');
    } finally {
      setProcessing(false);
    }
  };

  const [errorInfo, setErrorInfo] = useState<any>(null);

  const handleGenerateSekarang = async () => {
    console.log('[FRONTEND] 🚀 Generate sekarang clicked');
    console.log('[FRONTEND] 👥 Jumlah mahasiswa siap:', mahasiswaSiap.length);

    if (
      !confirm(
        `Yakin ingin menjadwalkan ${mahasiswaSiap.length} mahasiswa sekarang?`,
      )
    ) {
      console.log('[FRONTEND] ❌ User cancelled');
      return;
    }

    setGenerating(true);
    setErrorInfo(null);
    console.log('[FRONTEND] 📤 Sending generate request...');

    try {
      const response = await api.post('/jadwal-sidang-smart/generate');
      console.log('[FRONTEND] ✅ Generate response:', response.data);
      console.log('[FRONTEND] 📊 Jadwal result:', response.data.data);

      toast.success(
        `Berhasil menjadwalkan ${response.data.data.length} mahasiswa`,
      );
      await fetchJadwal();

      // Scroll ke jadwal tersimpan
      setTimeout(() => {
        document
          .getElementById('jadwal-tersimpan')
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (error: any) {
      // Parse smart error message
      try {
        const errorData = JSON.parse(error.response?.data?.message);
        setErrorInfo(errorData);
      } catch {
        // Not a JSON error, will be handled by interceptor
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleHapusJadwal = async () => {
    setLoadingJadwal(true);
    try {
      const response = await api.delete('/jadwal-sidang-smart/jadwal');
      toast.success(response.data.message);
      setShowDeleteAllModal(false);
      await fetchJadwal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus jadwal');
    } finally {
      setLoadingJadwal(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/jadwal-sidang-smart/export/pdf', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success('PDF berhasil dibuka');
    } catch (error: any) {
      toast.error('Gagal membuka PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/jadwal-sidang-smart/export/excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jadwal-sidang-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel berhasil diunduh');
    } catch (error: any) {
      toast.error('Gagal mengunduh Excel');
    }
  };

  // Filter dan pagination
  const filteredJadwal = jadwalTersimpan.filter((item: any) => {
    const mhs = item.sidang.tugasAkhir.mahasiswa;
    const peran = item.sidang.tugasAkhir.peranDosenTa;
    const ketua = peran.find((p: any) => p.peran === 'penguji1');
    const sekretaris = peran.find((p: any) => p.peran === 'pembimbing1');
    const anggota1 = peran.find((p: any) => p.peran === 'penguji2');
    const anggota2 = peran.find((p: any) => p.peran === 'penguji3');

    const searchLower = searchQuery.toLowerCase();
    return (
      mhs.user.name.toLowerCase().includes(searchLower) ||
      mhs.nim.toLowerCase().includes(searchLower) ||
      ketua?.dosen.user.name.toLowerCase().includes(searchLower) ||
      sekretaris?.dosen.user.name.toLowerCase().includes(searchLower) ||
      anggota1?.dosen.user.name.toLowerCase().includes(searchLower) ||
      anggota2?.dosen.user.name.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredJadwal.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJadwal = filteredJadwal.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-900 to-red-800 rounded-lg flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Penjadwalan Sidang
            </h1>
            <p className="text-sm text-gray-600">
              Atur kapan jadwal sidang akan di-generate otomatis
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Atur Jadwal Generate Otomatis
              </h2>
              <p className="text-xs text-red-100">
                Sistem akan otomatis menjadwalkan sidang pada waktu yang
                ditentukan
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {jadwal?.status === 'SELESAI' ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-green-900 mb-2">
                      ✅ Jadwal Sudah Di-generate
                    </p>
                    <p className="text-sm text-green-800">
                      Sidang telah berhasil di-generate pada:
                    </p>
                    <div className="mt-3 bg-white/60 backdrop-blur-sm rounded-lg px-4 py-3 border border-green-200">
                      <p className="text-base font-bold text-green-900">
                        📅{' '}
                        {new Date(jadwal.tanggal_generate!).toLocaleString(
                          'id-ID',
                          {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-800">
                  💡 <span className="font-semibold">Tips:</span> Anda dapat
                  mengatur jadwal generate baru atau menghapus semua jadwal yang
                  sudah dibuat.
                </p>
              </div>

              {jadwalTersimpan.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  disabled={loadingJadwal}
                  className="w-full px-5 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Hapus Semua Jadwal & Reset</span>
                </button>
              )}
            </div>
          ) : jadwal?.status === 'DIJADWALKAN' ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      <Clock className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-blue-900 mb-2">
                      ⏰ Jadwal Generate Terjadwal
                    </p>
                    <p className="text-sm text-blue-800 mb-3">
                      Sistem akan otomatis menjadwalkan sidang pada:
                    </p>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg px-4 py-3 border border-blue-200">
                      <p className="text-base font-bold text-blue-900">
                        📅{' '}
                        {new Date(jadwal.tanggal_generate!).toLocaleString(
                          'id-ID',
                          {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-amber-800">
                  ⚠️ <span className="font-semibold">Perhatian:</span>{' '}
                  Membatalkan jadwal akan menghapus pengaturan waktu generate
                  otomatis.
                </p>
              </div>

              <button
                onClick={handleBatalkan}
                disabled={processing}
                className="w-full px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
              >
                <XCircle className="w-5 h-5" />
                <span>
                  {processing ? 'Membatalkan...' : 'Batalkan Jadwal Generate'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">💡</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Informasi Penting
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Atur tanggal dan jam untuk generate jadwal sidang secara
                      otomatis. Sistem akan menjadwalkan semua mahasiswa yang
                      siap sidang pada waktu yang ditentukan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-red-900" />
                    <span>Tanggal Generate</span>
                  </label>
                  <input
                    type="date"
                    value={tanggalGenerate}
                    onChange={(e) => setTanggalGenerate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={processing}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Clock className="w-4 h-4 text-red-900" />
                    <span>Jam Generate</span>
                  </label>
                  <input
                    type="time"
                    value={jamGenerate}
                    onChange={(e) => setJamGenerate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={processing}
                  />
                </div>
              </div>

              <button
                onClick={handleAturJadwal}
                disabled={processing || !tanggalGenerate || !jamGenerate}
                className="w-full px-5 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-lg hover:from-red-950 hover:to-red-900 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
              >
                <Zap className="w-5 h-5" />
                <span>
                  {processing ? 'Menyimpan...' : 'Simpan Jadwal Generate'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {jadwal?.status !== 'SELESAI' && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Status Mahasiswa Sidang
                </h2>
                <p className="text-sm text-gray-600">
                  {
                    mahasiswaSiap.filter((m: any) => {
                      const matchSearch =
                        !searchMahasiswa ||
                        m.tugasAkhir?.mahasiswa?.user?.name
                          ?.toLowerCase()
                          .includes(searchMahasiswa.toLowerCase()) ||
                        m.tugasAkhir?.mahasiswa?.nim
                          ?.toLowerCase()
                          .includes(searchMahasiswa.toLowerCase());
                      const matchFilter =
                        filterStatus === 'semua' ||
                        m.status_display === filterStatus;
                      return matchSearch && matchFilter;
                    }).length
                  }{' '}
                  mahasiswa
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateSekarang}
              disabled={
                generating ||
                mahasiswaSiap.filter(
                  (m: any) => m.status_display === 'siap_sidang',
                ).length === 0
              }
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Zap className="w-5 h-5" />
              <span>
                {generating
                  ? 'Menjadwalkan...'
                  : `Jadwalkan (${mahasiswaSiap.filter((m: any) => m.status_display === 'siap_sidang').length})`}
              </span>
            </button>
          </div>

          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau NIM mahasiswa..."
                value={searchMahasiswa}
                onChange={(e) => {
                  setSearchMahasiswa(e.target.value);
                  setCurrentPageMhs(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setFilterStatus('semua');
                  setCurrentPageMhs(1);
                }}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filterStatus === 'semua'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semua ({mahasiswaSiap.length})
              </button>
              <button
                onClick={() => {
                  setFilterStatus('siap_sidang');
                  setCurrentPageMhs(1);
                }}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filterStatus === 'siap_sidang'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Siap Sidang (
                {
                  mahasiswaSiap.filter(
                    (m: any) => m.status_display === 'siap_sidang',
                  ).length
                }
                )
              </button>
              <button
                onClick={() => {
                  setFilterStatus('menunggu_validasi');
                  setCurrentPageMhs(1);
                }}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filterStatus === 'menunggu_validasi'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Menunggu Validasi (
                {
                  mahasiswaSiap.filter(
                    (m: any) => m.status_display === 'menunggu_validasi',
                  ).length
                }
                )
              </button>
              <button
                onClick={() => {
                  setFilterStatus('ditolak');
                  setCurrentPageMhs(1);
                }}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filterStatus === 'ditolak'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ditolak (
                {
                  mahasiswaSiap.filter(
                    (m: any) => m.status_display === 'ditolak',
                  ).length
                }
                )
              </button>
              <button
                onClick={() => {
                  setFilterStatus('belum_daftar');
                  setCurrentPageMhs(1);
                }}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filterStatus === 'belum_daftar'
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Belum Daftar (
                {
                  mahasiswaSiap.filter(
                    (m: any) => m.status_display === 'belum_daftar',
                  ).length
                }
                )
              </button>
            </div>
          </div>

          {mahasiswaSiap.length > 0 &&
            (() => {
              const filteredMhs = mahasiswaSiap.filter((mhs: any) => {
                const matchSearch =
                  !searchMahasiswa ||
                  mhs.tugasAkhir?.mahasiswa?.user?.name
                    ?.toLowerCase()
                    .includes(searchMahasiswa.toLowerCase()) ||
                  mhs.tugasAkhir?.mahasiswa?.nim
                    ?.toLowerCase()
                    .includes(searchMahasiswa.toLowerCase());
                const matchFilter =
                  filterStatus === 'semua' ||
                  mhs.status_display === filterStatus;
                return matchSearch && matchFilter;
              });

              const totalPagesMhs = Math.ceil(
                filteredMhs.length / itemsPerPageMhs,
              );
              const startIndexMhs = (currentPageMhs - 1) * itemsPerPageMhs;
              const paginatedMhs = filteredMhs.slice(
                startIndexMhs,
                startIndexMhs + itemsPerPageMhs,
              );

              return (
                <>
                  <div className="space-y-2">
                    {paginatedMhs.map((mhs: any, idx: number) => {
                      const getStatusBadge = () => {
                        switch (mhs.status_display) {
                          case 'siap_sidang':
                            return (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                                Siap Sidang
                              </span>
                            );
                          case 'menunggu_validasi':
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">
                                  Menunggu Validasi
                                </span>
                                <span className="text-xs text-gray-500">
                                  {mhs.validator_info}
                                </span>
                              </div>
                            );
                          case 'ditolak':
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                                  Ditolak
                                </span>
                                {!!mhs.rejection_reason && (
                                  <span className="text-xs text-red-600 max-w-xs text-right">
                                    {mhs.rejection_reason}
                                  </span>
                                )}
                              </div>
                            );
                          case 'belum_daftar':
                            return (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded font-medium">
                                Belum Daftar
                              </span>
                            );
                          default:
                            return (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded font-medium">
                                -
                              </span>
                            );
                        }
                      };

                      return (
                        <div
                          key={`mhs-${mhs.tugasAkhir?.mahasiswa?.nim || idx}`}
                          onClick={() => setDetailMahasiswa(mhs)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-300 transition-all cursor-pointer"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {mhs.tugasAkhir?.mahasiswa?.user?.name || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {mhs.tugasAkhir?.mahasiswa?.nim || 'N/A'} •{' '}
                              {mhs.tugasAkhir?.judul || 'N/A'}
                            </p>
                          </div>
                          {getStatusBadge()}
                        </div>
                      );
                    })}
                  </div>

                  {totalPagesMhs > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Halaman {currentPageMhs} dari {totalPagesMhs} (
                        {filteredMhs.length} mahasiswa)
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setCurrentPageMhs((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPageMhs === 1}
                          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Sebelumnya
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPageMhs((p) =>
                              Math.min(totalPagesMhs, p + 1),
                            )
                          }
                          disabled={currentPageMhs === totalPagesMhs}
                          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
        </div>
      )}

      {jadwal?.status === 'SELESAI' && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Status Mahasiswa Sidang
                </h2>
                <p className="text-sm text-gray-600">
                  Jadwal sudah di-generate
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                disabled
                className="flex items-center space-x-2 px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed shadow-md"
              >
                <Zap className="w-5 h-5" />
                <span>Jadwalkan (0)</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await api.get(
                      '/jadwal-sidang-smart/export-gagal-sidang/pdf',
                      {
                        responseType: 'blob',
                      },
                    );
                    const blob = new Blob([response.data], {
                      type: 'application/pdf',
                    });
                    const url = window.URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    toast.success('PDF mahasiswa gagal sidang berhasil dibuka');
                  } catch (error: any) {
                    toast.error('Gagal membuka PDF');
                  }
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 hover:shadow-lg active:scale-95 transition-all shadow-md"
              >
                <FileDown className="w-5 h-5" />
                <span>Mahasiswa Gagal Sidang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!!errorInfo && (
        <div className="bg-white rounded-xl shadow-md border-2 border-red-500 p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                {errorInfo.status === 'KAPASITAS_DOSEN_TIDAK_CUKUP'
                  ? '🚨 Kapasitas Dosen Tidak Cukup'
                  : '⚠️ Gagal Menjadwalkan'}
              </h3>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  📊 Masalah:
                </p>
                <p className="text-sm text-red-800">{errorInfo.masalah}</p>
              </div>

              {!!errorInfo.perhitungan && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4 font-mono text-xs">
                  <pre className="whitespace-pre-wrap text-gray-800">
                    {errorInfo.perhitungan}
                  </pre>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  💡 Saran:
                </p>
                <p className="text-sm text-blue-800">{errorInfo.saran}</p>
              </div>

              {!!errorInfo.detail && (
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <summary className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Detail Teknis (klik untuk expand)
                  </summary>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                    {Object.entries(errorInfo.detail).map(
                      ([key, value]: [string, any]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ),
                    )}
                  </div>
                </details>
              )}

              <button
                onClick={() => setErrorInfo(null)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {jadwalTersimpan.length > 0 && (
        <div
          id="jadwal-tersimpan"
          className="bg-white rounded-xl shadow-md border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Jadwal Sidang Tersimpan ({filteredJadwal.length} dari{' '}
              {jadwalTersimpan.length})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all text-sm flex items-center space-x-2"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-md active:scale-95 transition-all text-sm flex items-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => setShowSwapModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all text-sm flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Tukar Jadwal</span>
              </button>
              <button
                onClick={() => setShowMoveModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:shadow-md active:scale-95 transition-all text-sm flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Pindahkan Jadwal</span>
              </button>
            </div>
          </div>

          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama mahasiswa, NIM, atau nama dosen..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Mahasiswa
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Ketua
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Anggota I
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Anggota II
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Hari/Tanggal
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Pukul
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Ruangan
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedJadwal.map((item: any) => {
                  const mhs = item.sidang.tugasAkhir.mahasiswa;
                  const peran = item.sidang.tugasAkhir.peranDosenTa;
                  const ketua = peran.find((p: any) => p.peran === 'penguji1');
                  const sekretaris = peran.find(
                    (p: any) => p.peran === 'pembimbing1',
                  );
                  const anggota1 = peran.find(
                    (p: any) => p.peran === 'penguji2',
                  );
                  const anggota2 = peran.find(
                    (p: any) => p.peran === 'penguji3',
                  );

                  const tanggal = new Date(item.tanggal);
                  const hariMap = [
                    'Minggu',
                    'Senin',
                    'Selasa',
                    'Rabu',
                    'Kamis',
                    'Jumat',
                    'Sabtu',
                  ];
                  const hari = hariMap[tanggal.getDay()];
                  const tanggalStr = tanggal.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-900">
                        {mhs.user.name}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {ketua?.dosen.user.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {anggota1?.dosen.user.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {anggota2?.dosen.user.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {hari}, {tanggalStr}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.waktu_mulai} - {item.waktu_selesai}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.ruangan.nama_ruangan}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setEditModal(item);
                              setEditForm({
                                tanggal: item.tanggal.split('T')[0],
                                waktu_mulai: item.waktu_mulai,
                                waktu_selesai: item.waktu_selesai,
                                ruangan_id: item.ruangan_id,
                                penguji1_id: ketua?.dosen_id,
                                penguji2_id: anggota1?.dosen_id,
                                penguji3_id: anggota2?.dosen_id,
                              });
                              setSearchKetua(ketua?.dosen.user.name || '');
                              setSearchAnggota1(
                                anggota1?.dosen.user.name || '',
                              );
                              setSearchAnggota2(
                                anggota2?.dosen.user.name || '',
                              );
                              setSearchRuangan(item.ruangan.nama_ruangan || '');
                              setShowDropdownKetua(false);
                              setShowDropdownAnggota1(false);
                              setShowDropdownAnggota2(false);
                              setShowDropdownRuangan(false);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 hover:shadow active:scale-95 transition-all text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeleteModal(item);
                              setDeleteReason('');
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 hover:shadow active:scale-95 transition-all text-xs"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages} ({filteredJadwal.length}{' '}
                data)
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1)
                      return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <div key={page} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all ${
                          currentPage === page
                            ? 'bg-red-900 text-white shadow-md'
                            : 'border border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:scale-95'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Catatan:</span> Sistem akan otomatis
          men-generate jadwal sidang untuk semua mahasiswa yang siap sidang pada
          tanggal dan jam yang ditentukan, atau klik "Jadwalkan Sekarang" untuk
          generate langsung.
        </p>
      </div>

      {!!detailMahasiswa && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 -mt-16 lg:-mt-0 animate-in fade-in duration-200"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            marginTop: '-64px',
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Detail Mahasiswa</h3>
              <button
                onClick={() => setDetailMahasiswa(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {detailMahasiswa.tugasAkhir?.mahasiswa?.user?.name}
                  </h4>
                  {(() => {
                    switch (detailMahasiswa.status_display) {
                      case 'siap_sidang':
                        return (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Siap Sidang
                          </span>
                        );
                      case 'menunggu_validasi':
                        return (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                            Menunggu Validasi
                          </span>
                        );
                      case 'ditolak':
                        return (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            Ditolak
                          </span>
                        );
                      case 'belum_daftar':
                        return (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                            Belum Daftar
                          </span>
                        );
                    }
                  })()}
                </div>
                <p className="text-sm text-gray-600">
                  NIM: {detailMahasiswa.tugasAkhir?.mahasiswa?.nim}
                </p>
                <p className="text-sm text-gray-600">
                  Prodi: {detailMahasiswa.tugasAkhir?.mahasiswa?.prodi}
                </p>
                <p className="text-sm text-gray-600">
                  Kelas: {detailMahasiswa.tugasAkhir?.mahasiswa?.kelas}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Judul Tugas Akhir
                </h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {detailMahasiswa.tugasAkhir?.judul}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Pembimbing</h4>
                <div className="space-y-2">
                  {detailMahasiswa.tugasAkhir?.peranDosenTa?.map(
                    (peran: any) => (
                      <div
                        key={peran.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {peran.dosen?.user?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {peran.dosen?.nip}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {peran.peran === 'pembimbing1'
                            ? 'Pembimbing 1'
                            : 'Pembimbing 2'}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {detailMahasiswa.status_display === 'menunggu_validasi' &&
                !!detailMahasiswa.validator_info && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Status Validasi
                    </p>
                    <p className="text-sm text-amber-800">
                      {detailMahasiswa.validator_info}
                    </p>
                  </div>
                )}

              {detailMahasiswa.status_display === 'ditolak' &&
                !!detailMahasiswa.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      Alasan Penolakan
                    </p>
                    <p className="text-sm text-red-800">
                      {detailMahasiswa.rejection_reason}
                    </p>
                  </div>
                )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-end border-t">
              <button
                onClick={() => setDetailMahasiswa(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {!!showSwapModal && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 -mt-16 lg:-mt-0 animate-in fade-in duration-200"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            marginTop: '-64px',
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Tukar Jadwal Mahasiswa</h3>
              <button
                onClick={() => {
                  setShowSwapModal(false);
                  setSwapMhs1('');
                  setSwapMhs2('');
                  setSwapJadwal1(null);
                  setSwapJadwal2(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Info:</span> Pilih 2 mahasiswa
                  untuk menukar jadwal sidang mereka (tanggal, waktu, dan
                  ruangan akan ditukar).
                </p>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Mahasiswa 1
                </label>
                <input
                  type="text"
                  placeholder="Ketik nama mahasiswa 1..."
                  value={swapMhs1}
                  onChange={(e) => {
                    setSwapMhs1(e.target.value);
                    const found = jadwalTersimpan.find(
                      (j: any) =>
                        j.sidang.tugasAkhir.mahasiswa.user.name.toLowerCase() ===
                        e.target.value.toLowerCase(),
                    );
                    setSwapJadwal1(found || null);
                    setShowDropdownMhs1(true);
                  }}
                  onFocus={() => setShowDropdownMhs1(true)}
                  onBlur={() =>
                    setTimeout(() => setShowDropdownMhs1(false), 200)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {!!swapMhs1 && !swapJadwal1 && (
                  <p className="text-xs text-red-500 mt-1">
                    Mahasiswa "{swapMhs1}" tidak ditemukan
                  </p>
                )}
                {!!showDropdownMhs1 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {jadwalTersimpan
                      .filter(
                        (j: any) =>
                          !swapMhs1 ||
                          j.sidang.tugasAkhir.mahasiswa.user.name
                            .toLowerCase()
                            .includes(swapMhs1.toLowerCase()),
                      )
                      .map((j: any) => (
                        <div
                          key={j.id}
                          onClick={() => {
                            setSwapMhs1(
                              j.sidang.tugasAkhir.mahasiswa.user.name,
                            );
                            setSwapJadwal1(j);
                            setShowDropdownMhs1(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        >
                          <p className="text-sm font-medium">
                            {j.sidang.tugasAkhir.mahasiswa.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(j.tanggal).toLocaleDateString('id-ID')} •{' '}
                            {j.waktu_mulai} • {j.ruangan.nama_ruangan}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
                {!!swapJadwal1 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium">
                      {swapJadwal1.sidang.tugasAkhir.mahasiswa.user.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(swapJadwal1.tanggal).toLocaleDateString(
                        'id-ID',
                        {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        },
                      )}
                      {' • '}
                      {swapJadwal1.waktu_mulai} - {swapJadwal1.waktu_selesai}
                      {' • '}
                      {swapJadwal1.ruangan.nama_ruangan}
                    </p>
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Mahasiswa 2
                </label>
                <input
                  type="text"
                  placeholder="Ketik nama mahasiswa 2..."
                  value={swapMhs2}
                  onChange={(e) => {
                    setSwapMhs2(e.target.value);
                    const found = jadwalTersimpan.find(
                      (j: any) =>
                        j.sidang.tugasAkhir.mahasiswa.user.name.toLowerCase() ===
                        e.target.value.toLowerCase(),
                    );
                    setSwapJadwal2(found || null);
                    setShowDropdownMhs2(true);
                  }}
                  onFocus={() => setShowDropdownMhs2(true)}
                  onBlur={() =>
                    setTimeout(() => setShowDropdownMhs2(false), 200)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {!!swapMhs2 && !swapJadwal2 && (
                  <p className="text-xs text-red-500 mt-1">
                    Mahasiswa "{swapMhs2}" tidak ditemukan
                  </p>
                )}
                {!!showDropdownMhs2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {jadwalTersimpan
                      .filter(
                        (j: any) =>
                          !swapMhs2 ||
                          j.sidang.tugasAkhir.mahasiswa.user.name
                            .toLowerCase()
                            .includes(swapMhs2.toLowerCase()),
                      )
                      .map((j: any) => (
                        <div
                          key={j.id}
                          onClick={() => {
                            setSwapMhs2(
                              j.sidang.tugasAkhir.mahasiswa.user.name,
                            );
                            setSwapJadwal2(j);
                            setShowDropdownMhs2(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        >
                          <p className="text-sm font-medium">
                            {j.sidang.tugasAkhir.mahasiswa.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(j.tanggal).toLocaleDateString('id-ID')} •{' '}
                            {j.waktu_mulai} • {j.ruangan.nama_ruangan}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
                {!!swapJadwal2 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium">
                      {swapJadwal2.sidang.tugasAkhir.mahasiswa.user.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(swapJadwal2.tanggal).toLocaleDateString(
                        'id-ID',
                        {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        },
                      )}
                      {' • '}
                      {swapJadwal2.waktu_mulai} - {swapJadwal2.waktu_selesai}
                      {' • '}
                      {swapJadwal2.ruangan.nama_ruangan}
                    </p>
                  </div>
                )}
              </div>

              {!!swapJadwal1 && !!swapJadwal2 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 mb-2">
                    Preview Pertukaran:
                  </p>
                  <div className="space-y-2 text-xs text-green-800">
                    <div>
                      <span className="font-medium">
                        {swapJadwal1.sidang.tugasAkhir.mahasiswa.user.name}
                      </span>
                      <br />
                      <span className="text-red-600">
                        Dari:{' '}
                        {new Date(swapJadwal1.tanggal).toLocaleDateString(
                          'id-ID',
                        )}{' '}
                        • {swapJadwal1.waktu_mulai}-{swapJadwal1.waktu_selesai}{' '}
                        • {swapJadwal1.ruangan.nama_ruangan}
                      </span>
                      <br />
                      <span className="text-green-600">
                        Ke:{' '}
                        {new Date(swapJadwal2.tanggal).toLocaleDateString(
                          'id-ID',
                        )}{' '}
                        • {swapJadwal2.waktu_mulai}-{swapJadwal2.waktu_selesai}{' '}
                        • {swapJadwal2.ruangan.nama_ruangan}
                      </span>
                    </div>
                    <div className="border-t border-green-300 pt-2">
                      <span className="font-medium">
                        {swapJadwal2.sidang.tugasAkhir.mahasiswa.user.name}
                      </span>
                      <br />
                      <span className="text-red-600">
                        Dari:{' '}
                        {new Date(swapJadwal2.tanggal).toLocaleDateString(
                          'id-ID',
                        )}{' '}
                        • {swapJadwal2.waktu_mulai}-{swapJadwal2.waktu_selesai}{' '}
                        • {swapJadwal2.ruangan.nama_ruangan}
                      </span>
                      <br />
                      <span className="text-green-600">
                        Ke:{' '}
                        {new Date(swapJadwal1.tanggal).toLocaleDateString(
                          'id-ID',
                        )}{' '}
                        • {swapJadwal1.waktu_mulai}-{swapJadwal1.waktu_selesai}{' '}
                        • {swapJadwal1.ruangan.nama_ruangan}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-end space-x-3 border-t">
              <button
                onClick={() => {
                  setShowSwapModal(false);
                  setSwapMhs1('');
                  setSwapMhs2('');
                  setSwapJadwal1(null);
                  setSwapJadwal2(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!swapJadwal1 || !swapJadwal2) {
                    toast.error('Pilih 2 mahasiswa yang valid');
                    return;
                  }

                  if (swapJadwal1.id === swapJadwal2.id) {
                    toast.error('Tidak bisa menukar jadwal yang sama');
                    return;
                  }

                  if (
                    !confirm(
                      `Yakin ingin menukar jadwal ${swapJadwal1.sidang.tugasAkhir.mahasiswa.user.name} dengan ${swapJadwal2.sidang.tugasAkhir.mahasiswa.user.name}?`,
                    )
                  ) {
                    return;
                  }

                  setSwappingJadwal(true);
                  try {
                    const response = await api.post(
                      '/jadwal-sidang-smart/swap-schedule',
                      {
                        jadwal1_id: swapJadwal1.id,
                        jadwal2_id: swapJadwal2.id,
                      },
                    );
                    toast.success(response.data.message);
                    setShowSwapModal(false);
                    setSwapMhs1('');
                    setSwapMhs2('');
                    setSwapJadwal1(null);
                    setSwapJadwal2(null);
                    fetchJadwal();
                  } catch (error: any) {
                    // Error handled by interceptor
                  } finally {
                    setSwappingJadwal(false);
                  }
                }}
                disabled={swappingJadwal || !swapJadwal1 || !swapJadwal2}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {swappingJadwal ? 'Menukar...' : 'Tukar Jadwal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!!showMoveModal && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 -mt-16 lg:-mt-0 animate-in fade-in duration-200"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            marginTop: '-64px',
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Pindahkan Jadwal Massal</h3>
              <button
                onClick={() => setShowMoveModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Info:</span> Semua jadwal yang
                  dimulai dari tanggal yang dipilih akan dipindahkan ke tanggal
                  baru dengan mempertahankan urutan hari.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pindahkan Dari Tanggal
                </label>
                <input
                  type="date"
                  value={moveDateFrom}
                  onChange={(e) => setMoveDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pindahkan Ke Tanggal
                </label>
                <input
                  type="date"
                  value={moveDateTo}
                  onChange={(e) => setMoveDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-end space-x-3 border-t rounded-b-xl">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!moveDateFrom || !moveDateTo) {
                    toast.error('Kedua tanggal harus diisi');
                    return;
                  }

                  const dateFrom = new Date(moveDateFrom);
                  const dateTo = new Date(moveDateTo);

                  if (dateTo <= dateFrom) {
                    toast.error(
                      'Tanggal tujuan harus lebih besar dari tanggal asal',
                    );
                    return;
                  }

                  if (
                    !confirm(
                      `Yakin ingin memindahkan semua jadwal dari ${dateFrom.toLocaleDateString('id-ID')} ke ${dateTo.toLocaleDateString('id-ID')}?`,
                    )
                  ) {
                    return;
                  }

                  setMovingJadwal(true);
                  try {
                    const response = await api.post(
                      '/jadwal-sidang-smart/move-schedule',
                      {
                        from_date: moveDateFrom,
                        to_date: moveDateTo,
                      },
                    );
                    toast.success(response.data.message);
                    setShowMoveModal(false);
                    setMoveDateFrom('');
                    setMoveDateTo('');
                    fetchJadwal();
                  } catch (error: any) {
                    // Error handled by interceptor
                  } finally {
                    setMovingJadwal(false);
                  }
                }}
                disabled={movingJadwal}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {movingJadwal ? 'Memindahkan...' : 'Pindahkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!!showDeleteAllModal && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 -mt-16 lg:-mt-0 animate-in fade-in duration-200"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            marginTop: '-64px',
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <XCircle className="w-6 h-6" />
                <span>Konfirmasi Hapus Semua Jadwal</span>
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-5">
                <p className="text-base font-bold text-red-900 mb-3 flex items-center space-x-2">
                  <span className="text-2xl">⚠️</span>
                  <span>PERINGATAN PENTING</span>
                </p>
                <p className="text-sm text-red-800 leading-relaxed">
                  Yakin ingin menghapus <span className="font-bold">SEMUA jadwal sidang</span> yang sudah dibuat?
                </p>
                <p className="text-sm text-red-900 font-semibold mt-2">
                  Tindakan ini tidak dapat dibatalkan!
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  📊 <span className="font-semibold">Info:</span> Semua mahasiswa akan dikembalikan ke status "Siap Sidang" dan dapat dijadwalkan ulang.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-6 flex justify-end space-x-3 border-t">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                disabled={loadingJadwal}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleHapusJadwal}
                disabled={loadingJadwal}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingJadwal ? 'Menghapus...' : 'Ya, Hapus Semua'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!!deleteModal && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 -mt-16 lg:-mt-0 animate-in fade-in duration-200"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            marginTop: '-64px',
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <XCircle className="w-6 h-6" />
                <span>Konfirmasi Hapus Jadwal</span>
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  ⚠️ PERINGATAN PENTING
                </p>
                <p className="text-sm text-red-800 leading-relaxed">
                  Menghapus jadwal akan membuat mahasiswa <span className="font-bold">{deleteModal.sidang.tugasAkhir.mahasiswa.user.name}</span> gagal sidang periode ini dengan status "KHUSUS".
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <span className="font-semibold">Catatan:</span> Jika ingin mengubah jadwal mahasiswa, gunakan tombol <span className="font-semibold">"Edit"</span> sebagai gantinya.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Alasan Penghapusan <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Masukkan alasan kenapa mahasiswa ini dihapus dari jadwal sidang..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alasan ini akan muncul di PDF Mahasiswa Gagal Sidang
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-6 flex justify-end space-x-3 border-t">
              <button
                onClick={() => {
                  setDeleteModal(null);
                  setDeleteReason('');
                }}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all font-medium"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!deleteReason.trim()) {
                    toast.error('Alasan penghapusan harus diisi');
                    return;
                  }

                  try {
                    await api.delete(
                      `/jadwal-sidang-smart/jadwal/${deleteModal.id}`,
                      { data: { alasan: deleteReason } }
                    );
                    toast.success('Jadwal berhasil dihapus dan mahasiswa ditandai gagal sidang');
                    setDeleteModal(null);
                    setDeleteReason('');
                    fetchJadwal();
                  } catch (error: any) {
                    toast.error('Gagal menghapus jadwal');
                  }
                }}
                disabled={!deleteReason.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hapus & Tandai Gagal Sidang
              </button>
            </div>
          </div>
        </div>
      )}

      {!!editModal && !!editOptions && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 -mt-16 lg:-mt-0 animate-in fade-in duration-200"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            marginTop: '-64px',
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4 animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Calendar className="w-6 h-6" />
                <span>Edit Jadwal Sidang</span>
              </h3>
              <button
                onClick={() => setEditModal(null)}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Info:</span> Edit jadwal untuk <span className="font-semibold">{editModal.sidang.tugasAkhir.mahasiswa.user.name}</span>
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">
                    📅 Tanggal
                  </label>
                  <input
                    type="date"
                    value={editForm.tanggal}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tanggal: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">
                    🕐 Mulai
                  </label>
                  <input
                    type="time"
                    value={editForm.waktu_mulai}
                    onChange={(e) =>
                      setEditForm({ ...editForm, waktu_mulai: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">
                    🕐 Selesai
                  </label>
                  <input
                    type="time"
                    value={editForm.waktu_selesai}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        waktu_selesai: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  👨🏫 Ketua Penguji
                </label>
                <input
                  type="text"
                  placeholder="Ketik nama ketua penguji..."
                  value={searchKetua}
                  onChange={(e) => {
                    setSearchKetua(e.target.value);
                    const exactMatch = editOptions.dosen.find(
                      (d: any) =>
                        d.name.toLowerCase() === e.target.value.toLowerCase(),
                    );
                    setEditForm({ ...editForm, penguji1_id: exactMatch?.id });
                    setShowDropdownKetua(true);
                  }}
                  onFocus={() => setShowDropdownKetua(true)}
                  onBlur={() =>
                    setTimeout(() => setShowDropdownKetua(false), 200)
                  }
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {!!searchKetua && !editForm.penguji1_id && (
                  <p className="text-xs text-red-500 mt-1">
                    Tidak ada dosen "{searchKetua}"
                  </p>
                )}
                {!!showDropdownKetua && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {editOptions.dosen
                      .filter(
                        (d: any) =>
                          !searchKetua ||
                          d.name
                            .toLowerCase()
                            .includes(searchKetua.toLowerCase()),
                      )
                      .map((d: any) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setEditForm({ ...editForm, penguji1_id: d.id });
                            setSearchKetua(d.name);
                            setShowDropdownKetua(false);
                          }}
                          className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                        >
                          {d.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-900 mb-1">
                    👨🏫 Anggota Penguji I
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik nama anggota penguji I..."
                    value={searchAnggota1}
                    onChange={(e) => {
                      setSearchAnggota1(e.target.value);
                      const exactMatch = editOptions.dosen.find(
                        (d: any) =>
                          d.name.toLowerCase() === e.target.value.toLowerCase(),
                      );
                      setEditForm({ ...editForm, penguji2_id: exactMatch?.id });
                      setShowDropdownAnggota1(true);
                    }}
                    onFocus={() => setShowDropdownAnggota1(true)}
                    onBlur={() =>
                      setTimeout(() => setShowDropdownAnggota1(false), 200)
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {!!searchAnggota1 && !editForm.penguji2_id && (
                    <p className="text-xs text-red-500 mt-1">
                      Tidak ada dosen "{searchAnggota1}"
                    </p>
                  )}
                  {!!showDropdownAnggota1 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {editOptions.dosen
                        .filter(
                          (d: any) =>
                            !searchAnggota1 ||
                            d.name
                              .toLowerCase()
                              .includes(searchAnggota1.toLowerCase()),
                        )
                        .map((d: any) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setEditForm({ ...editForm, penguji2_id: d.id });
                              setSearchAnggota1(d.name);
                              setShowDropdownAnggota1(false);
                            }}
                            className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                          >
                            {d.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-900 mb-1">
                    👨🏫 Anggota Penguji II
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik nama anggota penguji II..."
                    value={searchAnggota2}
                    onChange={(e) => {
                      setSearchAnggota2(e.target.value);
                      const exactMatch = editOptions.dosen.find(
                        (d: any) =>
                          d.name.toLowerCase() === e.target.value.toLowerCase(),
                      );
                      setEditForm({ ...editForm, penguji3_id: exactMatch?.id });
                      setShowDropdownAnggota2(true);
                    }}
                    onFocus={() => setShowDropdownAnggota2(true)}
                    onBlur={() =>
                      setTimeout(() => setShowDropdownAnggota2(false), 200)
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {!!searchAnggota2 && !editForm.penguji3_id && (
                    <p className="text-xs text-red-500 mt-1">
                      Tidak ada dosen "{searchAnggota2}"
                    </p>
                  )}
                  {!!showDropdownAnggota2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {editOptions.dosen
                        .filter(
                          (d: any) =>
                            !searchAnggota2 ||
                            d.name
                              .toLowerCase()
                              .includes(searchAnggota2.toLowerCase()),
                        )
                        .map((d: any) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setEditForm({ ...editForm, penguji3_id: d.id });
                              setSearchAnggota2(d.name);
                              setShowDropdownAnggota2(false);
                            }}
                            className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                          >
                            {d.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  🏢 Ruangan
                </label>
                <input
                  type="text"
                  placeholder="Ketik nama ruangan..."
                  value={searchRuangan}
                  onChange={(e) => {
                    setSearchRuangan(e.target.value);
                    const exactMatch = editOptions.ruangan.find(
                      (r: any) =>
                        r.name.toLowerCase() === e.target.value.toLowerCase(),
                    );
                    setEditForm({ ...editForm, ruangan_id: exactMatch?.id });
                    setShowDropdownRuangan(true);
                  }}
                  onFocus={() => setShowDropdownRuangan(true)}
                  onBlur={() =>
                    setTimeout(() => setShowDropdownRuangan(false), 200)
                  }
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {!!searchRuangan && !editForm.ruangan_id && (
                  <p className="text-xs text-red-500 mt-1">
                    Tidak ada ruangan "{searchRuangan}"
                  </p>
                )}
                {!!showDropdownRuangan && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {editOptions.ruangan
                      .filter(
                        (r: any) =>
                          !searchRuangan ||
                          r.name
                            .toLowerCase()
                            .includes(searchRuangan.toLowerCase()),
                      )
                      .map((r: any) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setEditForm({ ...editForm, ruangan_id: r.id });
                            setSearchRuangan(r.name);
                            setShowDropdownRuangan(false);
                          }}
                          className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                        >
                          {r.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-end space-x-3 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all font-medium"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (editForm.waktu_mulai && editForm.waktu_selesai) {
                    const [hMulai, mMulai] = editForm.waktu_mulai
                      .split(':')
                      .map(Number);
                    const [hSelesai, mSelesai] = editForm.waktu_selesai
                      .split(':')
                      .map(Number);
                    const menitMulai = hMulai * 60 + mMulai;
                    const menitSelesai = hSelesai * 60 + mSelesai;

                    if (menitMulai >= menitSelesai) {
                      toast.error(
                        'Waktu mulai harus lebih awal dari waktu selesai',
                      );
                      return;
                    }
                  }

                  console.log('[FRONTEND EDIT] 📝 Starting edit jadwal');
                  console.log('[FRONTEND EDIT] 🎯 ID:', editModal.id);
                  console.log('[FRONTEND EDIT] 📦 Form data:', editForm);
                  console.log('[FRONTEND EDIT] 📋 Current jadwal:', {
                    tanggal: editModal.tanggal,
                    waktu_mulai: editModal.waktu_mulai,
                    waktu_selesai: editModal.waktu_selesai,
                    ruangan_id: editModal.ruangan_id,
                  });

                  try {
                    const response = await api.patch(
                      `/jadwal-sidang-smart/jadwal/${editModal.id}`,
                      editForm,
                    );
                    toast.success('Jadwal berhasil diupdate');
                    setEditModal(null);
                    fetchJadwal();
                  } catch (error: any) {
                    // Error sudah ditangani oleh interceptor
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all font-semibold"
              >
                💾 Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
