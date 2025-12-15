'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import request from '@/lib/api';
import PeriodeGuard from '@/components/shared/PeriodeGuard';
import { usePeriodeStatus } from '@/hooks/usePeriodeStatus';
import {
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  AlertCircle,
  Eye,
  FileCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAturanValidasi } from '@/hooks/useAturanValidasi';

interface Dosen {
  id: number;
  user: { name: string };
}

interface Lampiran {
  id: number;
  file_path: string;
  file_name: string;
  created_at: string;
}

interface Catatan {
  id: number;
  catatan: string;
  created_at: string;
  author: { name: string };
}

interface BimbinganTA {
  id: number;
  dosen: Dosen;
  peran: string;
  sesi_ke: number;
  tanggal_bimbingan: string | null;
  jam_bimbingan: string | null;
  jam_selesai: string | null;
  status_bimbingan: string;
  lampiran: Lampiran[];
  catatan: Catatan[];
}

interface DokumenTA {
  id: number;
  file_path: string;
  divalidasi_oleh_p1: number | null;
  divalidasi_oleh_p2: number | null;
  created_at: string;
}

interface TugasAkhir {
  id: number;
  judul: string;
  judul_divalidasi_p1: boolean;
  judul_divalidasi_p2: boolean;
  mahasiswa: {
    user: { name: string; email: string };
    nim: string;
  };
  peranDosenTa: { peran: string; dosen: Dosen }[];
  bimbinganTa: BimbinganTA[];
  dokumenTa: DokumenTA[];
}

