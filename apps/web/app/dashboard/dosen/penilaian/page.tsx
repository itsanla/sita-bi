'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRBAC } from '@/hooks/useRBAC';
import { Lock, Loader, Calendar, Clock, Home, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Sidang {
  id: number;
  status_hasil: string | null;
  selesai_sidang: boolean;
  tugasAkhir: {
    judul: string;
    mahasiswa: {
      user: {
        name: string;
      };
    };
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
    if (!confirm('Yakin ingin submit nilai? Nilai tidak bisa diubah setelah disimpan!')) {
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-gray-600">
            Halaman ini hanya dapat diakses oleh Dosen Pembimbing 1 (Sekretaris Sidang)
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
          <p className="text-sm font-medium text-gray-600">Memuat data sidang...</p>
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
            Halaman ini hanya menampilkan sidang dimana Anda berperan sebagai <strong>Pembimbing 1 (Sekretaris)</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Penilaian Sidang</h1>
        <p className="text-sm text-gray-600 mt-1">
          Input nilai sidang dari 3 penguji sebagai sekretaris
        </p>
        
        {pengaturanPenilaian && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📊 Informasi Penilaian</h3>
            <div className="space-y-2 text-sm">
              {pengaturanPenilaian.rumus && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-800 min-w-[140px]">Rumus Penilaian:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">
                    {pengaturanPenilaian.rumus}
                  </code>
                </div>
              )}
              {pengaturanPenilaian.nilai_minimal_lolos !== undefined && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-800 min-w-[140px]">Nilai Minimal Lolos:</span>
                  <span className="text-blue-900 font-semibold">{pengaturanPenilaian.nilai_minimal_lolos}</span>
                </div>
              )}
              <div className={pengaturanPenilaian.rumus || pengaturanPenilaian.nilai_minimal_lolos !== undefined ? "mt-3 pt-3 border-t border-blue-200" : ""}>
                <p className="text-xs text-blue-700 italic">
                  ⚠️ {pengaturanPenilaian.keterangan}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Catatan:</strong> Anda hanya dapat menilai sidang dimana Anda berperan sebagai <strong>Pembimbing 1 (Sekretaris)</strong>. 
            Nilai yang diinput tidak dapat diubah setelah disimpan.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {sidangList.map((sidang) => {
          const jadwal = sidang.jadwalSidang[0];
          const penguji1 = sidang.tugasAkhir.peranDosenTa.find(p => p.peran === 'penguji1');
          const penguji2 = sidang.tugasAkhir.peranDosenTa.find(p => p.peran === 'penguji2');
          const penguji3 = sidang.tugasAkhir.peranDosenTa.find(p => p.peran === 'penguji3');
          const isExpanded = selectedSidang === sidang.id;
          const sudahDinilai = sidang.selesai_sidang && sidang.status_hasil;
          const statusLulus = sidang.status_hasil === 'lulus';

          return (
            <div key={sidang.id} className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
              sudahDinilai 
                ? statusLulus 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-red-300 bg-red-50'
                : 'border-gray-200'
            }`}>
              <div className="mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {sidang.tugasAkhir.mahasiswa.user.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {sidang.tugasAkhir.judul}
                    </p>
                  </div>
                  {sudahDinilai && (
                    <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                      statusLulus 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {statusLulus ? '✓ LULUS' : '✗ TIDAK LULUS'}
                    </div>
                  )}
                </div>
                {jadwal && (
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-3">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(jadwal.tanggal).toLocaleDateString('id-ID')}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {jadwal.waktu_mulai}
                    </span>
                    <span className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      {jadwal.ruangan.nama_ruangan}
                    </span>
                  </div>
                )}
              </div>

              {!isExpanded ? (
                sudahDinilai ? (
                  <div className={`w-full px-4 py-3 rounded-lg text-center font-medium ${
                    statusLulus 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    <CheckCircle className="w-5 h-5 inline-block mr-2" />
                    Nilai sudah diinput - Mahasiswa {statusLulus ? 'LULUS' : 'TIDAK LULUS'} periode ini
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedSidang(sidang.id)}
                    className="w-full px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
                  >
                    Input Nilai Sidang
                  </button>
                )
              ) : (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nilai Penguji 1 (Ketua)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">{penguji1?.dosen.user.name || '-'}</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={nilaiPenguji1}
                        onChange={(e) => setNilaiPenguji1(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nilai Penguji 2 (Anggota I)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">{penguji2?.dosen.user.name || '-'}</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={nilaiPenguji2}
                        onChange={(e) => setNilaiPenguji2(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nilai Penguji 3 (Anggota II)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">{penguji3?.dosen.user.name || '-'}</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={nilaiPenguji3}
                        onChange={(e) => setNilaiPenguji3(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setSelectedSidang(null);
                        setNilaiPenguji1(80);
                        setNilaiPenguji2(80);
                        setNilaiPenguji3(80);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={submitting}
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleSubmit(sidang.id)}
                      disabled={submitting}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
