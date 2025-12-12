'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useTugasAkhir } from '@/hooks/useTugasAkhir';
import PeriodeGuard from '@/components/shared/PeriodeGuard';
import TAGuard from '@/components/shared/TAGuard';
import JadwalSidangGuard from '@/components/shared/JadwalSidangGuard';
import { Calendar, Clock, MapPin, Users, FileDown } from 'lucide-react';
import { toast } from 'sonner';

export default function JadwalSidangMahasiswaPage() {
  const { tugasAkhir } = useTugasAkhir();
  const [loading, setLoading] = useState(true);
  const [jadwal, setJadwal] = useState<any>(null);

  useEffect(() => {
    if (tugasAkhir?.mahasiswa_id) {
      fetchJadwal();
    }
  }, [tugasAkhir]);

  const fetchJadwal = async () => {
    try {
      const response = await api.get('/jadwal-sidang-smart/jadwal');
      const allJadwal = response.data.data || [];
      
      const myJadwal = allJadwal.find(
        (j: any) => j.sidang.tugasAkhir.mahasiswa_id === tugasAkhir?.mahasiswa_id,
      );
      
      setJadwal(myJadwal || null);
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
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
    } catch {
      toast.error('Gagal membuka PDF');
    }
  };

  if (loading) {
    return (
      <PeriodeGuard>
        <TAGuard>
          <JadwalSidangGuard>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-sm font-medium text-gray-600">Memuat jadwal...</p>
              </div>
            </div>
          </JadwalSidangGuard>
        </TAGuard>
      </PeriodeGuard>
    );
  }

  return (
    <PeriodeGuard>
      <TAGuard>
        <JadwalSidangGuard hasJadwal={!!jadwal}>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Jadwal Sidang Saya
              </h1>
              <p className="text-sm text-gray-600">
                Lihat jadwal sidang tugas akhir Anda
              </p>
            </div>

            {!jadwal && !loading ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum Ada Jadwal Sidang
                </h2>
                <p className="text-sm text-gray-600">
                  Jadwal sidang Anda belum tersedia. Silakan hubungi admin atau ketua jurusan.
                </p>
              </div>
            ) : jadwal ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4">
                  <h2 className="text-lg font-bold text-white">Detail Jadwal Sidang</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Judul Tugas Akhir</h3>
                    <p className="text-gray-900">{jadwal.sidang.tugasAkhir.judul}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Tanggal</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(jadwal.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Waktu</p>
                        <p className="text-sm font-medium text-gray-900">
                          {jadwal.waktu_mulai} - {jadwal.waktu_selesai} WIB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Ruangan</p>
                        <p className="text-sm font-medium text-gray-900">
                          {jadwal.ruangan.nama_ruangan}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-5 h-5 text-gray-600" />
                      <h3 className="text-sm font-semibold text-gray-700">Tim Penguji</h3>
                    </div>
                    <div className="space-y-2">
                      {jadwal.sidang.tugasAkhir.peranDosenTa
                        .filter((p) => p.peran.startsWith('penguji'))
                        .map((peran, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">
                              {peran.dosen.user.name}
                            </span>
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                              {peran.peran === 'penguji1'
                                ? 'Ketua'
                                : peran.peran === 'penguji2'
                                  ? 'Anggota I'
                                  : 'Anggota II'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Catatan:</span> Harap hadir 15 menit sebelum waktu sidang dimulai.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleExportPDF}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all flex items-center justify-center space-x-2 font-medium"
                    >
                      <FileDown className="w-5 h-5" />
                      <span>Unduh Jadwal (PDF)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </JadwalSidangGuard>
      </TAGuard>
    </PeriodeGuard>
  );
}
