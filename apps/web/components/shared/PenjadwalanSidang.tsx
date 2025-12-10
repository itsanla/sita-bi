'use client';

import { Calendar, Clock, Zap, Users, CheckCircle, XCircle, Search, FileDown, FileSpreadsheet, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface JadwalSidang {
  id?: number;
  tanggal_generate: string | null;
  status: 'belum_dijadwalkan' | 'dijadwalkan' | 'selesai';
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

  const fetchJadwal = async () => {
    console.log('[FRONTEND] 🔄 Fetching jadwal dan mahasiswa siap...');
    try {
      const [jadwalRes, mahasiswaRes, jadwalTersimpanRes, optionsRes] = await Promise.all([
        api.get('/penjadwalan-sidang/pengaturan'),
        api.get('/jadwal-sidang-smart/mahasiswa-siap'),
        api.get('/jadwal-sidang-smart/jadwal'),
        api.get('/jadwal-sidang-smart/options'),
      ]);
      
      console.log('[FRONTEND] ✅ Jadwal response:', jadwalRes.data);
      console.log('[FRONTEND] ✅ Mahasiswa siap response:', mahasiswaRes.data);
      console.log('[FRONTEND] ✅ Jadwal tersimpan response:', jadwalTersimpanRes.data);
      
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
    if (!jadwal?.tanggal_generate || jadwal.status === 'selesai') return;

    const targetTime = new Date(jadwal.tanggal_generate).getTime();
    const now = Date.now();
    const timeUntilGenerate = targetTime - now;

    if (timeUntilGenerate <= 0) return;
    if (timeUntilGenerate > 3600000) return;

    const timeoutId = setTimeout(() => {
      fetchJadwal();
    }, timeUntilGenerate);

    return () => clearTimeout(timeoutId);
  }, [jadwal]);

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
    
    if (!confirm(`Yakin ingin menjadwalkan ${mahasiswaSiap.length} mahasiswa sekarang?`)) {
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
      
      toast.success(`Berhasil menjadwalkan ${response.data.data.length} mahasiswa`);
      await fetchJadwal();
      
      // Scroll ke jadwal tersimpan
      setTimeout(() => {
        document.getElementById('jadwal-tersimpan')?.scrollIntoView({ behavior: 'smooth' });
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
    if (!confirm('⚠️ PERINGATAN: Yakin ingin menghapus SEMUA jadwal sidang yang sudah dibuat? Tindakan ini tidak dapat dibatalkan!')) {
      return;
    }

    setLoadingJadwal(true);
    try {
      const response = await api.delete('/jadwal-sidang-smart/jadwal');
      toast.success(response.data.message);
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
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jadwal-sidang-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF berhasil diunduh');
    } catch (error: any) {
      toast.error('Gagal mengunduh PDF');
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
  const paginatedJadwal = filteredJadwal.slice(startIndex, startIndex + itemsPerPage);

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

      {jadwal?.status === 'selesai' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✓ Jadwal sidang sudah di-generate pada{' '}
            {new Date(jadwal.tanggal_generate!).toLocaleString('id-ID')}
          </p>
        </div>
      )}

      {jadwal?.status === 'dijadwalkan' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Jadwal Generate Terjadwal
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Sidang akan di-generate otomatis pada:{' '}
                <span className="font-semibold">
                  {new Date(jadwal.tanggal_generate!).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {jadwal?.status === 'dijadwalkan'
            ? 'Ubah Jadwal Generate'
            : 'Atur Jadwal Generate'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Generate
              </label>
              <input
                type="date"
                value={tanggalGenerate}
                onChange={(e) => setTanggalGenerate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                disabled={processing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jam Generate
              </label>
              <input
                type="time"
                value={jamGenerate}
                onChange={(e) => setJamGenerate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                disabled={processing}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAturJadwal}
              disabled={processing || !tanggalGenerate || !jamGenerate}
              className="flex-1 px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
            {jadwal?.status === 'dijadwalkan' && (
              <button
                onClick={handleBatalkan}
                disabled={processing}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Batalkan
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Mahasiswa Siap Sidang
              </h2>
              <p className="text-sm text-gray-600">
                {mahasiswaSiap.length} mahasiswa menunggu penjadwalan
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateSekarang}
            disabled={generating || mahasiswaSiap.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Zap className="w-5 h-5" />
            <span>{generating ? 'Menjadwalkan...' : 'Jadwalkan Sekarang'}</span>
          </button>
        </div>

        {mahasiswaSiap.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {mahasiswaSiap.map((mhs: any, idx: number) => (
              <div
                key={`mhs-${mhs.tugasAkhir?.mahasiswa?.nim || idx}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {mhs.tugasAkhir?.mahasiswa?.user?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mhs.tugasAkhir?.mahasiswa?.nim || 'N/A'} • {mhs.tugasAkhir?.judul || 'N/A'}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded">
                  Menunggu
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {errorInfo && (
        <div className="bg-white rounded-xl shadow-md border-2 border-red-500 p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                {errorInfo.status === 'KAPASITAS_DOSEN_TIDAK_CUKUP' ? '🚨 Kapasitas Dosen Tidak Cukup' : '⚠️ Gagal Menjadwalkan'}
              </h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-red-900 mb-2">📊 Masalah:</p>
                <p className="text-sm text-red-800">{errorInfo.masalah}</p>
              </div>

              {errorInfo.perhitungan && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4 font-mono text-xs">
                  <pre className="whitespace-pre-wrap text-gray-800">{errorInfo.perhitungan}</pre>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">💡 Saran:</p>
                <p className="text-sm text-blue-800">{errorInfo.saran}</p>
              </div>

              {errorInfo.detail && (
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <summary className="text-xs font-semibold text-gray-700 cursor-pointer">Detail Teknis (klik untuk expand)</summary>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                    {Object.entries(errorInfo.detail).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    ))}
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
        <div id="jadwal-tersimpan" className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Jadwal Sidang Tersimpan ({filteredJadwal.length} dari {jadwalTersimpan.length})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => setShowMoveModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Pindahkan Jadwal</span>
              </button>
              <button
                onClick={handleHapusJadwal}
                disabled={loadingJadwal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>{loadingJadwal ? 'Menghapus...' : 'Hapus Semua'}</span>
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Mahasiswa</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Ketua</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Anggota I</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Anggota II</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Hari/Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Pukul</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Ruangan</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedJadwal.map((item: any) => {
                  const mhs = item.sidang.tugasAkhir.mahasiswa;
                  const peran = item.sidang.tugasAkhir.peranDosenTa;
                  const ketua = peran.find((p: any) => p.peran === 'penguji1');
                  const sekretaris = peran.find((p: any) => p.peran === 'pembimbing1');
                  const anggota1 = peran.find((p: any) => p.peran === 'penguji2');
                  const anggota2 = peran.find((p: any) => p.peran === 'penguji3');
                  
                  const tanggal = new Date(item.tanggal);
                  const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                  const hari = hariMap[tanggal.getDay()];
                  const tanggalStr = tanggal.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  });
                  
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{mhs.user.name}</td>
                      <td className="px-4 py-3 text-gray-900">{ketua?.dosen.user.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{anggota1?.dosen.user.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{anggota2?.dosen.user.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{hari}, {tanggalStr}</td>
                      <td className="px-4 py-3 text-gray-600">{item.waktu_mulai} - {item.waktu_selesai}</td>
                      <td className="px-4 py-3 text-gray-600">{item.ruangan.nama_ruangan}</td>
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
                              setSearchAnggota1(anggota1?.dosen.user.name || '');
                              setSearchAnggota2(anggota2?.dosen.user.name || '');
                              setSearchRuangan(item.ruangan.nama_ruangan || '');
                              setShowDropdownKetua(false);
                              setShowDropdownAnggota1(false);
                              setShowDropdownAnggota2(false);
                              setShowDropdownRuangan(false);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Yakin ingin menghapus jadwal ini?')) {
                                try {
                                  await api.delete(`/jadwal-sidang-smart/jadwal/${item.id}`);
                                  toast.success('Jadwal berhasil dihapus');
                                  fetchJadwal();
                                } catch (error: any) {
                                  toast.error('Gagal menghapus jadwal');
                                }
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
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
                Halaman {currentPage} dari {totalPages} ({filteredJadwal.length} data)
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <div key={page} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          currentPage === page
                            ? 'bg-red-900 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

      {showMoveModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 -mt-16 lg:-mt-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', marginTop: '-64px' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Pindahkan Jadwal Massal</h3>
              <button onClick={() => setShowMoveModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Info:</span> Semua jadwal yang dimulai dari tanggal yang dipilih akan dipindahkan ke tanggal baru dengan mempertahankan urutan hari.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pindahkan Dari Tanggal</label>
                <input
                  type="date"
                  value={moveDateFrom}
                  onChange={(e) => setMoveDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pindahkan Ke Tanggal</label>
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
                    toast.error('Tanggal tujuan harus lebih besar dari tanggal asal');
                    return;
                  }
                  
                  if (!confirm(`Yakin ingin memindahkan semua jadwal dari ${dateFrom.toLocaleDateString('id-ID')} ke ${dateTo.toLocaleDateString('id-ID')}?`)) {
                    return;
                  }
                  
                  setMovingJadwal(true);
                  try {
                    const response = await api.post('/jadwal-sidang-smart/move-schedule', {
                      from_date: moveDateFrom,
                      to_date: moveDateTo,
                    });
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

      {editModal && editOptions && (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 -mt-16 lg:-mt-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', marginTop: '-64px' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit Jadwal Sidang</h3>
              <button onClick={() => setEditModal(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tanggal</label>
                <input type="date" value={editForm.tanggal} onChange={(e) => setEditForm({...editForm, tanggal: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Waktu Mulai</label>
                  <input type="time" value={editForm.waktu_mulai} onChange={(e) => setEditForm({...editForm, waktu_mulai: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Waktu Selesai</label>
                  <input type="time" value={editForm.waktu_selesai} onChange={(e) => setEditForm({...editForm, waktu_selesai: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Ketua Penguji</label>
                <input
                  type="text"
                  placeholder="Ketik nama ketua penguji..."
                  value={searchKetua}
                  onChange={(e) => {
                    setSearchKetua(e.target.value);
                    const exactMatch = editOptions.dosen.find((d: any) => d.name.toLowerCase() === e.target.value.toLowerCase());
                    setEditForm({...editForm, penguji1_id: exactMatch?.id});
                    setShowDropdownKetua(true);
                  }}
                  onFocus={() => setShowDropdownKetua(true)}
                  onBlur={() => setTimeout(() => setShowDropdownKetua(false), 200)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {searchKetua && !editForm.penguji1_id && (
                  <p className="text-xs text-red-500 mt-1">Tidak ada dosen bernama "{searchKetua}"</p>
                )}
                {showDropdownKetua && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {editOptions.dosen.filter((d: any) => !searchKetua || d.name.toLowerCase().includes(searchKetua.toLowerCase())).map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setEditForm({...editForm, penguji1_id: d.id});
                          setSearchKetua(d.name);
                          setShowDropdownKetua(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        {d.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Anggota Penguji I</label>
                <input
                  type="text"
                  placeholder="Ketik nama anggota penguji I..."
                  value={searchAnggota1}
                  onChange={(e) => {
                    setSearchAnggota1(e.target.value);
                    const exactMatch = editOptions.dosen.find((d: any) => d.name.toLowerCase() === e.target.value.toLowerCase());
                    setEditForm({...editForm, penguji2_id: exactMatch?.id});
                    setShowDropdownAnggota1(true);
                  }}
                  onFocus={() => setShowDropdownAnggota1(true)}
                  onBlur={() => setTimeout(() => setShowDropdownAnggota1(false), 200)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {searchAnggota1 && !editForm.penguji2_id && (
                  <p className="text-xs text-red-500 mt-1">Tidak ada dosen bernama "{searchAnggota1}"</p>
                )}
                {showDropdownAnggota1 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {editOptions.dosen.filter((d: any) => !searchAnggota1 || d.name.toLowerCase().includes(searchAnggota1.toLowerCase())).map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setEditForm({...editForm, penguji2_id: d.id});
                          setSearchAnggota1(d.name);
                          setShowDropdownAnggota1(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        {d.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Anggota Penguji II</label>
                <input
                  type="text"
                  placeholder="Ketik nama anggota penguji II..."
                  value={searchAnggota2}
                  onChange={(e) => {
                    setSearchAnggota2(e.target.value);
                    const exactMatch = editOptions.dosen.find((d: any) => d.name.toLowerCase() === e.target.value.toLowerCase());
                    setEditForm({...editForm, penguji3_id: exactMatch?.id});
                    setShowDropdownAnggota2(true);
                  }}
                  onFocus={() => setShowDropdownAnggota2(true)}
                  onBlur={() => setTimeout(() => setShowDropdownAnggota2(false), 200)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {searchAnggota2 && !editForm.penguji3_id && (
                  <p className="text-xs text-red-500 mt-1">Tidak ada dosen bernama "{searchAnggota2}"</p>
                )}
                {showDropdownAnggota2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {editOptions.dosen.filter((d: any) => !searchAnggota2 || d.name.toLowerCase().includes(searchAnggota2.toLowerCase())).map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setEditForm({...editForm, penguji3_id: d.id});
                          setSearchAnggota2(d.name);
                          setShowDropdownAnggota2(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        {d.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Ruangan</label>
                <input
                  type="text"
                  placeholder="Ketik nama ruangan..."
                  value={searchRuangan}
                  onChange={(e) => {
                    setSearchRuangan(e.target.value);
                    const exactMatch = editOptions.ruangan.find((r: any) => r.name.toLowerCase() === e.target.value.toLowerCase());
                    setEditForm({...editForm, ruangan_id: exactMatch?.id});
                    setShowDropdownRuangan(true);
                  }}
                  onFocus={() => setShowDropdownRuangan(true)}
                  onBlur={() => setTimeout(() => setShowDropdownRuangan(false), 200)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {searchRuangan && !editForm.ruangan_id && (
                  <p className="text-xs text-red-500 mt-1">Tidak ada ruangan "{searchRuangan}"</p>
                )}
                {showDropdownRuangan && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {editOptions.ruangan.filter((r: any) => !searchRuangan || r.name.toLowerCase().includes(searchRuangan.toLowerCase())).map((r: any) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setEditForm({...editForm, ruangan_id: r.id});
                          setSearchRuangan(r.name);
                          setShowDropdownRuangan(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        {r.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-end space-x-3 border-t">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Batal</button>
              <button onClick={async () => {
                if (editForm.waktu_mulai && editForm.waktu_selesai) {
                  const [hMulai, mMulai] = editForm.waktu_mulai.split(':').map(Number);
                  const [hSelesai, mSelesai] = editForm.waktu_selesai.split(':').map(Number);
                  const menitMulai = hMulai * 60 + mMulai;
                  const menitSelesai = hSelesai * 60 + mSelesai;
                  
                  if (menitMulai >= menitSelesai) {
                    toast.error('Waktu mulai harus lebih awal dari waktu selesai');
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
                  const response = await api.patch(`/jadwal-sidang-smart/jadwal/${editModal.id}`, editForm);
                  toast.success('Jadwal berhasil diupdate');
                  setEditModal(null);
                  fetchJadwal();
                } catch (error: any) {
                  // Error sudah ditangani oleh interceptor
                }
              }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