export default function DosenBimbinganPage() {
  const PEMBIMBING_1 = 'pembimbing1';
  const PEMBIMBING_2 = 'pembimbing2';

  const {
    aturan,
    getValidasiJudulMessage,
    getValidasiDrafMessage,
    isDrafValid,
  } = useAturanValidasi();
  const { user } = useAuth();
  const { status: periodeStatus, loading: periodeLoading } = usePeriodeStatus();
  const [mahasiswaList, setMahasiswaList] = useState<TugasAkhir[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<number>(0);
  const [selectedSesi, setSelectedSesi] = useState<number | null>(null);
  const [newCatatan, setNewCatatan] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await request<{ data: { data: TugasAkhir[] } }>(
        '/bimbingan/sebagai-dosen',
      );
      const data = response.data?.data?.data || [];

      setMahasiswaList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !periodeLoading && periodeStatus?.isActive) {
      fetchData();
    } else if (!periodeLoading) {
      setLoading(false);
    }
  }, [user, periodeLoading, periodeStatus?.isActive]);

  const handleValidasiJudul = async (tugasAkhirId: number) => {
    if (!confirm('Validasi judul tugas akhir ini?')) return;
    try {
      await request.post(`/tugas-akhir/${tugasAkhirId}/validasi-judul`, {});
      toast.success('Judul berhasil divalidasi');
      fetchData();
    } catch (error: unknown) {
      const errorMessage =
        (error as any)?.response?.data?.message || 'Gagal validasi judul';
      toast.error(errorMessage);
    }
  };

  const handleBatalkanValidasiJudul = async (tugasAkhirId: number) => {
    if (!confirm('Batalkan validasi judul tugas akhir ini?')) return;
    try {
      await request.post(
        `/tugas-akhir/${tugasAkhirId}/batalkan-validasi-judul`,
        {},
      );
      toast.success('Validasi judul berhasil dibatalkan');
      fetchData();
    } catch (error: unknown) {
      const errorMessage =
        (error as any)?.response?.data?.message ||
        'Gagal batalkan validasi judul';
      toast.error(errorMessage);
    }
  };

  const handleValidasiDraf = async (dokumenId: number) => {
    if (!confirm('Validasi draf tugas akhir ini?')) return;
    try {
      await request.post(`/dokumen-ta/${dokumenId}/validasi`, {});
      toast.success('Draf berhasil divalidasi');
      fetchData();
    } catch (error: unknown) {
      const errorMessage =
        (error as any)?.response?.data?.message || 'Gagal validasi draf';
      toast.error(errorMessage);
    }
  };

  const handleBatalkanValidasiDraf = async (dokumenId: number) => {
    if (!confirm('Batalkan validasi draf tugas akhir ini?')) return;
    try {
      await request.post(`/dokumen-ta/${dokumenId}/batalkan-validasi`, {});
      toast.success('Validasi draf berhasil dibatalkan');
      fetchData();
    } catch (error: unknown) {
      const errorMessage =
        (error as any)?.response?.data?.message ||
        'Gagal batalkan validasi draf';
      toast.error(errorMessage);
    }
  };

  const handleKonfirmasiSesi = async (sesiId: number) => {
    if (!confirm('Konfirmasi bahwa sesi bimbingan ini telah selesai?')) return;
    try {
      await request.post(`/bimbingan/sesi/${sesiId}/konfirmasi`, {});
      toast.success('Sesi bimbingan berhasil dikonfirmasi');
      fetchData();
    } catch {
      toast.error('Gagal konfirmasi sesi');
    }
  };

  const handleBatalkanValidasi = async (sesiId: number) => {
    if (!confirm('Batalkan validasi sesi bimbingan ini?')) return;
    try {
      await request.post(`/bimbingan/sesi/${sesiId}/batalkan-validasi`, {});
      toast.success('Validasi berhasil dibatalkan');
      fetchData();
    } catch {
      toast.error('Gagal batalkan validasi');
    }
  };

  const handleAddCatatan = async (sesiId: number) => {
    if (!newCatatan.trim()) return;
    try {
      await request.post('/bimbingan/catatan', {
        bimbingan_ta_id: sesiId,
        catatan: newCatatan,
      });
      setNewCatatan('');
      toast.success('Catatan berhasil ditambahkan');
      fetchData();
    } catch {
      toast.error('Gagal menambahkan catatan');
    }
  };

  const handleViewPdf = (filePath: string) => {
    const fileName = filePath.split('/').pop() || '';
    const url = `/uploads/dokumen-ta/${fileName}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="text-center p-8">Memuat...</div>;

  const currentDosenPeran =
    mahasiswaList[selectedMahasiswa]?.peranDosenTa.find(
      (p) => p.dosen.id === user?.dosen?.id,
    )?.peran || '';

  const tugasAkhir = mahasiswaList[selectedMahasiswa];

  // Cek apakah dosen boleh validasi berdasarkan aturan
  const canValidateJudul = () => {
    if (aturan.mode_validasi_judul === 'PEMBIMBING_1_SAJA') {
      return currentDosenPeran === PEMBIMBING_1;
    }
    return true; // SALAH_SATU atau KEDUA_PEMBIMBING, semua bisa validasi
  };

  const canValidateDraf = () => {
    if (aturan.mode_validasi_draf === 'PEMBIMBING_1_SAJA') {
      return currentDosenPeran === PEMBIMBING_1;
    }
    return true;
  };

  const isDrafValidatedByRule = tugasAkhir?.dokumenTa?.[0]
    ? isDrafValid(
        tugasAkhir.dokumenTa[0].divalidasi_oleh_p1,
        tugasAkhir.dokumenTa[0].divalidasi_oleh_p2,
      )
    : false;

  return (
    <PeriodeGuard>
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
              Mahasiswa Bimbingan
            </h1>

          {mahasiswaList.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-yellow-600" size={24} />
                <div>
                  <h3 className="font-bold text-yellow-800">
                    Belum Ada Mahasiswa Bimbingan
                  </h3>
                  <p className="text-yellow-700 text-sm">
                    Anda belum memiliki mahasiswa bimbingan saat ini
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">
                  Syarat Pendaftaran Sidang untuk Mahasiswa:
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    Minimal bimbingan valid sesuai aturan jurusan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    Draf TA divalidasi oleh kedua pembimbing
                  </li>
                </ul>
              </div>
            </div>
          ) : (
              <div className="flex gap-3 flex-wrap">
                {mahasiswaList.map((mhs, idx) => (
                  <button
                    key={mhs.id}
                    onClick={() => setSelectedMahasiswa(idx)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      selectedMahasiswa === idx
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedMahasiswa === idx ? 'bg-white' : 'bg-red-500'
                      }`} />
                      Mahasiswa {idx + 1}
                    </div>
                  </button>
                ))}
              </div>
          )}
          </div>

          {!!tugasAkhir && (
          <>
            {/* Komponen 1: Info Mahasiswa */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Bimbingan Tugas Akhir</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Nama:</span>{' '}
                      {tugasAkhir.mahasiswa.user.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">NIM:</span>{' '}
                      {tugasAkhir.mahasiswa.nim}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Email:</span>{' '}
                      {tugasAkhir.mahasiswa.user.email}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Judul:</span>{' '}
                  {tugasAkhir.judul}
                </p>
                <div className="flex gap-4">
                  {tugasAkhir.peranDosenTa.map((p) => (
                    <div key={p.peran} className="text-sm">
                      <span className="font-semibold">{p.peran}:</span>{' '}
                      {p.dosen.user.name}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-3">
                    Syarat Pendaftaran Sidang
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="text-blue-600" size={20} />
                      <span className="text-sm">
                        Bimbingan Valid:{' '}
                        <span className="font-bold">
                          {
                            tugasAkhir.bimbinganTa.filter(
                              (b) => b.status_bimbingan === 'selesai',
                            ).length
                          }{' '}
                          sesi
                        </span>{' '}
                        (Cek syarat di dashboard mahasiswa)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDrafValidatedByRule ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <XCircle className="text-red-600" size={20} />
                      )}
                      <span className="text-sm">
                        Validasi Draf Tugas Akhir:{' '}
                        <span className="font-bold">
                          {isDrafValidatedByRule ? 'Valid' : 'Belum Valid'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Komponen 2: Validasi Judul */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Judul Tugas Akhir</h2>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Aturan Validasi:</span>{' '}
                    {getValidasiJudulMessage()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {tugasAkhir.judul}
                  </p>

                  {aturan.mode_validasi_judul === 'KEDUA_PEMBIMBING' && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div
                        className={`p-3 rounded-lg border ${
                          tugasAkhir.judul_divalidasi_p1
                            ? 'bg-green-50 border-green-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tugasAkhir.judul_divalidasi_p1 ? (
                            <CheckCircle className="text-green-600" size={18} />
                          ) : (
                            <AlertCircle
                              className="text-yellow-600"
                              size={18}
                            />
                          )}
                          <span className="text-sm font-semibold">
                            {tugasAkhir.judul_divalidasi_p1
                              ? 'Divalidasi Pembimbing 1'
                              : 'Belum Divalidasi Pembimbing 1'}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`p-3 rounded-lg border ${
                          tugasAkhir.judul_divalidasi_p2
                            ? 'bg-green-50 border-green-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tugasAkhir.judul_divalidasi_p2 ? (
                            <CheckCircle className="text-green-600" size={18} />
                          ) : (
                            <AlertCircle
                              className="text-yellow-600"
                              size={18}
                            />
                          )}
                          <span className="text-sm font-semibold">
                            {tugasAkhir.judul_divalidasi_p2
                              ? 'Divalidasi Pembimbing 2'
                              : 'Belum Divalidasi Pembimbing 2'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!!(
                    (currentDosenPeran === PEMBIMBING_1 &&
                      tugasAkhir.judul_divalidasi_p1) ||
                    (currentDosenPeran === PEMBIMBING_2 &&
                      tugasAkhir.judul_divalidasi_p2)
                  ) && (
                    <div className="p-3 rounded-lg border bg-green-50 border-green-200 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-600" size={18} />
                        <span className="text-sm font-semibold text-green-800">
                          Anda telah memvalidasi judul ini
                        </span>
                      </div>
                    </div>
                  )}
                  {((currentDosenPeran === PEMBIMBING_1 &&
                    !tugasAkhir.judul_divalidasi_p1) ||
                    (currentDosenPeran === PEMBIMBING_2 &&
                      !tugasAkhir.judul_divalidasi_p2)) && (
                    <>
                      <button
                        onClick={() => handleValidasiJudul(tugasAkhir.id)}
                        disabled={!canValidateJudul()}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <FileCheck size={16} />
                        Validasi Judul
                      </button>
                      {!canValidateJudul() && (
                        <p className="text-xs text-red-600 mt-2">
                          Hanya Pembimbing 1 yang dapat memvalidasi judul sesuai
                          aturan saat ini
                        </p>
                      )}
                    </>
                  )}
                  {!!(
                    (currentDosenPeran === PEMBIMBING_1 &&
                      tugasAkhir.judul_divalidasi_p1) ||
                    (currentDosenPeran === PEMBIMBING_2 &&
                      tugasAkhir.judul_divalidasi_p2)
                  ) && (
                    <button
                      onClick={() => handleBatalkanValidasiJudul(tugasAkhir.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <XCircle size={16} />
                      Batalkan Validasi Judul
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Komponen 3: Draf TA */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Draf Tugas Akhir</h2>
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Aturan Validasi:</span>{' '}
                  {getValidasiDrafMessage()}
                </p>
              </div>
              {tugasAkhir.dokumenTa?.[0] ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="text-red-600" size={32} />
                      <div>
                        <p className="font-semibold">Draf TA (PDF)</p>
                        <p className="text-xs text-gray-500">
                          Diupload:{' '}
                          {new Date(
                            tugasAkhir.dokumenTa[0].created_at,
                          ).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleViewPdf(tugasAkhir.dokumenTa[0].file_path)
                        }
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        <Eye size={14} />
                        Lihat
                      </button>
                      {((currentDosenPeran === PEMBIMBING_1 &&
                        !tugasAkhir.dokumenTa[0].divalidasi_oleh_p1) ||
                        (currentDosenPeran === PEMBIMBING_2 &&
                          !tugasAkhir.dokumenTa[0].divalidasi_oleh_p2)) && (
                        <>
                          <button
                            onClick={() =>
                              handleValidasiDraf(tugasAkhir.dokumenTa[0].id)
                            }
                            disabled={!canValidateDraf()}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title={
                              !canValidateDraf()
                                ? 'Hanya Pembimbing 1 yang dapat memvalidasi draf'
                                : ''
                            }
                          >
                            <FileCheck size={14} />
                            Validasi
                          </button>
                          {!canValidateDraf() && (
                            <span className="text-xs text-red-600">
                              Hanya P1
                            </span>
                          )}
                        </>
                      )}
                      {!!(
                        (currentDosenPeran === PEMBIMBING_1 &&
                          tugasAkhir.dokumenTa[0].divalidasi_oleh_p1) ||
                        (currentDosenPeran === PEMBIMBING_2 &&
                          tugasAkhir.dokumenTa[0].divalidasi_oleh_p2)
                      ) && (
                        <button
                          onClick={() =>
                            handleBatalkanValidasiDraf(
                              tugasAkhir.dokumenTa[0].id,
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          <XCircle size={14} />
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div
                      className={`p-3 rounded-lg border ${
                        tugasAkhir.dokumenTa[0].divalidasi_oleh_p1
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {tugasAkhir.dokumenTa[0].divalidasi_oleh_p1 ? (
                          <CheckCircle className="text-green-600" size={18} />
                        ) : (
                          <AlertCircle className="text-yellow-600" size={18} />
                        )}
                        <span className="text-sm font-semibold">
                          {tugasAkhir.dokumenTa[0].divalidasi_oleh_p1
                            ? 'Divalidasi Pembimbing 1'
                            : 'Belum Divalidasi Pembimbing 1'}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`p-3 rounded-lg border ${
                        tugasAkhir.dokumenTa[0].divalidasi_oleh_p2
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {tugasAkhir.dokumenTa[0].divalidasi_oleh_p2 ? (
                          <CheckCircle className="text-green-600" size={18} />
                        ) : (
                          <AlertCircle className="text-yellow-600" size={18} />
                        )}
                        <span className="text-sm font-semibold">
                          {tugasAkhir.dokumenTa[0].divalidasi_oleh_p2
                            ? 'Divalidasi Pembimbing 2'
                            : 'Belum Divalidasi Pembimbing 2'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isDrafValidatedByRule ? (
                    <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-600" size={18} />
                        <span className="text-sm font-semibold text-green-800">
                          Draf telah divalidasi sesuai aturan
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="text-yellow-600" size={18} />
                        <span className="text-sm font-semibold text-yellow-800">
                          Draf belum divalidasi sesuai aturan
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500 mb-2">
                    Belum ada draf TA yang diupload
                  </p>
                  <p className="text-xs text-gray-400">
                    Mahasiswa belum mengupload draf Tugas Akhir
                  </p>
                </div>
              )}
            </div>

            {/* Komponen 4: Sesi Bimbingan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-purple-600" size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Daftar Sesi Bimbingan</h2>
              </div>
              <div className="space-y-4">
                {tugasAkhir.bimbinganTa.map((sesi) => (
                  <div
                    key={sesi.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    <div
                      className={`p-5 flex justify-between items-center cursor-pointer ${
                        sesi.status_bimbingan === 'selesai'
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500'
                          : sesi.tanggal_bimbingan
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500'
                          : 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-l-gray-400'
                      }`}
                      onClick={() =>
                        setSelectedSesi(
                          selectedSesi === sesi.id ? null : sesi.id,
                        )
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          sesi.status_bimbingan === 'selesai'
                            ? 'bg-green-500 shadow-lg'
                            : sesi.tanggal_bimbingan
                            ? 'bg-blue-500 shadow-lg'
                            : 'bg-gray-400'
                        }`}>
                          {sesi.status_bimbingan === 'selesai' ? (
                            <CheckCircle className="text-white" size={20} />
                          ) : sesi.tanggal_bimbingan ? (
                            <Calendar className="text-white" size={20} />
                          ) : (
                            <XCircle className="text-white" size={20} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Sesi #{sesi.sesi_ke}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sesi.peran === 'pembimbing1'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {sesi.peran === 'pembimbing1' ? 'Pembimbing 1' : 'Pembimbing 2'}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-1">
                            {sesi.tanggal_bimbingan
                              ? new Date(sesi.tanggal_bimbingan).toLocaleDateString('id-ID')
                              : 'Belum dijadwalkan'}
                            {!!sesi.jam_bimbingan && ` • ${sesi.jam_bimbingan}`}
                            {!!sesi.jam_selesai && ` - ${sesi.jam_selesai}`}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileText size={14} />
                              {sesi.lampiran.length} lampiran
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={14} />
                              {sesi.catatan.length} catatan
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sesi.status_bimbingan !== 'selesai' &&
                          !!sesi.tanggal_bimbingan &&
                          sesi.peran === currentDosenPeran && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKonfirmasiSesi(sesi.id);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              Validasi Sesi
                            </button>
                          )}
                        {sesi.status_bimbingan !== 'selesai' &&
                          !!sesi.tanggal_bimbingan &&
                          sesi.peran !== currentDosenPeran && (
                            <button
                              disabled
                              className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                              title={`Hanya ${sesi.peran === 'pembimbing1' ? 'Pembimbing 1' : 'Pembimbing 2'} yang dapat memvalidasi sesi ini`}
                            >
                              Tidak Dapat Validasi
                            </button>
                          )}
                        {sesi.status_bimbingan === 'selesai' &&
                          sesi.peran === currentDosenPeran && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBatalkanValidasi(sesi.id);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              Batalkan Validasi
                            </button>
                          )}
                      </div>
                    </div>

                    {selectedSesi === sesi.id && (
                      <div className="p-4 space-y-4 border-t">
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Calendar size={14} />
                            Jadwal
                          </h4>
                          <div className="text-sm text-gray-700">
                            {sesi.tanggal_bimbingan ? (
                              <>
                                <p>
                                  Tanggal:{' '}
                                  {new Date(
                                    sesi.tanggal_bimbingan,
                                  ).toLocaleDateString('id-ID')}
                                </p>
                                <p>
                                  Waktu: {sesi.jam_bimbingan || '-'} -{' '}
                                  {sesi.jam_selesai || '-'}
                                </p>
                              </>
                            ) : (
                              <p className="text-gray-500 italic">
                                Belum dijadwalkan
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <FileText size={14} />
                            Lampiran ({sesi.lampiran.length})
                          </h4>
                          {sesi.lampiran.length > 0 ? (
                            <div className="space-y-1">
                              {sesi.lampiran.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs"
                                >
                                  <span className="truncate">
                                    {file.file_name}
                                  </span>
                                  <span className="text-gray-500">
                                    {new Date(
                                      file.created_at,
                                    ).toLocaleDateString('id-ID')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">
                              Belum ada lampiran
                            </p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <MessageSquare size={14} />
                            Catatan
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
                            {sesi.catatan.length > 0 ? (
                              sesi.catatan.map((note) => (
                                <div
                                  key={note.id}
                                  className="bg-gray-50 p-2 rounded text-xs"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold">
                                      {note.author.name}
                                    </span>
                                    <span className="text-gray-500">
                                      {new Date(note.created_at).toLocaleString(
                                        'id-ID',
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">
                                    {note.catatan}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-gray-500 italic">
                                Belum ada catatan
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCatatan}
                              onChange={(e) => setNewCatatan(e.target.value)}
                              placeholder="Tambah catatan..."
                              className="flex-1 border rounded px-2 py-1 text-xs"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddCatatan(sesi.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddCatatan(sesi.id)}
                              disabled={!newCatatan.trim()}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              Kirim
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </PeriodeGuard>
  );
}
