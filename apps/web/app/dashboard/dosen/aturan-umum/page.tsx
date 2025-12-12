'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { Settings, Lock, Save, Plus, X, Coffee, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SyaratSidang {
  key: string;
  label: string;
}

interface TanggalLibur {
  tanggal: string;
  keterangan: string;
}

interface WaktuIstirahat {
  waktu: string;
  durasi_menit: number;
}

interface JadwalHariKhusus {
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_sidang_menit?: number;
  jeda_sidang_menit?: number;
  waktu_istirahat?: WaktuIstirahat[];
}

interface Pengaturan {
  max_similaritas_persen: number;
  min_bimbingan_valid: number;
  ruangan_sidang: string[];
  max_pembimbing_aktif: number;
  max_mahasiswa_uji_per_dosen: number;
  durasi_sidang_menit: number;
  jeda_sidang_menit: number;
  jam_mulai_sidang?: string;
  jam_selesai_sidang?: string;
  waktu_istirahat?: WaktuIstirahat[];
  jadwal_hari_khusus?: JadwalHariKhusus[];
  hari_libur_tetap?: string[];
  tanggal_libur_khusus?: TanggalLibur[];
  mode_validasi_judul?: string;
  mode_validasi_draf?: string;
  validasi_pendaftaran_sidang_aktif?: boolean;
  validasi_pembimbing_1?: boolean;
  validasi_pembimbing_2?: boolean;
  validasi_prodi?: boolean;
  validasi_jurusan?: boolean;
  syarat_pendaftaran_sidang?: SyaratSidang[];
  rumus_penilaian?: string;
  nilai_minimal_lolos?: number;
  tampilkan_rincian_nilai_ke_sekretaris?: boolean;
}

