'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { Settings, Lock, Save, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Pengaturan {
  max_similaritas_persen: number;
  min_bimbingan_valid: number;
  ruangan_sidang: string[];
  max_pembimbing_aktif: number;
  durasi_sidang_menit: number;
  jeda_sidang_menit: number;
}

export default function AturanTugasAkhirPage() {
  const { isJurusan, role } = useRBAC();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pengaturan, setPengaturan] = useState<Pengaturan>({
    max_similaritas_persen: 80,
    min_bimbingan_valid: 9,
    ruangan_sidang: [],
    max_pembimbing_aktif: 4,
    durasi_sidang_menit: 90,
    jeda_sidang_menit: 15,
  });
  const [originalPengaturan, setOriginalPengaturan] = useState<Pengaturan>({
    max_similaritas_persen: 80,
    min_bimbingan_valid: 9,
    ruangan_sidang: [],
    max_pembimbing_aktif: 4,
    durasi_sidang_menit: 90,
    jeda_sidang_menit: 15,
  });
  const [ruanganBaru, setRuanganBaru] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isJurusan) {
      fetchPengaturan();
    }
  }, [isJurusan]);

  useEffect(() => {
    const changed = JSON.stringify(pengaturan) !== JSON.stringify(originalPengaturan);
    setHasChanges(changed);
  }, [pengaturan, originalPengaturan]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (hasChanges) {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.href && !link.href.includes('#')) {
          e.preventDefault();
          if (confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?')) {
            window.location.href = link.href;
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasChanges]);

  const fetchPengaturan = async () => {
    try {
      const response = await api.get<Pengaturan>('/pengaturan');
      const data = response.data.data;
      const settings = {
        max_similaritas_persen: data.max_similaritas_persen ?? 80,
        min_bimbingan_valid: data.min_bimbingan_valid ?? 9,
        ruangan_sidang: data.ruangan_sidang ?? [],
        max_pembimbing_aktif: data.max_pembimbing_aktif ?? 4,
        durasi_sidang_menit: data.durasi_sidang_menit ?? 90,
        jeda_sidang_menit: data.jeda_sidang_menit ?? 15,
      };
      setPengaturan(settings);
      setOriginalPengaturan(settings);
    } catch {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSimpan = async () => {
    setSaving(true);
    try {
      await api.patch('/pengaturan', pengaturan);
      toast.success('Pengaturan berhasil disimpan');
      setOriginalPengaturan(pengaturan);
      setHasChanges(false);
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors && errors.length > 0) {
        errors.forEach((err: { message: string }) => {
          toast.error(err.message);
        });
      } else {
        toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTambahRuangan = () => {
    if (ruanganBaru.trim()) {
      setPengaturan({
        ...pengaturan,
        ruangan_sidang: [...(pengaturan.ruangan_sidang || []), ruanganBaru.trim()],
      });
      setRuanganBaru('');
    }
  };

  const handleHapusRuangan = (index: number) => {
    setPengaturan({
      ...pengaturan,
      ruangan_sidang: (pengaturan.ruangan_sidang || []).filter((_, i) => i !== index),
    });
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
          <p className="text-sm font-medium text-gray-600">
            Memuat pengaturan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-red-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Aturan Tugas Akhir
            </h1>
            <p className="text-sm text-gray-600">
              Kelola pengaturan sistem tugas akhir
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Aturan Judul */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Aturan Judul
          </h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Maksimal Persentase Similaritas (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={pengaturan.max_similaritas_persen}
              onChange={(e) =>
                setPengaturan({
                  ...pengaturan,
                  max_similaritas_persen: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
            />
            <p className="text-sm text-gray-500">
              Dokumen dengan similaritas di atas nilai ini akan ditolak
            </p>
          </div>
        </div>

        {/* Aturan Bimbingan */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Aturan Bimbingan
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Minimal Sesi Bimbingan Valid
              </label>
              <input
                type="number"
                min="1"
                value={pengaturan.min_bimbingan_valid}
                onChange={(e) =>
                  setPengaturan({
                    ...pengaturan,
                    min_bimbingan_valid: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
              />
              <p className="text-sm text-gray-500">
                Jumlah minimal bimbingan yang harus diselesaikan sebelum mahasiswa dapat mendaftar sidang
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Maksimal Mahasiswa Bimbingan Aktif per Dosen
              </label>
              <input
                type="number"
                min="1"
                value={pengaturan.max_pembimbing_aktif}
                onChange={(e) =>
                  setPengaturan({
                    ...pengaturan,
                    max_pembimbing_aktif: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
              />
              <p className="text-sm text-gray-500">
                Jumlah maksimal mahasiswa yang dapat dibimbing oleh satu dosen secara bersamaan
              </p>
            </div>
          </div>
        </div>

        {/* Aturan Sidang */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Aturan Sidang
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Durasi Sidang (Menit)
              </label>
              <input
                type="number"
                min="30"
                value={pengaturan.durasi_sidang_menit}
                onChange={(e) =>
                  setPengaturan({
                    ...pengaturan,
                    durasi_sidang_menit: parseInt(e.target.value) || 30,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
              />
              <p className="text-sm text-gray-500">
                Durasi standar untuk setiap sesi sidang tugas akhir
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Waktu Jeda Antar Sidang (Menit)
              </label>
              <input
                type="number"
                min="0"
                value={pengaturan.jeda_sidang_menit}
                onChange={(e) =>
                  setPengaturan({
                    ...pengaturan,
                    jeda_sidang_menit: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
              />
              <p className="text-sm text-gray-500">
                Jeda waktu setelah sidang selesai sebelum sidang berikutnya dimulai
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ruangan Sidang
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={ruanganBaru}
                  onChange={(e) => setRuanganBaru(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTambahRuangan();
                    }
                  }}
                  placeholder="Nama ruangan baru"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                />
                <button
                  onClick={handleTambahRuangan}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
              <div className="space-y-2 mt-2">
                {(pengaturan.ruangan_sidang || []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Belum ada ruangan. Tambahkan ruangan baru di atas.
                  </p>
                ) : (
                  (pengaturan.ruangan_sidang || []).map((ruangan, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {ruangan}
                      </span>
                      <button
                        onClick={() => handleHapusRuangan(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSimpan}
          disabled={saving || !hasChanges}
          className="flex items-center space-x-2 px-6 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
      </div>
    </div>
  );
}
