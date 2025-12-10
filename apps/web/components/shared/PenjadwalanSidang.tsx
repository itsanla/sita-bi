'use client';

import { Calendar, Clock, Zap, Users, CheckCircle, XCircle, Search, FileDown, FileSpreadsheet } from 'lucide-react';
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

  const fetchJadwal = async () => {
    console.log('[FRONTEND] 🔄 Fetching jadwal dan mahasiswa siap...');
    try {
      const [jadwalRes, mahasiswaRes, jadwalTersimpanRes] = await Promise.all([
        api.get('/penjadwalan-sidang/pengaturan'),
        api.get('/jadwal-sidang-smart/mahasiswa-siap'),
        api.get('/jadwal-sidang-smart/jadwal'),
      ]);
      
      console.log('[FRONTEND] ✅ Jadwal response:', jadwalRes.data);
      console.log('[FRONTEND] ✅ Mahasiswa siap response:', mahasiswaRes.data);
      console.log('[FRONTEND] ✅ Jadwal tersimpan response:', jadwalTersimpanRes.data);
      
      setJadwal(jadwalRes.data.data);
      setMahasiswaSiap(mahasiswaRes.data.data || []);
      setJadwalTersimpan(jadwalTersimpanRes.data.data || []);
      
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
      console.error('[FRONTEND] ❌ Error generate:', error);
      console.error('[FRONTEND] ❌ Error response:', error.response?.data);
      console.error('[FRONTEND] ❌ Error message:', error.response?.data?.message);
      
      // Parse smart error message
      try {
        const errorData = JSON.parse(error.response?.data?.message);
        setErrorInfo(errorData);
      } catch {
        toast.error(error.response?.data?.message || 'Gagal generate jadwal');
      }
    } finally {
      setGenerating(false);
      console.log('[FRONTEND] 🏁 Generate finished');
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">NIM</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Ketua</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Sekretaris</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Anggota I</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Anggota II</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Hari/Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Pukul</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Ruangan</th>
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
                      <td className="px-4 py-3 text-gray-600">{mhs.nim}</td>
                      <td className="px-4 py-3 text-gray-900">{ketua?.dosen.user.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{sekretaris?.dosen.user.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{anggota1?.dosen.user.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{anggota2?.dosen.user.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{hari}, {tanggalStr}</td>
                      <td className="px-4 py-3 text-gray-600">{item.waktu_mulai} - {item.waktu_selesai}</td>
                      <td className="px-4 py-3 text-gray-600">{item.ruangan.nama_ruangan}</td>
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
    </div>
  );
}
