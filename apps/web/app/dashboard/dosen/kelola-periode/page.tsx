'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { Calendar, Lock, Play, StopCircle, CheckCircle, XCircle } from 'lucide-react';
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
  const ERROR_MESSAGE_DEFAULT = 'Gagal memproses periode';
  const PERIODE_UPDATED_EVENT = 'periode-updated';

  const { isJurusan, role } = useRBAC();
  const [loading, setLoading] = useState(true);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [tahunBaru, setTahunBaru] = useState(new Date().getFullYear() + 1);
  const [processing, setProcessing] = useState(false);
  const [tanggalBuka, setTanggalBuka] = useState('');
  const [jamBuka, setJamBuka] = useState('08:00');

  useEffect(() => {
    if (isJurusan) {
      void fetchPeriodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleBukaPeriode = async (langsung: boolean) => {
    if (!tahunBaru || tahunBaru < 2000 || tahunBaru > 2100) {
      toast.error('Tahun tidak valid');
      return;
    }

    const msg = langsung
      ? `Buka Periode TA ${tahunBaru} sekarang?`
      : `Simpan jadwal pembukaan Periode TA ${tahunBaru}?`;
    if (!confirm(msg)) return;

    setProcessing(true);
    try {
      let tanggalBukaISO;
      if (!langsung && tanggalBuka) {
        const datetime = `${tanggalBuka}T${jamBuka || '08:00'}:00+07:00`;
        const tanggalBukaDate = new Date(datetime);
        if (tanggalBukaDate < new Date()) {
          toast.error('Tanggal pembukaan tidak boleh di masa lalu');
          setProcessing(false);
          return;
        }
        tanggalBukaISO = tanggalBukaDate.toISOString();
      }

      await api.post('/periode/buka', {
        tahun: tahunBaru,
        tanggal_buka: langsung ? undefined : tanggalBukaISO,
      });
      toast.success(
        langsung
          ? `Periode TA ${tahunBaru} berhasil dibuka`
          : 'Jadwal pembukaan berhasil disimpan',
      );
      setTanggalBuka('');
      setJamBuka('08:00');
      void fetchPeriodes();
      window.dispatchEvent(new Event(PERIODE_UPDATED_EVENT));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || ERROR_MESSAGE_DEFAULT);
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
      void fetchPeriodes();
      window.dispatchEvent(new Event(PERIODE_UPDATED_EVENT));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || ERROR_MESSAGE_DEFAULT);
    } finally {
      setProcessing(false);
    }
  };

  const handleHapusPeriode = async (id: number, tahun: number) => {
    if (!confirm(`Hapus Periode TA ${tahun}? Tindakan ini tidak dapat dibatalkan.`)) return;

    setProcessing(true);
    try {
      await api.delete(`/periode/${id}`);
      toast.success(`Periode TA ${tahun} berhasil dihapus`);
      void fetchPeriodes();
      window.dispatchEvent(new Event(PERIODE_UPDATED_EVENT));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || ERROR_MESSAGE_DEFAULT);
    } finally {
      setProcessing(false);
    }
  };

  const handleBukaSekarang = async (id: number, tahun: number) => {
    if (!confirm(`Buka Periode TA ${tahun} sekarang?`)) return;

    setProcessing(true);
    try {
      await api.post(`/periode/${id}/buka-sekarang`);
      toast.success(`Periode TA ${tahun} berhasil dibuka`);
      void fetchPeriodes();
      window.dispatchEvent(new Event(PERIODE_UPDATED_EVENT));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || ERROR_MESSAGE_DEFAULT);
    } finally {
      setProcessing(false);
    }
  };

  const handleBatalkanJadwal = async (id: number, tahun: number) => {
    if (!confirm(`Batalkan jadwal pembukaan Periode TA ${tahun}?`)) return;

    setProcessing(true);
    try {
      await api.delete(`/periode/${id}/batalkan-jadwal`);
      toast.success('Jadwal pembukaan dibatalkan');
      void fetchPeriodes();
      window.dispatchEvent(new Event(PERIODE_UPDATED_EVENT));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || ERROR_MESSAGE_DEFAULT);
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun Akademik
                </label>
                <input
                  type="number"
                  value={tahunBaru}
                  onChange={(e) => setTahunBaru(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                />
              </div>
              <div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jam Pembukaan (Opsional)
                </label>
                <input
                  type="time"
                  value={jamBuka}
                  onChange={(e) => setJamBuka(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void handleBukaPeriode(true)}
                disabled={processing}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>{processing ? 'Proses...' : `Buka Periode ${tahunBaru} Sekarang`}</span>
              </button>
              {tanggalBuka && (
                <button
                  onClick={() => void handleBukaPeriode(false)}
                  disabled={processing}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{processing ? 'Proses...' : 'Simpan Jadwal Pembukaan'}</span>
                </button>
              )}
            </div>
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
              if (periode.status === 'AKTIF') return 'border-green-500 bg-green-50';
              if (periode.status === 'SELESAI') return 'border-gray-300 bg-gray-50';
              if (periode.status === 'PERSIAPAN') return 'border-yellow-500 bg-yellow-50';
              return 'border-gray-300 bg-gray-50';
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
                          {new Date(periode.tanggal_buka).toLocaleString(
                            'id-ID',
                            { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }
                          )}
                        </p>
                      )}
                      {periode.tanggal_tutup !== null && (
                        <p className="text-xs text-gray-500">
                          Ditutup:{' '}
                          {new Date(periode.tanggal_tutup).toLocaleString(
                            'id-ID',
                            { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {periode.status === 'AKTIF' && (
                      <button
                        onClick={() => void handleTutupPeriode(periode.id, periode.tahun)}
                        disabled={processing}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <StopCircle className="w-4 h-4" />
                        <span>Tutup</span>
                      </button>
                    )}
                    {periode.status === 'PERSIAPAN' && (
                      <>
                        <button
                          onClick={() => void handleBukaSekarang(periode.id, periode.tahun)}
                          disabled={processing}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Play className="w-4 h-4" />
                          <span>Buka Sekarang</span>
                        </button>
                        <button
                          onClick={() => void handleBatalkanJadwal(periode.id, periode.tahun)}
                          disabled={processing}
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Batalkan</span>
                        </button>
                      </>
                    )}
                    {periode.status === 'SELESAI' && (
                      <button
                        onClick={() => void handleHapusPeriode(periode.id, periode.tahun)}
                        disabled={processing}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
