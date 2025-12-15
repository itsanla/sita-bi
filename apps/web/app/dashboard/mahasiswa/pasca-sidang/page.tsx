'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRBAC } from '@/hooks/useRBAC';
import {
  Lock,
  Calendar,
  Clock,
  Home,
  CheckCircle,
  XCircle,
  Award,
} from 'lucide-react';

interface NilaiSidang {
  aspek: string;
  skor: number;
  dosen: {
    user: {
      name: string;
    };
  };
}

interface Sidang {
  id: number;
  status_hasil: string | null;
  selesai_sidang: boolean;
  nilai_akhir?: number;
  tugasAkhir: {
    judul: string;
    status: string;
    peranDosenTa: Array<{
      peran: string;
      dosen: {
        user: {
          name: string;
        };
      };
    }>;
  };
  jadwalSidang: Array<{
    tanggal: string;
    waktu_mulai: string;
    ruangan: {
      nama_ruangan: string;
    };
  }>;
  nilaiSidang?: NilaiSidang[];
}

interface PengaturanPenilaian {
  rumus?: string;
  nilai_minimal_lolos?: number;
  keterangan: string;
}

export default function PascaSidangPage() {
  const { isMahasiswa } = useRBAC();
  const [loading, setLoading] = useState(true);
  const [sidang, setSidang] = useState<Sidang | null>(null);
  const [pengaturanPenilaian, setPengaturanPenilaian] =
    useState<PengaturanPenilaian | null>(null);

  useEffect(() => {
    if (isMahasiswa) {
      fetchHasilSidang();
    } else {
      setLoading(false);
    }
  }, [isMahasiswa]);

  const fetchHasilSidang = async () => {
    try {
      const response = await api.get('/penilaian-sidang/hasil-mahasiswa');
      setSidang(response.data.data || null);
      setPengaturanPenilaian(response.data.pengaturan_penilaian || null);
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  if (!isMahasiswa) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-900" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-sm text-gray-600">
            Halaman ini hanya dapat diakses oleh Mahasiswa
          </p>
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
          <p className="text-sm font-medium text-gray-600">
            Memuat data hasil sidang...
          </p>
        </div>
      </div>
    );
  }

  if (!sidang) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Hasil Sidang</h1>
          <p className="text-sm text-gray-600 mt-1">
            Informasi hasil nilai sidang dan status kelulusan Anda
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Belum Ada Hasil Sidang
          </h2>
          <p className="text-sm text-gray-600">
            Anda belum memiliki hasil sidang yang tersedia.
            <br />
            Hasil sidang akan ditampilkan setelah dosen menginput nilai sidang
            Anda.
          </p>
        </div>
      </div>
    );
  }

  const jadwal = sidang.jadwalSidang[0];
  const statusLulus = sidang.status_hasil === 'lulus';
  const penguji1 = sidang.tugasAkhir.peranDosenTa.find(
    (p) => p.peran === 'penguji1',
  );
  const penguji2 = sidang.tugasAkhir.peranDosenTa.find(
    (p) => p.peran === 'penguji2',
  );
  const penguji3 = sidang.tugasAkhir.peranDosenTa.find(
    (p) => p.peran === 'penguji3',
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Hasil Sidang
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Informasi hasil nilai sidang dan status kelulusan Anda
        </p>
      </div>

      <div
        className={`bg-white rounded-xl shadow-lg border-2 p-4 sm:p-6 ${
          statusLulus
            ? 'border-green-300 bg-gradient-to-br from-green-50 to-white'
            : 'border-red-300 bg-gradient-to-br from-red-50 to-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {sidang.tugasAkhir.judul}
            </h2>
            {!!jadwal && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  {new Date(jadwal.tanggal).toLocaleDateString('id-ID')}
                </span>
                <span className="flex items-center gap-1 sm:gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {jadwal.waktu_mulai}
                </span>
                <span className="flex items-center gap-1 sm:gap-2">
                  <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                  {jadwal.ruangan.nama_ruangan}
                </span>
              </div>
            )}
          </div>
          <div
            className={`px-4 py-2 rounded-lg font-bold text-sm sm:text-base flex items-center gap-2 ${
              statusLulus ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {statusLulus ? (
              <>
                <CheckCircle className="w-5 h-5" />
                LULUS
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                TIDAK LULUS
              </>
            )}
          </div>
        </div>

        {!!pengaturanPenilaian && (
          <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">
              📊 Informasi Penilaian
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {!!pengaturanPenilaian.rumus && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-800 min-w-[140px]">
                    Rumus Penilaian:
                  </span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">
                    {pengaturanPenilaian.rumus}
                  </code>
                </div>
              )}
              {pengaturanPenilaian.nilai_minimal_lolos !== undefined && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-800 min-w-[140px]">
                    Nilai Minimal Lolos:
                  </span>
                  <span className="text-blue-900 font-semibold">
                    {pengaturanPenilaian.nilai_minimal_lolos}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm sm:text-base font-bold text-gray-900">
            Detail Penilaian
          </h3>

          {sidang.nilaiSidang && sidang.nilaiSidang.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'Penguji 1 (Ketua)',
                  nilai: sidang.nilaiSidang[0],
                  penguji: penguji1,
                },
                {
                  label: 'Penguji 2 (Anggota I)',
                  nilai: sidang.nilaiSidang[1],
                  penguji: penguji2,
                },
                {
                  label: 'Penguji 3 (Anggota II)',
                  nilai: sidang.nilaiSidang[2],
                  penguji: penguji3,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-3 hover:border-red-900 transition-all duration-200 hover:shadow-md"
                >
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    {item.label}
                  </span>
                  <p
                    className="text-xs text-gray-600 mb-2 truncate"
                    title={item.penguji?.dosen.user.name}
                  >
                    {item.penguji?.dosen.user.name || '-'}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-red-900">
                      {item.nilai?.skor || 0}
                    </span>
                    <span className="text-xs text-gray-500">/100</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-xs text-yellow-800">
                Detail nilai belum tersedia.
              </p>
            </div>
          )}

          {sidang.nilai_akhir !== undefined && (
            <div
              className={`mt-4 p-4 sm:p-6 rounded-lg border-2 text-center ${
                statusLulus
                  ? 'bg-gradient-to-br from-green-100 to-green-50 border-green-300'
                  : 'bg-gradient-to-br from-red-100 to-red-50 border-red-300'
              }`}
            >
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Nilai Akhir
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className={`text-3xl sm:text-4xl font-bold ${
                    statusLulus ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {sidang.nilai_akhir.toFixed(2)}
                </span>
                <span className="text-sm text-gray-600">/100</span>
              </div>
              <p
                className={`mt-2 text-sm font-semibold ${
                  statusLulus ? 'text-green-800' : 'text-red-800'
                }`}
              >
                Status: {statusLulus ? 'LULUS' : 'TIDAK LULUS'}
              </p>
              {!statusLulus && !!pengaturanPenilaian?.nilai_minimal_lolos && (
                <p className="mt-2 text-xs text-red-700">
                  Nilai Anda tidak mencapai nilai minimal lolos (
                  {pengaturanPenilaian.nilai_minimal_lolos})
                </p>
              )}
            </div>
          )}
        </div>

        <div
          className={`mt-4 p-4 rounded-lg border ${
            statusLulus
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            {statusLulus ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-900">
                  Selamat! Anda Dinyatakan Lulus
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-900">
                  Anda Dinyatakan Tidak Lulus
                </span>
              </>
            )}
          </h3>
          <p className="text-xs text-gray-700">
            {statusLulus
              ? 'Anda telah berhasil menyelesaikan sidang tugas akhir dengan baik. Silakan menunggu informasi lebih lanjut mengenai proses administrasi kelulusan.'
              : 'Mohon maaf, Anda belum berhasil dalam sidang tugas akhir kali ini. Silakan berkonsultasi dengan dosen pembimbing untuk langkah selanjutnya.'}
          </p>
        </div>
      </div>
    </div>
  );
}
