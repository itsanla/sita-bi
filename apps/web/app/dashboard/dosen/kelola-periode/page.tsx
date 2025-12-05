'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { Calendar, Lock, Play, StopCircle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Periode {
  id: number;
  tahun: number;
  nama: string;
  status: string;
  tanggal_buka: string | null;
  tanggal_tutup: string | null;
}

export default function KelolaPeriodePage() {
  const { isJurusan, role } = useRBAC();
  const [loading, setLoading] = useState(true);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [tahunBaru, setTahunBaru] = useState(new Date().getFullYear() + 1);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isJurusan) {
      fetchPeriodes();
    }
  }, [isJurusan]);

  const fetchPeriodes = async () => {
    try {
      const response = await api.get<Periode[]>('/periode');
      setPeriodes(response.data.data);
    } catch {
      toast.error('Gagal memuat data periode');
    } finally {
      setLoading(false);
    }
  };

  const [tanggalBuka, setTanggalBuka] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleBukaPeriode = async () => {
    if (!confirm(`Buka Periode TA ${tahunBaru}?`)) return;

    setProcessing(true);
    try {
      await api.post('/periode/buka', {
        tahun: tahunBaru,
        tanggal_buka: tanggalBuka || undefined,
      });
      toast.success(`Periode TA ${tahunBaru} berhasil dibuka`);
      setTanggalBuka('');
      setShowDatePicker(false);
      fetchPeriodes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal membuka periode');
    } finally {
      setProcessing(false);
    }
  };

  const handleTutupPeriode = async (id: number, tahun: number) => {
    const catatan = prompt('Catatan penutupan (opsional):');
    if (catatan === null) return;

    setProcessing(true);
    try {
      await api.post(`/periode/${id}/tutup`, { catatan });
      toast.success(`Periode TA ${tahun} berhasil ditutup`);
      fetchPeriodes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menutup periode');
    } finally {
      setProcessing(false);
    }
  };

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-600">
            Memuat data pengguna...
          </p>
        </div>
      </div>
    );
  }

  if (!isJurusan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-900" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Fitur ini hanya dapat diakses oleh Ketua Jurusan
          </p>
          <a
            href="/dashboard/dosen"
            className="inline-block px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-600">Memuat periode...</p>
        </div>
      </div>
    );
  }

  const activePeriode = periodes.find((p) => p.status === 'AKTIF');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-red-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Kelola Periode Tugas Akhir
            </h1>
            <p className="text-sm text-gray-600">
              Buka dan tutup periode TA per tahun akademik
            </p>
          </div>
        </div>
      </div>

      {activePeriode === undefined && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Buka Periode Baru
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun Akademik
                </label>
                <input
                  type="number"
                  value={tahunBaru}
                  onChange={(e) => setTahunBaru(parseInt(e.target.value))}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Pembukaan (Opsional)
                </label>
                <input
                  type="date"
                  value={tanggalBuka}
                  onChange={(e) => setTanggalBuka(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Kosongkan tanggal untuk membuka periode sekarang juga
            </p>
            <button
              onClick={handleBukaPeriode}
              disabled={processing}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>
                {processing ? 'Membuka...' : `Buka Periode TA ${tahunBaru}`}
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daftar Periode
        </h2>
        <div className="space-y-3">
          {periodes.map((periode) => {
            const getStatusClass = () => {
              if (periode.status === 'AKTIF')
                return 'border-green-500 bg-green-50';
              if (periode.status === 'SELESAI')
                return 'border-gray-300 bg-gray-50';
              return 'border-yellow-500 bg-yellow-50';
            };

            return (
              <div
                key={periode.id}
                className={`p-4 rounded-lg border-2 ${getStatusClass()}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {periode.status === 'AKTIF' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <StopCircle className="w-6 h-6 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {periode.nama}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Status:{' '}
                        <span
                          className={`font-semibold ${
                            periode.status === 'AKTIF'
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {periode.status}
                        </span>
                      </p>
                      {periode.tanggal_buka !== null && (
                        <p className="text-xs text-gray-500">
                          Dibuka:{' '}
                          {new Date(periode.tanggal_buka).toLocaleDateString(
                            'id-ID',
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {periode.status === 'AKTIF' && (
                    <button
                      onClick={() =>
                        handleTutupPeriode(periode.id, periode.tahun)
                      }
                      disabled={processing}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>Tutup Periode</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
