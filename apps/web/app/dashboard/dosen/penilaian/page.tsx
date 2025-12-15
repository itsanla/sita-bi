'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRBAC } from '@/hooks/useRBAC';
import {
  Lock,
  Loader,
  Calendar,
  Clock,
  Home,
  Save,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Sidang {
  id: number;
  status_hasil: string | null;
  selesai_sidang: boolean;
  nilai_akhir?: number;
  tugasAkhir: {
    judul: string;
    mahasiswa: {
      user: {
        name: string;
      };
    };
    peranDosenTa: Array<{
      peran: string;
      dosen_id: number;
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
  nilaiSidang?: Array<{
    aspek: string;
    skor: number;
    dosen_id: number;
    dosen: {
      user: {
        name: string;
      };
    };
  }>;
}

export default function PenilaianPage() {
  const { isDosen, user } = useRBAC();
  const [loading, setLoading] = useState(true);
  const [sidangList, setSidangList] = useState<Sidang[]>([]);
  const [selectedSidang, setSelectedSidang] = useState<number | null>(null);
  const [nilaiPenguji1, setNilaiPenguji1] = useState<number>(80);
  const [nilaiPenguji2, setNilaiPenguji2] = useState<number>(80);
  const [nilaiPenguji3, setNilaiPenguji3] = useState<number>(80);
  const [submitting, setSubmitting] = useState(false);
  const [pengaturanPenilaian, setPengaturanPenilaian] = useState<{
    rumus?: string;
    nilai_minimal_lolos?: number;
    keterangan: string;
  } | null>(null);

  useEffect(() => {
    if (isDosen) {
      fetchMySidang();
    } else {
      setLoading(false);
    }
  }, [isDosen]);

  const fetchMySidang = async () => {
    try {
      const response = await api.get('/penilaian-sidang/my-sidang');
      setSidangList(response.data.data || []);
      setPengaturanPenilaian(response.data.pengaturan_penilaian || null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data sidang');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (sidangId: number) => {
    if (
      !confirm(
        'Yakin ingin submit nilai? Nilai tidak bisa diubah setelah disimpan!',
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/penilaian-sidang/submit', {
        sidang_id: sidangId,
        nilai_penguji1: nilaiPenguji1,
        nilai_penguji2: nilaiPenguji2,
        nilai_penguji3: nilaiPenguji3,
      });

      toast.success(response.data.message);

      // Refresh data
      await fetchMySidang();
      setSelectedSidang(null);
      setNilaiPenguji1(80);
      setNilaiPenguji2(80);
      setNilaiPenguji3(80);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan nilai');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isDosen) {
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
            Halaman ini hanya dapat diakses oleh Dosen Pembimbing 1 (Sekretaris
            Sidang)
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
            Memuat data sidang...
          </p>
        </div>
      </div>
    );
  }

  if (sidangList.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Penilaian Sidang</h1>
          <p className="text-sm text-gray-600 mt-1">
            Input nilai sidang dari 3 penguji sebagai sekretaris
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Tidak Ada Sidang yang Perlu Dinilai
          </h2>
          <p className="text-sm text-gray-600">
            Anda tidak memiliki sidang yang perlu dinilai saat ini.
            <br />
            Halaman ini hanya menampilkan sidang dimana Anda berperan sebagai{' '}
            <strong>Pembimbing 1 (Sekretaris)</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Penilaian Sidang
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Input nilai sidang dari 3 penguji sebagai sekretaris
        </p>

        {!!pengaturanPenilaian && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
              <div
                className={
                  pengaturanPenilaian.rumus ||
                  pengaturanPenilaian.nilai_minimal_lolos !== undefined
                    ? 'mt-3 pt-3 border-t border-blue-200'
                    : ''
                }
              >
                <p className="text-xs text-blue-700 italic">
                  ⚠️ {pengaturanPenilaian.keterangan}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs sm:text-xs text-amber-800">
            <strong>Catatan:</strong> Anda hanya dapat menilai sidang dimana
            Anda berperan sebagai <strong>Pembimbing 1 (Sekretaris)</strong>.
            Nilai yang diinput tidak dapat diubah setelah disimpan.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {sidangList.map((sidang) => {
          const jadwal = sidang.jadwalSidang[0];
          const penguji1 = sidang.tugasAkhir.peranDosenTa.find(
            (p) => p.peran === 'penguji1',
          );
          const penguji2 = sidang.tugasAkhir.peranDosenTa.find(
            (p) => p.peran === 'penguji2',
          );
          const penguji3 = sidang.tugasAkhir.peranDosenTa.find(
            (p) => p.peran === 'penguji3',
          );
          const isExpanded = selectedSidang === sidang.id;
          const sudahDinilai = sidang.selesai_sidang && sidang.status_hasil;
          const statusLulus = sidang.status_hasil === 'lulus';

          return (
            <div
              key={sidang.id}
              className={`bg-white rounded-xl shadow-md border-2 p-4 sm:p-6 transition-all duration-300 hover:shadow-xl ${
                sudahDinilai
                  ? statusLulus
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-white hover:border-green-400'
                    : 'border-red-300 bg-gradient-to-br from-red-50 to-white hover:border-red-400'
                  : 'border-gray-200 hover:border-red-900'
              }`}
            >
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {sidang.tugasAkhir.mahasiswa.user.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {sidang.tugasAkhir.judul}
                    </p>
                  </div>
                  {!!sudahDinilai && (
                    <div
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm ${
                        statusLulus
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {statusLulus ? '✓ LULUS' : '✗ TIDAK LULUS'}
                    </div>
                  )}
                </div>
                {!!jadwal && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
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

              {!isExpanded ? (
                sudahDinilai ? (
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-gray-200">
                    <div
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-center text-xs sm:text-sm font-medium mb-2 sm:mb-3 ${
                        statusLulus
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1" />
                      Nilai sudah diinput - Mahasiswa{' '}
                      {statusLulus ? 'LULUS' : 'TIDAK LULUS'}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                      Detail Penilaian
                    </h3>

                    {sidang.nilaiSidang && sidang.nilaiSidang.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        {(() => {
                          const penguji1Nilai = sidang.nilaiSidang.find(
                            (n) => n.dosen_id === penguji1?.dosen_id,
                          );
                          const penguji2Nilai = sidang.nilaiSidang.find(
                            (n) => n.dosen_id === penguji2?.dosen_id,
                          );
                          const penguji3Nilai = sidang.nilaiSidang.find(
                            (n) => n.dosen_id === penguji3?.dosen_id,
                          );

                          return [
                            {
                              label: 'Penguji 1 (Ketua)',
                              nilai: penguji1Nilai,
                              penguji: penguji1,
                            },
                            {
                              label: 'Penguji 2 (Anggota I)',
                              nilai: penguji2Nilai,
                              penguji: penguji2,
                            },
                            {
                              label: 'Penguji 3 (Anggota II)',
                              nilai: penguji3Nilai,
                              penguji: penguji3,
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-2 sm:p-3 hover:border-red-900 transition-all duration-200 hover:shadow-md"
                            >
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-0.5 sm:mb-1">
                                {item.label}
                              </span>
                              <p
                                className="text-xs text-gray-600 mb-1 sm:mb-2 truncate"
                                title={item.penguji?.dosen.user.name}
                              >
                                {item.penguji?.dosen.user.name || '-'}
                              </p>
                              <div className="flex items-baseline gap-0.5 sm:gap-1">
                                <span className="text-xl sm:text-2xl font-bold text-red-900">
                                  {item.nilai?.skor || 0}
                                </span>
                                <span className="text-xs text-gray-500">
                                  /100
                                </span>
                              </div>
                            </div>
                          ));
                        })()}
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
                        className={`mt-2 sm:mt-3 p-3 sm:p-4 rounded-lg border-2 text-center ${
                          statusLulus
                            ? 'bg-gradient-to-br from-green-100 to-green-50 border-green-300'
                            : 'bg-gradient-to-br from-red-100 to-red-50 border-red-300'
                        }`}
                      >
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Nilai Akhir
                        </p>
                        <div className="flex items-baseline justify-center gap-0.5 sm:gap-1">
                          <span
                            className={`text-2xl sm:text-3xl font-bold ${
                              statusLulus ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {sidang.nilai_akhir.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-600">/100</span>
                        </div>
                        <p
                          className={`mt-1.5 sm:mt-2 text-xs font-semibold ${
                            statusLulus ? 'text-green-800' : 'text-red-800'
                          }`}
                        >
                          Status: {statusLulus ? 'LULUS' : 'TIDAK LULUS'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedSidang(sidang.id)}
                    className="w-full px-4 py-2 text-sm sm:text-base bg-red-900 text-white rounded-lg hover:bg-red-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Input Nilai Sidang
                  </button>
                )
              ) : (
                <div className="space-y-2 sm:space-y-3 pt-3 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-2 sm:p-3 hover:border-red-900 transition-all duration-200">
                      <label className="block text-xs font-semibold text-gray-700 mb-0.5 sm:mb-1">
                        Nilai Penguji 1 (Ketua)
                      </label>
                      <p
                        className="text-xs text-gray-500 mb-1 sm:mb-2 truncate"
                        title={penguji1?.dosen.user.name}
                      >
                        {penguji1?.dosen.user.name || '-'}
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={nilaiPenguji1}
                        onChange={(e) =>
                          setNilaiPenguji1(parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 transition-all text-sm sm:text-base font-semibold text-center"
                      />
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-2 sm:p-3 hover:border-red-900 transition-all duration-200">
                      <label className="block text-xs font-semibold text-gray-700 mb-0.5 sm:mb-1">
                        Nilai Penguji 2 (Anggota I)
                      </label>
                      <p
                        className="text-xs text-gray-500 mb-1 sm:mb-2 truncate"
                        title={penguji2?.dosen.user.name}
                      >
                        {penguji2?.dosen.user.name || '-'}
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={nilaiPenguji2}
                        onChange={(e) =>
                          setNilaiPenguji2(parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 transition-all text-sm sm:text-base font-semibold text-center"
                      />
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-2 sm:p-3 hover:border-red-900 transition-all duration-200">
                      <label className="block text-xs font-semibold text-gray-700 mb-0.5 sm:mb-1">
                        Nilai Penguji 3 (Anggota II)
                      </label>
                      <p
                        className="text-xs text-gray-500 mb-1 sm:mb-2 truncate"
                        title={penguji3?.dosen.user.name}
                      >
                        {penguji3?.dosen.user.name || '-'}
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={nilaiPenguji3}
                        onChange={(e) =>
                          setNilaiPenguji3(parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 transition-all text-sm sm:text-base font-semibold text-center"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedSidang(null);
                        setNilaiPenguji1(80);
                        setNilaiPenguji2(80);
                        setNilaiPenguji3(80);
                      }}
                      className="w-full sm:w-auto px-4 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm"
                      disabled={submitting}
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleSubmit(sidang.id)}
                      disabled={submitting}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
                    >
                      {submitting ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Simpan Nilai
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
