'use client';

import { Calendar, Clock, Zap, Users, CheckCircle, XCircle } from 'lucide-react';
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

  const fetchJadwal = async () => {
    console.log('[FRONTEND] 🔄 Fetching jadwal dan mahasiswa siap...');
    try {
      const [jadwalRes, mahasiswaRes] = await Promise.all([
        api.get('/penjadwalan-sidang/pengaturan'),
        api.get('/jadwal-sidang-smart/mahasiswa-siap'),
      ]);
      
      console.log('[FRONTEND] ✅ Jadwal response:', jadwalRes.data);
      console.log('[FRONTEND] ✅ Mahasiswa siap response:', mahasiswaRes.data);
      console.log('[FRONTEND] 📊 Jumlah mahasiswa siap:', mahasiswaRes.data.data?.length || 0);
      
      setJadwal(jadwalRes.data.data);
      setMahasiswaSiap(mahasiswaRes.data.data || []);
      
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

  const handleGenerateSekarang = async () => {
    console.log('[FRONTEND] 🚀 Generate sekarang clicked');
    console.log('[FRONTEND] 👥 Jumlah mahasiswa siap:', mahasiswaSiap.length);
    
    if (!confirm(`Yakin ingin menjadwalkan ${mahasiswaSiap.length} mahasiswa sekarang?`)) {
      console.log('[FRONTEND] ❌ User cancelled');
      return;
    }

    setGenerating(true);
    console.log('[FRONTEND] 📤 Sending generate request...');
    
    try {
      const response = await api.post('/jadwal-sidang-smart/generate');
      console.log('[FRONTEND] ✅ Generate response:', response.data);
      console.log('[FRONTEND] 📊 Jadwal result:', response.data.data);
      
      setJadwalResult(response.data.data);
      toast.success(`Berhasil menjadwalkan ${response.data.data.length} mahasiswa`);
      await fetchJadwal();
    } catch (error: any) {
      console.error('[FRONTEND] ❌ Error generate:', error);
      console.error('[FRONTEND] ❌ Error response:', error.response?.data);
      console.error('[FRONTEND] ❌ Error message:', error.response?.data?.message);
      toast.error(error.response?.data?.message || 'Gagal generate jadwal');
      setJadwalResult([]);
    } finally {
      setGenerating(false);
      console.log('[FRONTEND] 🏁 Generate finished');
    }
  };

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
    <div className="max-w-4xl mx-auto space-y-6">
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
            {mahasiswaSiap.map((mhs: any) => (
              <div
                key={mhs.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {mhs.tugasAkhir.mahasiswa.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mhs.tugasAkhir.mahasiswa.nim} • {mhs.tugasAkhir.judul}
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

      {jadwalResult.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Jadwal Sidang ({jadwalResult.length} Mahasiswa)
          </h2>
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
                </tr>
              </thead>
              <tbody>
                {jadwalResult.map((jadwal: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{jadwal.mahasiswa}</td>
                    <td className="px-4 py-3 text-gray-600">{jadwal.nim}</td>
                    <td className="px-4 py-3 text-gray-900">{jadwal.ketua}</td>
                    <td className="px-4 py-3 text-gray-900">{jadwal.sekretaris}</td>
                    <td className="px-4 py-3 text-gray-900">{jadwal.anggota1}</td>
                    <td className="px-4 py-3 text-gray-900">{jadwal.anggota2}</td>
                    <td className="px-4 py-3 text-gray-600">{jadwal.hari_tanggal}</td>
                    <td className="px-4 py-3 text-gray-600">{jadwal.pukul}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
