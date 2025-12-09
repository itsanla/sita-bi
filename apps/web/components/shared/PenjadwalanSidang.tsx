'use client';

import { Calendar, Clock } from 'lucide-react';
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

  const fetchJadwal = async () => {
    try {
      const response = await api.get('/penjadwalan-sidang/pengaturan');
      setJadwal(response.data.data);
      if (response.data.data?.tanggal_generate) {
        const date = new Date(response.data.data.tanggal_generate);
        setTanggalGenerate(date.toISOString().split('T')[0]);
        setJamGenerate(date.toTimeString().slice(0, 5));
      }
    } catch (error: any) {
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
    if (!tanggalGenerate || !jamGenerate) {
      toast.error('Tanggal dan jam harus diisi');
      return;
    }

    const datetime = `${tanggalGenerate}T${jamGenerate}:00`;
    const targetDate = new Date(datetime);

    if (targetDate <= new Date()) {
      toast.error('Tanggal dan jam harus di masa depan');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/penjadwalan-sidang/pengaturan', {
        tanggal_generate: datetime,
      });
      toast.success('Jadwal generate sidang berhasil diatur');
      await fetchJadwal();
    } catch (error: any) {
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Catatan:</span> Sistem akan otomatis
          men-generate jadwal sidang untuk semua mahasiswa yang siap sidang pada
          tanggal dan jam yang ditentukan.
        </p>
      </div>
    </div>
  );
}