export default function AturanTugasAkhirPage() {
  const { isJurusan, role } = useRBAC();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pengaturan, setPengaturan] = useState<Pengaturan>({
    max_similaritas_persen: 80,
    min_bimbingan_valid: 9,
    ruangan_sidang: ['a', 'b'],
    max_pembimbing_aktif: 4,
    max_mahasiswa_uji_per_dosen: 8,
    durasi_sidang_menit: 120,
    jeda_sidang_menit: 30,
    jam_mulai_sidang: '08:00',
    jam_selesai_sidang: '15:00',
    waktu_istirahat: [],
    jadwal_hari_khusus: [],
    hari_libur_tetap: ['sabtu', 'minggu'],
    tanggal_libur_khusus: [],
    mode_validasi_judul: 'KEDUA_PEMBIMBING',
    mode_validasi_draf: 'KEDUA_PEMBIMBING',
    validasi_pendaftaran_sidang_aktif: false,
    validasi_pembimbing_1: false,
    validasi_pembimbing_2: false,
    validasi_prodi: false,
    validasi_jurusan: false,
    syarat_pendaftaran_sidang: [],
    rumus_penilaian: '(p1 + p2 + p3) / 3',
    nilai_minimal_lolos: 60,
    tampilkan_rincian_nilai_ke_sekretaris: true,
  });
  const [originalPengaturan, setOriginalPengaturan] = useState<Pengaturan>({
    max_similaritas_persen: 80,
    min_bimbingan_valid: 9,
    ruangan_sidang: ['a', 'b'],
    max_pembimbing_aktif: 4,
    max_mahasiswa_uji_per_dosen: 8,
    durasi_sidang_menit: 120,
    jeda_sidang_menit: 30,
    jam_mulai_sidang: '08:00',
    jam_selesai_sidang: '15:00',
    waktu_istirahat: [],
    jadwal_hari_khusus: [],
    hari_libur_tetap: ['sabtu', 'minggu'],
    tanggal_libur_khusus: [],
    mode_validasi_judul: 'KEDUA_PEMBIMBING',
    mode_validasi_draf: 'KEDUA_PEMBIMBING',
    validasi_pendaftaran_sidang_aktif: false,
    validasi_pembimbing_1: false,
    validasi_pembimbing_2: false,
    validasi_prodi: false,
    validasi_jurusan: false,
    syarat_pendaftaran_sidang: [],
    rumus_penilaian: '(p1 + p2 + p3) / 3',
    nilai_minimal_lolos: 60,
    tampilkan_rincian_nilai_ke_sekretaris: true,
  });
  const [ruanganBaru, setRuanganBaru] = useState('');
  const [syaratBaru, setSyaratBaru] = useState({ key: '', label: '' });
  const [tanggalLiburBaru, setTanggalLiburBaru] = useState({ tanggal: '', keterangan: '' });
  const [waktuIstirahatBaru, setWaktuIstirahatBaru] = useState({ waktu: '', durasi_menit: 60 });
  const [showJadwalKhususModal, setShowJadwalKhususModal] = useState(false);
  const [editingHariKhusus, setEditingHariKhusus] = useState<JadwalHariKhusus | null>(null);
  const [waktuIstirahatKhususBaru, setWaktuIstirahatKhususBaru] = useState({ waktu: '', durasi_menit: 60 });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isJurusan) {
      fetchPengaturan();
    }
  }, [isJurusan]);

  useEffect(() => {
    const changed =
      JSON.stringify(pengaturan) !== JSON.stringify(originalPengaturan);
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
          if (
            confirm(
              'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?',
            )
          ) {
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
      const [pengaturanRes, aturanValidasiRes] = await Promise.all([
        api.get<Pengaturan>('/pengaturan'),
        api.get<any>('/aturan-validasi'),
      ]);
      const data = pengaturanRes.data.data;
      const aturanValidasi = aturanValidasiRes.data.data;
      console.log('Aturan Validasi Response:', aturanValidasi);
      const settings = {
        max_similaritas_persen: data.max_similaritas_persen ?? 80,
        min_bimbingan_valid: data.min_bimbingan_valid ?? 9,
        ruangan_sidang: data.ruangan_sidang ?? ['a', 'b'],
        max_pembimbing_aktif: data.max_pembimbing_aktif ?? 4,
        max_mahasiswa_uji_per_dosen: data.max_mahasiswa_uji_per_dosen ?? 8,
        durasi_sidang_menit: data.durasi_sidang_menit ?? 120,
        jeda_sidang_menit: data.jeda_sidang_menit ?? 30,
        jam_mulai_sidang: data.jam_mulai_sidang ?? '08:00',
        jam_selesai_sidang: data.jam_selesai_sidang ?? '15:00',
        waktu_istirahat: data.waktu_istirahat ?? [],
        jadwal_hari_khusus: data.jadwal_hari_khusus ?? [],
        hari_libur_tetap: data.hari_libur_tetap ?? ['sabtu', 'minggu'],
        tanggal_libur_khusus: data.tanggal_libur_khusus ?? [],
        mode_validasi_judul:
          aturanValidasi?.mode_validasi_judul ?? 'KEDUA_PEMBIMBING',
        mode_validasi_draf:
          aturanValidasi?.mode_validasi_draf ?? 'KEDUA_PEMBIMBING',
        validasi_pendaftaran_sidang_aktif:
          data.validasi_pendaftaran_sidang_aktif ?? false,
        validasi_pembimbing_1: data.validasi_pembimbing_1 ?? false,
        validasi_pembimbing_2: data.validasi_pembimbing_2 ?? false,
        validasi_prodi: data.validasi_prodi ?? false,
        validasi_jurusan: data.validasi_jurusan ?? false,
        syarat_pendaftaran_sidang: data.syarat_pendaftaran_sidang ?? [
          { key: 'NASKAH_TA', label: 'Naskah TA' },
          { key: 'TOEIC', label: 'Sertifikat TOEIC' },
          { key: 'RAPOR', label: 'Transkrip Nilai' },
          { key: 'IJAZAH_SLTA', label: 'Ijazah SLTA' },
          { key: 'BEBAS_JURUSAN', label: 'Surat Bebas Jurusan' },
        ],
        rumus_penilaian: data.rumus_penilaian ?? '(p1 + p2 + p3) / 3',
        nilai_minimal_lolos: data.nilai_minimal_lolos ?? 60,
        tampilkan_rincian_nilai_ke_sekretaris: data.tampilkan_rincian_nilai_ke_sekretaris ?? true,
      };
      console.log('Settings:', settings);
      setPengaturan(settings);
      setOriginalPengaturan(settings);
    } catch (error) {
      console.error('Error fetching pengaturan:', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSimpan = async () => {
    setSaving(true);
    try {
      const { mode_validasi_judul, mode_validasi_draf, ...pengaturanData } =
        pengaturan;
      console.log('Saving pengaturan:', pengaturanData);
      console.log('Saving aturan validasi:', {
        mode_validasi_judul,
        mode_validasi_draf,
      });
      const results = await Promise.all([
        api.patch('/pengaturan', pengaturanData),
        api.put('/aturan-validasi', {
          mode_validasi_judul,
          mode_validasi_draf,
        }),
      ]);
      console.log('Save results:', results);
      toast.success('Pengaturan berhasil disimpan');
      setOriginalPengaturan(pengaturan);
      setHasChanges(false);
      await fetchPengaturan();
    } catch (error: any) {
      console.error('Error saving:', error);
      const errors = error.response?.data?.errors;
      if (errors && errors.length > 0) {
        errors.forEach((err: { message: string }) => {
          toast.error(err.message);
        });
      } else {
        toast.error(
          error.response?.data?.message || 'Gagal menyimpan pengaturan',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTambahRuangan = () => {
    if (ruanganBaru.trim()) {
      setPengaturan({
        ...pengaturan,
        ruangan_sidang: [
          ...(pengaturan.ruangan_sidang || []),
          ruanganBaru.trim(),
        ],
      });
      setRuanganBaru('');
    }
  };

  const handleHapusRuangan = (index: number) => {
    setPengaturan({
      ...pengaturan,
      ruangan_sidang: (pengaturan.ruangan_sidang || []).filter(
        (_, i) => i !== index,
      ),
    });
  };

  const handleTambahSyarat = () => {
    if (syaratBaru.key.trim() && syaratBaru.label.trim()) {
      setPengaturan({
        ...pengaturan,
        syarat_pendaftaran_sidang: [
          ...(pengaturan.syarat_pendaftaran_sidang || []),
          { key: syaratBaru.key.trim(), label: syaratBaru.label.trim() },
        ],
      });
      setSyaratBaru({ key: '', label: '' });
    }
  };

  const handleHapusSyarat = (index: number) => {
    setPengaturan({
      ...pengaturan,
      syarat_pendaftaran_sidang: (
        pengaturan.syarat_pendaftaran_sidang || []
      ).filter((_, i) => i !== index),
    });
  };
  
  const handleTambahTanggalLibur = () => {
    if (tanggalLiburBaru.tanggal && tanggalLiburBaru.keterangan.trim()) {
      setPengaturan({
        ...pengaturan,
        tanggal_libur_khusus: [
          ...(pengaturan.tanggal_libur_khusus || []),
          { tanggal: tanggalLiburBaru.tanggal, keterangan: tanggalLiburBaru.keterangan.trim() },
        ],
      });
      setTanggalLiburBaru({ tanggal: '', keterangan: '' });
    }
  };

  const handleHapusTanggalLibur = (index: number) => {
    setPengaturan({
      ...pengaturan,
      tanggal_libur_khusus: (
        pengaturan.tanggal_libur_khusus || []
      ).filter((_, i) => i !== index),
    });
  };

  const handleToggleHariLibur = (hari: string) => {
    const current = pengaturan.hari_libur_tetap || [];
    if (current.includes(hari)) {
      setPengaturan({
        ...pengaturan,
        hari_libur_tetap: current.filter(h => h !== hari),
      });
    } else {
      setPengaturan({
        ...pengaturan,
        hari_libur_tetap: [...current, hari],
      });
    }
  };

  const calculateAvailableWaktuIstirahat = () => {
    const { jam_mulai_sidang, jam_selesai_sidang, durasi_sidang_menit, jeda_sidang_menit } = pengaturan;
    if (!jam_mulai_sidang || !jam_selesai_sidang || !durasi_sidang_menit) return [];

    const [jamMulai, menitMulai] = jam_mulai_sidang.split(':').map(Number);
    const [jamSelesai, menitSelesai] = jam_selesai_sidang.split(':').map(Number);
    const startMinutes = jamMulai * 60 + menitMulai;
    const endMinutes = jamSelesai * 60 + menitSelesai;
    const durasiTotal = durasi_sidang_menit + jeda_sidang_menit;

    const waktuList: string[] = [];
    let currentMinutes = startMinutes + durasi_sidang_menit;

    while (currentMinutes < endMinutes) {
      const jam = Math.floor(currentMinutes / 60);
      const menit = currentMinutes % 60;
      waktuList.push(`${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}`);
      currentMinutes += durasiTotal;
    }

    return waktuList;
  };

  const handleTambahWaktuIstirahat = () => {
    if (waktuIstirahatBaru.waktu && waktuIstirahatBaru.durasi_menit > 0) {
      setPengaturan({
        ...pengaturan,
        waktu_istirahat: [
          ...(pengaturan.waktu_istirahat || []),
          { waktu: waktuIstirahatBaru.waktu, durasi_menit: waktuIstirahatBaru.durasi_menit },
        ],
      });
      setWaktuIstirahatBaru({ waktu: '', durasi_menit: 60 });
    }
  };

  const handleHapusWaktuIstirahat = (index: number) => {
    setPengaturan({
      ...pengaturan,
      waktu_istirahat: (pengaturan.waktu_istirahat || []).filter((_, i) => i !== index),
    });
  };

  const handleTambahHariKhusus = () => {
    setEditingHariKhusus({ hari: 'jumat', jam_mulai: '08:00', jam_selesai: '15:00', durasi_sidang_menit: pengaturan.durasi_sidang_menit, jeda_sidang_menit: pengaturan.jeda_sidang_menit, waktu_istirahat: [] });
    setShowJadwalKhususModal(true);
  };

  const handleSimpanHariKhusus = () => {
    if (!editingHariKhusus) return;
    const existing = (pengaturan.jadwal_hari_khusus || []).findIndex(j => j.hari === editingHariKhusus.hari);
    if (existing >= 0) {
      const updated = [...(pengaturan.jadwal_hari_khusus || [])];
      updated[existing] = editingHariKhusus;
      setPengaturan({ ...pengaturan, jadwal_hari_khusus: updated });
    } else {
      setPengaturan({ ...pengaturan, jadwal_hari_khusus: [...(pengaturan.jadwal_hari_khusus || []), editingHariKhusus] });
    }
    setShowJadwalKhususModal(false);
    setEditingHariKhusus(null);
  };

  const handleHapusHariKhusus = (hari: string) => {
    setPengaturan({ ...pengaturan, jadwal_hari_khusus: (pengaturan.jadwal_hari_khusus || []).filter(j => j.hari !== hari) });
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
                Jumlah minimal bimbingan yang harus diselesaikan sebelum
                mahasiswa dapat mendaftar sidang
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
                Jumlah maksimal mahasiswa yang dapat dibimbing oleh satu dosen
                secara bersamaan
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Catatan:</span> Perubahan aturan
              validasi hanya berlaku untuk validasi baru. Validasi yang sudah
              dilakukan sebelumnya tetap dianggap valid (grandfathering policy).
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Validasi Judul Tugas Akhir
              </label>
              <select
                value={pengaturan.mode_validasi_judul}
                onChange={(e) =>
                  setPengaturan({
                    ...pengaturan,
                    mode_validasi_judul: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
              >
                <option value="SALAH_SATU">Salah Satu Pembimbing</option>
                <option value="KEDUA_PEMBIMBING">Harus Kedua Pembimbing</option>
                <option value="PEMBIMBING_1_SAJA">Pembimbing 1 Saja</option>
              </select>
              <p className="text-sm text-gray-500">
                Menentukan siapa yang harus memvalidasi judul tugas akhir
              </p>
              <p className="text-xs text-blue-600 font-medium">
                Saat ini:{' '}
                {pengaturan.mode_validasi_judul === 'SALAH_SATU'
                  ? 'Salah Satu Pembimbing'
                  : pengaturan.mode_validasi_judul === 'KEDUA_PEMBIMBING'
                    ? 'Harus Kedua Pembimbing'
                    : 'Pembimbing 1 Saja'}
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Validasi Draf Tugas Akhir
              </label>
              <select
                value={pengaturan.mode_validasi_draf}
                onChange={(e) =>
                  setPengaturan({
                    ...pengaturan,
                    mode_validasi_draf: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
              >
                <option value="SALAH_SATU">Salah Satu Pembimbing</option>
                <option value="KEDUA_PEMBIMBING">Harus Kedua Pembimbing</option>
                <option value="PEMBIMBING_1_SAJA">Pembimbing 1 Saja</option>
              </select>
              <p className="text-sm text-gray-500">
                Menentukan siapa yang harus memvalidasi draf tugas akhir
              </p>
              <p className="text-xs text-blue-600 font-medium">
                Saat ini:{' '}
                {pengaturan.mode_validasi_draf === 'SALAH_SATU'
                  ? 'Salah Satu Pembimbing'
                  : pengaturan.mode_validasi_draf === 'KEDUA_PEMBIMBING'
                    ? 'Harus Kedua Pembimbing'
                    : 'Pembimbing 1 Saja'}
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* Aturan Pendaftaran Sidang */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Aturan Pendaftaran Sidang
          </h2>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mode Validasi Pendaftaran Sidang
                </label>
                <select
                  value={
                    pengaturan.validasi_pendaftaran_sidang_aktif
                      ? 'dengan_validasi'
                      : 'tanpa_validasi'
                  }
                  onChange={(e) => {
                    const aktif = e.target.value === 'dengan_validasi';
                    if (!aktif) {
                      setPengaturan({
                        ...pengaturan,
                        validasi_pendaftaran_sidang_aktif: false,
                        validasi_pembimbing_1: false,
                        validasi_pembimbing_2: false,
                        validasi_prodi: false,
                        validasi_jurusan: false,
                      });
                    } else {
                      setPengaturan({
                        ...pengaturan,
                        validasi_pendaftaran_sidang_aktif: true,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                >
                  <option value="tanpa_validasi">
                    Tanpa Validasi (Otomatis)
                  </option>
                  <option value="dengan_validasi">Dengan Validasi</option>
                </select>
                <p className="text-sm text-gray-500">
                  Pilih apakah pendaftaran sidang memerlukan validasi atau
                  otomatis disetujui
                </p>
              </div>

              {pengaturan.validasi_pendaftaran_sidang_aktif && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Pilih Validator (bisa kombinasi):
                  </p>

                  <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">
                      Validasi Pembimbing 1
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={pengaturan.validasi_pembimbing_1 || false}
                        onChange={(e) =>
                          setPengaturan({
                            ...pengaturan,
                            validasi_pembimbing_1: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-900"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">
                      Validasi Pembimbing 2
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={pengaturan.validasi_pembimbing_2 || false}
                        onChange={(e) =>
                          setPengaturan({
                            ...pengaturan,
                            validasi_pembimbing_2: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-900"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">
                      Validasi Prodi
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={pengaturan.validasi_prodi || false}
                        onChange={(e) =>
                          setPengaturan({
                            ...pengaturan,
                            validasi_prodi: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-900"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">
                      Validasi Jurusan
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={pengaturan.validasi_jurusan || false}
                        onChange={(e) =>
                          setPengaturan({
                            ...pengaturan,
                            validasi_jurusan: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-900"></div>
                    </div>
                  </label>

                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Minimal pilih 1 validator jika menggunakan mode "Dengan
                    Validasi"
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Syarat Pendaftaran Sidang
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Daftar dokumen yang harus diupload mahasiswa untuk mendaftar
                sidang
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={syaratBaru.key}
                    onChange={(e) =>
                      setSyaratBaru({ ...syaratBaru, key: e.target.value })
                    }
                    placeholder="Key (contoh: NASKAH_TA)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={syaratBaru.label}
                    onChange={(e) =>
                      setSyaratBaru({ ...syaratBaru, label: e.target.value })
                    }
                    placeholder="Label (contoh: Naskah TA)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleTambahSyarat}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Syarat</span>
                </button>
              </div>
              <div className="space-y-2 mt-2">
                {(pengaturan.syarat_pendaftaran_sidang || []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Belum ada syarat. Tambahkan syarat baru di atas.
                  </p>
                ) : (
                  (pengaturan.syarat_pendaftaran_sidang || []).map(
                    (syarat, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {syarat.label}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({syarat.key})
                          </span>
                        </div>
                        <button
                          onClick={() => handleHapusSyarat(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Aturan Penjadwalan Sidang */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Aturan Penjadwalan Sidang
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Maksimal Mahasiswa Uji per Dosen
              </label>
              <input
                type="number"
                min="1"
                value={pengaturan.max_mahasiswa_uji_per_dosen}
                onChange={(e) =>
                  setPengaturan({
                    ...pengaturan,
                    max_mahasiswa_uji_per_dosen: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
              />
              <p className="text-sm text-gray-500">
                Jumlah maksimal mahasiswa yang dapat diuji oleh satu dosen dalam satu periode sidang
              </p>
            </div>
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
                Jeda waktu setelah sidang selesai sebelum sidang berikutnya
                dimulai
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Jam Operasional Sidang
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={pengaturan.jam_mulai_sidang}
                    onChange={(e) =>
                      setPengaturan({
                        ...pengaturan,
                        jam_mulai_sidang: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={pengaturan.jam_selesai_sidang}
                    onChange={(e) =>
                      setPengaturan({
                        ...pengaturan,
                        jam_selesai_sidang: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Rentang waktu operasional untuk penjadwalan sidang
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Waktu Istirahat
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Tambahkan waktu istirahat di tengah jadwal sidang (misal: istirahat makan siang)
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={waktuIstirahatBaru.waktu}
                    onChange={(e) => setWaktuIstirahatBaru({ ...waktuIstirahatBaru, waktu: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                  >
                    <option value="">Pilih waktu selesai sidang</option>
                    {calculateAvailableWaktuIstirahat().map((waktu) => (
                      <option key={waktu} value={waktu}>{waktu}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={waktuIstirahatBaru.durasi_menit}
                    onChange={(e) => setWaktuIstirahatBaru({ ...waktuIstirahatBaru, durasi_menit: parseInt(e.target.value) || 60 })}
                    placeholder="Durasi (menit)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleTambahWaktuIstirahat}
                  disabled={!waktuIstirahatBaru.waktu}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Waktu Istirahat</span>
                </button>
              </div>
              <div className="space-y-2 mt-2">
                {(pengaturan.waktu_istirahat || []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Belum ada waktu istirahat.
                  </p>
                ) : (
                  (pengaturan.waktu_istirahat || []).map((istirahat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          Istirahat setelah sidang selesai jam {istirahat.waktu}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          (Durasi: {istirahat.durasi_menit} menit)
                        </span>
                      </div>
                      <button
                        onClick={() => handleHapusWaktuIstirahat(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Hari Libur Tetap
              </label>
              <div className="flex flex-wrap gap-2">
                {['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'].map((hari) => (
                  <label
                    key={hari}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={(pengaturan.hari_libur_tetap || []).includes(hari)}
                      onChange={() => handleToggleHariLibur(hari)}
                      className="w-4 h-4 text-red-900 border-gray-300 rounded focus:ring-red-900"
                    />
                    <span className="text-sm capitalize">{hari}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Pilih hari yang tidak tersedia untuk sidang
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tanggal Libur Khusus
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Tambahkan tanggal libur nasional atau hari khusus lainnya
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={tanggalLiburBaru.tanggal}
                    onChange={(e) =>
                      setTanggalLiburBaru({ ...tanggalLiburBaru, tanggal: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={tanggalLiburBaru.keterangan}
                    onChange={(e) =>
                      setTanggalLiburBaru({ ...tanggalLiburBaru, keterangan: e.target.value })
                    }
                    placeholder="Keterangan (contoh: HUT RI)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleTambahTanggalLibur}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Tanggal Libur</span>
                </button>
              </div>
              <div className="space-y-2 mt-2">
                {(pengaturan.tanggal_libur_khusus || []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Belum ada tanggal libur khusus.
                  </p>
                ) : (
                  (pengaturan.tanggal_libur_khusus || []).map(
                    (libur, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {libur.tanggal}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            - {libur.keterangan}
                          </span>
                        </div>
                        <button
                          onClick={() => handleHapusTanggalLibur(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ),
                  )
                )}
              </div>
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
            
            {/* Jadwal Hari Khusus */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Jadwal Hari Khusus</label>
              <p className="text-sm text-gray-500 mb-2">Atur jam operasional berbeda untuk hari tertentu (misal: Jumat kosong jam 11-13 untuk sholat Jumat)</p>
              <button onClick={handleTambahHariKhusus} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Plus className="w-4 h-4" /><span>Tambah Hari Khusus</span>
              </button>
              <div className="space-y-2 mt-2">
                {(pengaturan.jadwal_hari_khusus || []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada jadwal hari khusus</p>
                ) : (
                  (pengaturan.jadwal_hari_khusus || []).map((jadwal, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div><span className="text-sm font-medium text-purple-900 capitalize">Hari {jadwal.hari}</span><span className="text-xs text-purple-700 ml-2">{jadwal.jam_mulai} - {jadwal.jam_selesai}</span></div>
                      <button onClick={() => handleHapusHariKhusus(jadwal.hari)} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Preview Jadwal */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                Preview Jadwal
              </h3>
              {(pengaturan.jadwal_hari_khusus || []).length > 0 && (
                <p className="text-xs text-purple-600 mb-3">⚠️ Ada {(pengaturan.jadwal_hari_khusus || []).length} hari dengan jadwal khusus</p>
              )}
              {/* Preview Default */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Jadwal Default (Hari Normal)</p>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                {(() => {
                  const { jam_mulai_sidang, jam_selesai_sidang, durasi_sidang_menit, jeda_sidang_menit, waktu_istirahat, ruangan_sidang } = pengaturan;
                  if (!jam_mulai_sidang || !jam_selesai_sidang || !durasi_sidang_menit) {
                    return <p className="text-sm text-gray-500">Lengkapi pengaturan untuk melihat preview</p>;
                  }

                  const [jamMulai, menitMulai] = jam_mulai_sidang.split(':').map(Number);
                  const [jamSelesai, menitSelesai] = jam_selesai_sidang.split(':').map(Number);
                  const startMinutes = jamMulai * 60 + menitMulai;
                  const endMinutes = jamSelesai * 60 + menitSelesai;
                  const durasiTotal = durasi_sidang_menit + jeda_sidang_menit;

                  const waktuIstirahatMap = new Map<number, number>();
                  (waktu_istirahat || []).forEach((istirahat) => {
                    const [jam, menit] = istirahat.waktu.split(':').map(Number);
                    waktuIstirahatMap.set(jam * 60 + menit, istirahat.durasi_menit);
                  });

                  const slots: { mulai: string; selesai: string; isIstirahat?: boolean; durasi?: number }[] = [];
                  let currentMinutes = startMinutes;

                  while (currentMinutes + durasi_sidang_menit <= endMinutes) {
                    const waktuMulai = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
                    const waktuSelesaiMenit = currentMinutes + durasi_sidang_menit;
                    const waktuSelesai = `${String(Math.floor(waktuSelesaiMenit / 60)).padStart(2, '0')}:${String(waktuSelesaiMenit % 60).padStart(2, '0')}`;

                    slots.push({ mulai: waktuMulai, selesai: waktuSelesai });

                    if (waktuIstirahatMap.has(waktuSelesaiMenit)) {
                      const durasiIstirahat = waktuIstirahatMap.get(waktuSelesaiMenit)!;
                      const istirahatSelesai = `${String(Math.floor((waktuSelesaiMenit + durasiIstirahat) / 60)).padStart(2, '0')}:${String((waktuSelesaiMenit + durasiIstirahat) % 60).padStart(2, '0')}`;
                      slots.push({ mulai: waktuSelesai, selesai: istirahatSelesai, isIstirahat: true, durasi: durasiIstirahat });
                      currentMinutes = waktuSelesaiMenit + durasiIstirahat;
                    } else {
                      currentMinutes += durasiTotal;
                    }
                  }

                  const totalSlot = slots.filter(s => !s.isIstirahat).length;
                  const totalRuangan = (ruangan_sidang || []).length || 1;
                  const totalSidangPerHari = totalSlot * totalRuangan;

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-white rounded p-2 border border-blue-200">
                          <p className="text-gray-600">Total Slot</p>
                          <p className="text-lg font-bold text-blue-900">{totalSlot}</p>
                        </div>
                        <div className="bg-white rounded p-2 border border-blue-200">
                          <p className="text-gray-600">Ruangan</p>
                          <p className="text-lg font-bold text-blue-900">{totalRuangan}</p>
                        </div>
                        <div className="bg-white rounded p-2 border border-blue-200">
                          <p className="text-gray-600">Sidang/Hari</p>
                          <p className="text-lg font-bold text-blue-900">{totalSidangPerHari}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {slots.map((slot, idx) => (
                          slot.isIstirahat ? (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-amber-100 border border-amber-300 rounded text-xs">
                              <Coffee className="w-3 h-3 text-amber-700" />
                              <span className="font-medium text-amber-900">ISTIRAHAT</span>
                              <span className="text-amber-700">{slot.mulai} - {slot.selesai}</span>
                              <span className="text-amber-600">({slot.durasi} menit)</span>
                            </div>
                          ) : (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white border border-blue-200 rounded text-xs">
                              <span className="font-mono font-medium text-blue-900">Slot {idx - slots.slice(0, idx).filter(s => s.isIstirahat).length + 1}</span>
                              <span className="text-gray-700">{slot.mulai} - {slot.selesai}</span>
                              <span className="text-gray-500">({durasi_sidang_menit} menit)</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  );
                })()}
                </div>
              </div>
              
              {/* Preview Hari Khusus */}
              {(pengaturan.jadwal_hari_khusus || []).map((jadwalKhusus, idx) => (
                <div key={idx} className="mb-4">
                  <p className="text-xs font-semibold text-purple-700 mb-2 capitalize">Jadwal Hari {jadwalKhusus.hari}</p>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                    {(() => {
                      const { jam_mulai, jam_selesai, waktu_istirahat, durasi_sidang_menit: durasiKhusus, jeda_sidang_menit: jedaKhusus } = jadwalKhusus;
                      const durasi_sidang_menit = durasiKhusus ?? pengaturan.durasi_sidang_menit;
                      const jeda_sidang_menit = jedaKhusus ?? pengaturan.jeda_sidang_menit;
                      const { ruangan_sidang } = pengaturan;
                      if (!jam_mulai || !jam_selesai || !durasi_sidang_menit) return <p className="text-sm text-gray-500">Lengkapi pengaturan</p>;
                      const [jamMulai, menitMulai] = jam_mulai.split(':').map(Number);
                      const [jamSelesai, menitSelesai] = jam_selesai.split(':').map(Number);
                      const startMinutes = jamMulai * 60 + menitMulai;
                      const endMinutes = jamSelesai * 60 + menitSelesai;
                      const durasiTotal = durasi_sidang_menit + jeda_sidang_menit;
                      const waktuIstirahatMap = new Map<number, number>();
                      (waktu_istirahat || []).forEach((istirahat) => {
                        const [jam, menit] = istirahat.waktu.split(':').map(Number);
                        waktuIstirahatMap.set(jam * 60 + menit, istirahat.durasi_menit);
                      });
                      const slots: { mulai: string; selesai: string; isIstirahat?: boolean; durasi?: number }[] = [];
                      let currentMinutes = startMinutes;
                      while (currentMinutes + durasi_sidang_menit <= endMinutes) {
                        const waktuMulai = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
                        const waktuSelesaiMenit = currentMinutes + durasi_sidang_menit;
                        const waktuSelesai = `${String(Math.floor(waktuSelesaiMenit / 60)).padStart(2, '0')}:${String(waktuSelesaiMenit % 60).padStart(2, '0')}`;
                        slots.push({ mulai: waktuMulai, selesai: waktuSelesai });
                        if (waktuIstirahatMap.has(waktuSelesaiMenit)) {
                          const durasiIstirahat = waktuIstirahatMap.get(waktuSelesaiMenit)!;
                          const istirahatSelesai = `${String(Math.floor((waktuSelesaiMenit + durasiIstirahat) / 60)).padStart(2, '0')}:${String((waktuSelesaiMenit + durasiIstirahat) % 60).padStart(2, '0')}`;
                          slots.push({ mulai: waktuSelesai, selesai: istirahatSelesai, isIstirahat: true, durasi: durasiIstirahat });
                          currentMinutes = waktuSelesaiMenit + durasiIstirahat;
                        } else {
                          currentMinutes += durasiTotal;
                        }
                      }
                      const totalSlot = slots.filter(s => !s.isIstirahat).length;
                      const totalRuangan = (ruangan_sidang || []).length || 1;
                      const totalSidangPerHari = totalSlot * totalRuangan;
                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div className="bg-white rounded p-2 border border-purple-200"><p className="text-gray-600">Total Slot</p><p className="text-lg font-bold text-purple-900">{totalSlot}</p></div>
                            <div className="bg-white rounded p-2 border border-purple-200"><p className="text-gray-600">Ruangan</p><p className="text-lg font-bold text-purple-900">{totalRuangan}</p></div>
                            <div className="bg-white rounded p-2 border border-purple-200"><p className="text-gray-600">Sidang/Hari</p><p className="text-lg font-bold text-purple-900">{totalSidangPerHari}</p></div>
                          </div>
                          <div className="space-y-1">
                            {slots.map((slot, idx) => slot.isIstirahat ? (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-amber-100 border border-amber-300 rounded text-xs"><Coffee className="w-3 h-3 text-amber-700" /><span className="font-medium text-amber-900">ISTIRAHAT</span><span className="text-amber-700">{slot.mulai} - {slot.selesai}</span><span className="text-amber-600">({slot.durasi} menit)</span></div>
                            ) : (
                              <div key={idx} className="flex items-center justify-between p-2 bg-white border border-purple-200 rounded text-xs"><span className="font-mono font-medium text-purple-900">Slot {idx - slots.slice(0, idx).filter(s => s.isIstirahat).length + 1}</span><span className="text-gray-700">{slot.mulai} - {slot.selesai}</span><span className="text-gray-500">({durasi_sidang_menit} menit)</span></div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showJadwalKhususModal && editingHariKhusus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b"><h3 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5" />Atur Jadwal Hari Khusus</h3></div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-sm font-medium mb-2">Pilih Hari</label>
                <select value={editingHariKhusus.hari} onChange={(e) => setEditingHariKhusus({ ...editingHariKhusus, hari: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                  {['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'].filter(h => !(pengaturan.hari_libur_tetap || []).includes(h)).map(h => <option key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Jam Mulai</label><input type="time" value={editingHariKhusus.jam_mulai} onChange={(e) => setEditingHariKhusus({ ...editingHariKhusus, jam_mulai: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-2">Jam Selesai</label><input type="time" value={editingHariKhusus.jam_selesai} onChange={(e) => setEditingHariKhusus({ ...editingHariKhusus, jam_selesai: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Durasi Sidang (Menit)</label><input type="number" min="30" value={editingHariKhusus.durasi_sidang_menit ?? pengaturan.durasi_sidang_menit} onChange={(e) => setEditingHariKhusus({ ...editingHariKhusus, durasi_sidang_menit: parseInt(e.target.value) || 30 })} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-2">Jeda Sidang (Menit)</label><input type="number" min="0" value={editingHariKhusus.jeda_sidang_menit ?? pengaturan.jeda_sidang_menit} onChange={(e) => setEditingHariKhusus({ ...editingHariKhusus, jeda_sidang_menit: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg" /></div>
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-2">Waktu Istirahat Khusus</label>
                <p className="text-xs text-gray-500 mb-2">Tambahkan waktu istirahat khusus untuk hari ini</p>
                <div className="space-y-2">
                  {(() => {
                    const { jam_mulai, jam_selesai, durasi_sidang_menit: durasiKhusus, jeda_sidang_menit: jedaKhusus } = editingHariKhusus;
                    const durasi_sidang_menit = durasiKhusus ?? pengaturan.durasi_sidang_menit;
                    const jeda_sidang_menit = jedaKhusus ?? pengaturan.jeda_sidang_menit;
                    if (!jam_mulai || !jam_selesai || !durasi_sidang_menit) return null;
                    const [jamMulai, menitMulai] = jam_mulai.split(':').map(Number);
                    const [jamSelesai, menitSelesai] = jam_selesai.split(':').map(Number);
                    const startMinutes = jamMulai * 60 + menitMulai;
                    const endMinutes = jamSelesai * 60 + menitSelesai;
                    const durasiTotal = durasi_sidang_menit + jeda_sidang_menit;
                    const waktuList: string[] = [];
                    let currentMinutes = startMinutes + durasi_sidang_menit;
                    while (currentMinutes < endMinutes) {
                      const jam = Math.floor(currentMinutes / 60);
                      const menit = currentMinutes % 60;
                      waktuList.push(`${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}`);
                      currentMinutes += durasiTotal;
                    }
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={waktuIstirahatKhususBaru.waktu} onChange={(e) => setWaktuIstirahatKhususBaru({ ...waktuIstirahatKhususBaru, waktu: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                            <option value="">Pilih waktu</option>
                            {waktuList.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                          <input type="number" min="15" step="15" value={waktuIstirahatKhususBaru.durasi_menit} onChange={(e) => setWaktuIstirahatKhususBaru({ ...waktuIstirahatKhususBaru, durasi_menit: parseInt(e.target.value) || 60 })} placeholder="Durasi (menit)" className="px-3 py-2 border rounded-lg text-sm" />
                        </div>
                        <button onClick={() => {
                          if (waktuIstirahatKhususBaru.waktu) {
                            setEditingHariKhusus({ ...editingHariKhusus, waktu_istirahat: [...(editingHariKhusus.waktu_istirahat || []), waktuIstirahatKhususBaru] });
                            setWaktuIstirahatKhususBaru({ waktu: '', durasi_menit: 60 });
                          }
                        }} disabled={!waktuIstirahatKhususBaru.waktu} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50">Tambah</button>
                        <div className="space-y-1 mt-2">
                          {(editingHariKhusus.waktu_istirahat || []).map((ist, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-200 text-xs">
                              <span>Istirahat {ist.waktu} ({ist.durasi_menit} menit)</span>
                              <button onClick={() => setEditingHariKhusus({ ...editingHariKhusus, waktu_istirahat: (editingHariKhusus.waktu_istirahat || []).filter((_, i) => i !== idx) })} className="text-red-600"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button onClick={() => { setShowJadwalKhususModal(false); setEditingHariKhusus(null); }} className="px-4 py-2 border rounded-lg">Batal</button>
              <button onClick={handleSimpanHariKhusus} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Aturan Penilaian */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
          Aturan Penilaian Sidang
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Rumus Penilaian Akhir
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Tentukan rumus perhitungan nilai akhir sidang menggunakan nilai dari 3 penguji.
              Gunakan variabel: <code className="bg-gray-100 px-2 py-1 rounded text-xs">p1</code> (Penguji 1), 
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">p2</code> (Penguji 2), 
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">p3</code> (Penguji 3)
            </p>
            
            {/* Formula Builder */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Nilai Akhir =</span>
                <input
                  type="text"
                  value={pengaturan.rumus_penilaian ?? ''}
                  onChange={(e) =>
                    setPengaturan({
                      ...pengaturan,
                      rumus_penilaian: e.target.value,
                    })
                  }
                  placeholder="Contoh: (p1 + p2 + p3) / 3"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent font-mono text-sm"
                />
              </div>
              
              {/* Quick Insert Buttons */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium text-gray-600 self-center">Sisipkan:</span>
                {['p1', 'p2', 'p3', '+', '-', '*', '/', '(', ')'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      const currentFormula = pengaturan.rumus_penilaian || '';
                      setPengaturan({
                        ...pengaturan,
                        rumus_penilaian: currentFormula + item,
                      });
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-mono transition-colors"
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setPengaturan((prev) => ({
                      ...prev,
                      rumus_penilaian: '',
                    }));
                  }}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded text-xs transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Formula Examples */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-900 mb-2">💡 Contoh Rumus:</p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setPengaturan({ ...pengaturan, rumus_penilaian: '(p1 + p2 + p3) / 3' })}
                    className="block w-full text-left px-3 py-2 bg-white hover:bg-blue-100 border border-blue-200 rounded text-xs transition-colors"
                  >
                    <code className="font-mono text-blue-900">(p1 + p2 + p3) / 3</code>
                    <span className="text-gray-600 ml-2">- Rata-rata sederhana</span>
                  </button>
                  <button
                    onClick={() => setPengaturan({ ...pengaturan, rumus_penilaian: '(p1 * 2 + p2 + p3) / 4' })}
                    className="block w-full text-left px-3 py-2 bg-white hover:bg-blue-100 border border-blue-200 rounded text-xs transition-colors"
                  >
                    <code className="font-mono text-blue-900">(p1 * 2 + p2 + p3) / 4</code>
                    <span className="text-gray-600 ml-2">- Penguji 1 bobot 2x</span>
                  </button>
                  <button
                    onClick={() => setPengaturan({ ...pengaturan, rumus_penilaian: '((p1 + p2) / 2 + p3) / 2' })}
                    className="block w-full text-left px-3 py-2 bg-white hover:bg-blue-100 border border-blue-200 rounded text-xs transition-colors"
                  >
                    <code className="font-mono text-blue-900">((p1 + p2) / 2 + p3) / 2</code>
                    <span className="text-gray-600 ml-2">- Rata-rata P1&P2, lalu rata-rata dengan P3</span>
                  </button>
                  <button
                    onClick={() => setPengaturan({ ...pengaturan, rumus_penilaian: '(p1 * 0.4 + p2 * 0.3 + p3 * 0.3)' })}
                    className="block w-full text-left px-3 py-2 bg-white hover:bg-blue-100 border border-blue-200 rounded text-xs transition-colors"
                  >
                    <code className="font-mono text-blue-900">(p1 * 0.4 + p2 * 0.3 + p3 * 0.3)</code>
                    <span className="text-gray-600 ml-2">- Bobot: P1=40%, P2=30%, P3=30%</span>
                  </button>
                </div>
              </div>

              {/* Formula Validation */}
              {(() => {
                const formula = pengaturan.rumus_penilaian || '';
                if (!formula) return null;
                
                try {
                  // Test formula dengan nilai dummy
                  const testFormula = formula
                    .replace(/p1/g, '80')
                    .replace(/p2/g, '85')
                    .replace(/p3/g, '90');
                  const result = eval(testFormula);
                  
                  if (isNaN(result) || !isFinite(result)) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-800">
                          ⚠️ Rumus menghasilkan nilai tidak valid
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-800">
                        ✓ Rumus valid! Contoh: jika p1=80, p2=85, p3=90 → Nilai Akhir = <strong>{result.toFixed(2)}</strong>
                      </p>
                    </div>
                  );
                } catch (error) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-800">
                        ❌ Rumus tidak valid. Periksa kembali sintaks rumus Anda.
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          {/* Toggle Tampilkan Rincian Nilai */}
          <div className="space-y-2 pt-4 border-t">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
              <div>
                <span className="block text-sm font-medium text-gray-700">
                  Tampilkan Rincian Penilaian ke Sekretaris
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  Jika aktif, sekretaris (pembimbing 1) dapat melihat rumus penilaian dan nilai minimal lolos saat input nilai sidang
                </span>
              </div>
              <div className="relative ml-4">
                <input
                  type="checkbox"
                  checked={pengaturan.tampilkan_rincian_nilai_ke_sekretaris ?? true}
                  onChange={(e) =>
                    setPengaturan({
                      ...pengaturan,
                      tampilkan_rincian_nilai_ke_sekretaris: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-900"></div>
              </div>
            </label>
          </div>

          {/* Nilai Minimal Lolos */}
          <div className="space-y-2 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700">
              Nilai Minimal Lolos Sidang
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={pengaturan.nilai_minimal_lolos ?? 60}
              onChange={(e) =>
                setPengaturan({
                  ...pengaturan,
                  nilai_minimal_lolos: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
            />
            <p className="text-sm text-gray-500">
              Mahasiswa dengan nilai akhir di bawah angka ini akan dinyatakan gagal sidang (gagal_sidang = true)
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Contoh:</span> Jika nilai minimal = 60, maka:
              </p>
              <ul className="text-xs text-amber-700 mt-1 ml-4 list-disc">
                <li>Nilai ≥ 60 → Mahasiswa <strong>LULUS</strong></li>
                <li>Nilai &lt; 60 → Mahasiswa <strong>GAGAL SIDANG</strong></li>
              </ul>
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
