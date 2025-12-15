'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PeriodeGuard from '@/components/shared/PeriodeGuard';
import TAGuard from '@/components/shared/TAGuard';
import {
  useCreateSesi,
  useDeleteSesi,
  useSetJadwalSesi,
  useUploadLampiran,
  useAddCatatan,
  useCheckEligibility,
} from '@/hooks/useBimbingan';
import request from '@/lib/api';
import { useAturanValidasi } from '@/hooks/useAturanValidasi';
import {
  Calendar,
  Upload,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Eye,
  AlertCircle,
} from 'lucide-react';

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
  peranDosenTa: { peran: string; dosen: Dosen }[];
  bimbinganTa: BimbinganTA[];
  dokumenTa: DokumenTA[];
}

function useBimbinganData() {
  const { user } = useAuth();
  const [tugasAkhir, setTugasAkhir] = useState<TugasAkhir | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await request<{ data: TugasAkhir | null }>(
        '/bimbingan/sebagai-mahasiswa',
      );
      setTugasAkhir(response.data?.data || null);
    } catch (err) {
      console.error(err);
      setTugasAkhir(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  return { tugasAkhir, loading, fetchData };
}

export default function BimbinganPage() {
  const PEMBIMBING_1 = 'pembimbing1';
  const PEMBIMBING_2 = 'pembimbing2';
  const BORDER_GREEN_200 = 'border-green-200';
  const BG_GREEN_50 = 'bg-green-50';
  const BG_AMBER_50 = 'bg-amber-50';
  const BORDER_AMBER_200 = 'border-amber-200';
  const BG_GREEN_100_TEXT_GREEN_800 = 'bg-green-100 text-green-800';
  const BG_AMBER_100_TEXT_AMBER_800 = 'bg-amber-100 text-amber-800';

  const { tugasAkhir, loading, fetchData } = useBimbinganData();
  const {
    getValidasiJudulMessage,
    getValidasiDrafMessage,
    isJudulValid,
    isDrafValid,
  } = useAturanValidasi();
  const [selectedSesi, setSelectedSesi] = useState<number | null>(null);
  const [newCatatan, setNewCatatan] = useState('');
  const [uploadingDraf, setUploadingDraf] = useState(false);
  const [showPembimbingModal, setShowPembimbingModal] = useState(false);

  const createSesiMutation = useCreateSesi();
  const deleteSesiMutation = useDeleteSesi();
  const setJadwalMutation = useSetJadwalSesi();
  const uploadMutation = useUploadLampiran();
  const addCatatanMutation = useAddCatatan();

  const { data: eligibilityData } = useCheckEligibility(tugasAkhir?.id || 0);

  const handleCreateSesi = (pembimbingPeran: 'pembimbing1' | 'pembimbing2') => {
    if (!tugasAkhir) return;
    createSesiMutation.mutate(
      { tugasAkhirId: tugasAkhir.id, pembimbingPeran },
      {
        onSuccess: () => {
          fetchData();
          setShowPembimbingModal(false);
        },
      },
    );
  };

  const handleDeleteSesi = (sesiId: number) => {
    if (!confirm('Hapus sesi bimbingan ini?')) return;
    deleteSesiMutation.mutate(sesiId, {
      onSuccess: () => fetchData(),
    });
  };

  const handleSetJadwal = (
    sesiId: number,
    tanggal: string,
    jamMulai: string,
    jamSelesai: string,
  ) => {
    setJadwalMutation.mutate(
      {
        bimbinganId: sesiId,
        tanggal_bimbingan: tanggal,
        jam_bimbingan: jamMulai,
        jam_selesai: jamSelesai,
      },
      {
        onSuccess: () => {
          fetchData();
          alert('Jadwal bimbingan berhasil disimpan');
        },
      },
    );
  };

  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    sesiId: number,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    uploadMutation.mutate(
      { bimbinganId: sesiId, files },
      {
        onSuccess: () => {
          fetchData();
          e.target.value = '';
        },
      },
    );
  };

  const validateDrafFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Hanya file PDF yang diperbolehkan');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB');
      return false;
    }
    return true;
  };

  const uploadDrafToServer = async (file: File, taId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/dokumen-ta/${taId}/upload`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );
    if (!response.ok) throw new Error('Upload gagal');
  };

  const handleUploadDraf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tugasAkhir) return;
    if (!validateDrafFile(file)) return;

    try {
      setUploadingDraf(true);
      await uploadDrafToServer(file, tugasAkhir.id);
      alert('Draf TA berhasil diupload');
      fetchData();
      e.target.value = '';
    } catch {
      alert('Gagal upload draf TA');
    } finally {
      setUploadingDraf(false);
    }
  };

  const handleAddCatatan = (sesiId: number) => {
    if (!newCatatan.trim()) return;
    addCatatanMutation.mutate(
      { bimbingan_ta_id: sesiId, catatan: newCatatan },
      {
        onSuccess: () => {
          setNewCatatan('');
          fetchData();
        },
      },
    );
  };

  const handleViewPdf = (filePath: string) => {
    const fileName = filePath.split('/').pop() || '';
    const url = `/uploads/dokumen-ta/${fileName}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <PeriodeGuard>
        <div className="text-center p-8">Memuat...</div>
      </PeriodeGuard>
    );
  }

  if (!tugasAkhir) {
    return (
      <PeriodeGuard>
        <TAGuard requirePembimbing>
          <div />
        </TAGuard>
      </PeriodeGuard>
    );
  }

  const isJudulValidated = isJudulValid(
    tugasAkhir.judul_divalidasi_p1,
    tugasAkhir.judul_divalidasi_p2,
  );

  const validBimbinganCount = tugasAkhir.bimbinganTa.filter(
    (b) => b.status_bimbingan === 'selesai',
  ).length;

  const latestDokumen = tugasAkhir.dokumenTa[0];
  const isDrafValidatedP1 = !!latestDokumen?.divalidasi_oleh_p1;
  const isDrafValidatedP2 = !!latestDokumen?.divalidasi_oleh_p2;
  const isDrafValidatedByRule = latestDokumen
    ? isDrafValid(
        latestDokumen.divalidasi_oleh_p1,
        latestDokumen.divalidasi_oleh_p2,
      )
    : false;

  const minBimbingan = eligibilityData?.data?.minRequired || 0;
  const allSesi = tugasAkhir.bimbinganTa.sort((a, b) => a.sesi_ke - b.sesi_ke);

  return (
    <PeriodeGuard>
      <TAGuard requirePembimbing>
        <div className="bg-gray-50 px-2 py-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-base border p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-2">
                Bimbingan Tugas Akhir
              </h1>
              <p className="text-gray-500">
                Kelola proses bimbingan dan dokumen tugas akhir Anda
              </p>
            </div>

            {/* Komponen 1: Rangkuman Bimbingan */}
            <div className="bg-white rounded-xl shadow-base border">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#7f1d1d]" />
                  <h2 className="text-xl font-semibold text-gray-700">
                    Informasi Tugas Akhir
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-700 mb-2">
                      Judul Tugas Akhir
                    </h3>
                    <p className="text-gray-800">{tugasAkhir.judul}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {tugasAkhir.peranDosenTa.map((p) => (
                      <div
                        key={p.peran}
                        className="bg-white border rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#7f1d1d] rounded-lg flex items-center justify-center text-white font-bold">
                            {p.dosen.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">
                              {p.peran === 'pembimbing1'
                                ? 'Pembimbing 1'
                                : 'Pembimbing 2'}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {p.dosen.user.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-[#7f1d1d]" />
                      <h3 className="font-medium text-gray-700">
                        Syarat Pendaftaran Sidang
                      </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div
                        className={`p-3 rounded-lg border ${
                          validBimbinganCount >=
                          (eligibilityData?.data?.minRequired || 0)
                            ? `${BG_GREEN_50} ${BORDER_GREEN_200}`
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {validBimbinganCount >=
                          (eligibilityData?.data?.minRequired || 0) ? (
                            <CheckCircle className="text-green-600" size={16} />
                          ) : (
                            <XCircle className="text-red-600" size={16} />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              Bimbingan Valid
                            </p>
                            <p className="text-xs text-gray-600">
                              {validBimbinganCount}/
                              {eligibilityData?.data?.minRequired || 0} sesi
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-lg border ${
                          isDrafValidatedByRule
                            ? `${BG_GREEN_50} ${BORDER_GREEN_200}`
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isDrafValidatedByRule ? (
                            <CheckCircle className="text-green-600" size={16} />
                          ) : (
                            <XCircle className="text-red-600" size={16} />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              Validasi Draf TA
                            </p>
                            <p className="text-xs text-gray-600">
                              {isDrafValidatedByRule
                                ? 'Sudah Valid'
                                : 'Belum Valid'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!!eligibilityData?.data &&
                      !eligibilityData.data.eligible && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="text-amber-600" size={16} />
                            <p className="text-xs text-amber-800">
                              {eligibilityData.data.message}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Komponen 2: Validasi Judul Tugas Akhir */}
            <div className="bg-white rounded-xl shadow-base border">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#7f1d1d]" />
                  <h2 className="text-xl font-semibold text-gray-700">
                    Validasi Judul
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="text-blue-600" size={16} />
                      <span className="font-medium text-blue-900 text-sm">
                        Aturan Validasi
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">
                      {getValidasiJudulMessage()}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div
                      className={`p-4 rounded-lg border ${
                        tugasAkhir.judul_divalidasi_p1
                          ? `${BG_GREEN_50} ${BORDER_GREEN_200}`
                          : `${BG_AMBER_50} ${BORDER_AMBER_200}`
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {tugasAkhir.judul_divalidasi_p1 ? (
                          <CheckCircle className="text-green-600" size={16} />
                        ) : (
                          <AlertCircle className="text-amber-600" size={16} />
                        )}
                        <div>
                          <p className="font-medium text-gray-800 text-sm">
                            Pembimbing 1
                          </p>
                          <p className="text-xs text-gray-600">
                            {tugasAkhir.peranDosenTa.find(
                              (p) => p.peran === PEMBIMBING_1,
                            )?.dosen.user.name || '-'}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-center text-xs font-medium ${
                          tugasAkhir.judul_divalidasi_p1
                            ? BG_GREEN_100_TEXT_GREEN_800
                            : BG_AMBER_100_TEXT_AMBER_800
                        }`}
                      >
                        {tugasAkhir.judul_divalidasi_p1
                          ? 'Sudah Divalidasi'
                          : 'Menunggu Validasi'}
                      </div>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        tugasAkhir.judul_divalidasi_p2
                          ? `${BG_GREEN_50} ${BORDER_GREEN_200}`
                          : `${BG_AMBER_50} ${BORDER_AMBER_200}`
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {tugasAkhir.judul_divalidasi_p2 ? (
                          <CheckCircle className="text-green-600" size={16} />
                        ) : (
                          <AlertCircle className="text-amber-600" size={16} />
                        )}
                        <div>
                          <p className="font-medium text-gray-800 text-sm">
                            Pembimbing 2
                          </p>
                          <p className="text-xs text-gray-600">
                            {tugasAkhir.peranDosenTa.find(
                              (p) => p.peran === PEMBIMBING_2,
                            )?.dosen.user.name || '-'}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-center text-xs font-medium ${
                          tugasAkhir.judul_divalidasi_p2
                            ? BG_GREEN_100_TEXT_GREEN_800
                            : BG_AMBER_100_TEXT_AMBER_800
                        }`}
                      >
                        {tugasAkhir.judul_divalidasi_p2
                          ? 'Sudah Divalidasi'
                          : 'Menunggu Validasi'}
                      </div>
                    </div>
                  </div>

                  {isJudulValidated ? (
                    <div
                      className={`p-3 rounded-lg ${BG_GREEN_50} border ${BORDER_GREEN_200}`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-600" size={16} />
                        <span className="text-sm font-medium text-green-800">
                          Judul telah divalidasi sesuai aturan
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="text-red-600" size={16} />
                        <span className="text-sm font-medium text-red-800">
                          Menunggu validasi judul sesuai aturan sebelum dapat
                          melanjutkan
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Komponen 3: Draf Tugas Akhir */}
            <div
              className={`bg-white rounded-xl shadow-base border ${
                !isJudulValidated ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#7f1d1d]" />
                  <h2 className="text-xl font-semibold text-gray-700">
                    Draf Tugas Akhir
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="text-blue-600" size={16} />
                    <span className="font-medium text-blue-900 text-sm">
                      Aturan Validasi
                    </span>
                  </div>
                  <p className="text-blue-800 text-sm">
                    {getValidasiDrafMessage()}
                  </p>
                </div>
                {latestDokumen ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="text-[#7f1d1d]" size={20} />
                        <div>
                          <p className="font-medium text-sm">Draf TA (PDF)</p>
                          <p className="text-xs text-gray-500">
                            Diupload:{' '}
                            {new Date(
                              latestDokumen.created_at,
                            ).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewPdf(latestDokumen.file_path)}
                        className="flex items-center gap-2 px-3 py-2 bg-[#7f1d1d] text-white rounded-lg hover:bg-[#991b1b] text-sm"
                      >
                        <Eye size={14} />
                        Lihat PDF
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-3 rounded-lg border ${
                          isDrafValidatedP1
                            ? `${BG_GREEN_50} ${BORDER_GREEN_200}`
                            : `${BG_AMBER_50} ${BORDER_AMBER_200}`
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isDrafValidatedP1 ? (
                            <CheckCircle className="text-green-600" size={14} />
                          ) : (
                            <AlertCircle className="text-amber-600" size={14} />
                          )}
                          <span className="text-xs font-medium">
                            {isDrafValidatedP1
                              ? 'Divalidasi P1'
                              : 'Belum Divalidasi P1'}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`p-3 rounded-lg border ${
                          isDrafValidatedP2
                            ? `${BG_GREEN_50} ${BORDER_GREEN_200}`
                            : `${BG_AMBER_50} ${BORDER_AMBER_200}`
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isDrafValidatedP2 ? (
                            <CheckCircle className="text-green-600" size={14} />
                          ) : (
                            <AlertCircle className="text-amber-600" size={14} />
                          )}
                          <span className="text-xs font-medium">
                            {isDrafValidatedP2
                              ? 'Divalidasi P2'
                              : 'Belum Divalidasi P2'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isDrafValidatedByRule ? (
                      <div
                        className={`p-3 rounded-lg ${BG_GREEN_50} border ${BORDER_GREEN_200}`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-600" size={16} />
                          <span className="text-sm font-medium text-green-800">
                            Draf telah divalidasi sesuai aturan
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`p-3 ${BG_AMBER_50} border ${BORDER_AMBER_200} rounded-lg`}
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="text-amber-600" size={16} />
                          <span className="text-sm font-medium text-amber-800">
                            Draf belum divalidasi sesuai aturan
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText
                      className="mx-auto text-gray-400 mb-2"
                      size={32}
                    />
                    <p className="text-gray-500 text-sm">
                      Belum ada draf TA yang diupload
                    </p>
                  </div>
                )}

                <label
                  className={`mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#7f1d1d] text-white rounded-lg hover:bg-[#991b1b] font-medium text-sm transition-colors ${
                    !isJudulValidated
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                  }`}
                >
                  <Upload size={16} />
                  {uploadingDraf ? 'Mengupload...' : 'Upload Draf TA (PDF)'}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleUploadDraf}
                    disabled={uploadingDraf || !isJudulValidated}
                  />
                </label>
              </div>
            </div>

            {/* Komponen 4: Daftar Sesi Bimbingan */}
            <div
              className={`bg-white rounded-xl shadow-base border ${
                !isJudulValidated ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-[#7f1d1d]" />
                    <h2 className="text-xl font-semibold text-gray-700">
                      Daftar Sesi Bimbingan
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowPembimbingModal(true)}
                    disabled={createSesiMutation.isPending || !isJudulValidated}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7f1d1d] text-white rounded-lg hover:bg-[#991b1b] font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                    Tambah Sesi
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {allSesi.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="mx-auto mb-2" size={32} />
                      <p>Belum ada sesi bimbingan. Klik "Tambah Sesi" untuk memulai.</p>
                    </div>
                  ) : (
                    allSesi.map((sesi) => (
                    <div
                      key={sesi.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div
                        className={`p-4 flex justify-between items-center cursor-pointer ${
                          sesi.status_bimbingan === 'selesai'
                            ? 'bg-green-50 hover:bg-green-100'
                            : sesi.status_bimbingan === 'dijadwalkan'
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() =>
                          setSelectedSesi(
                            selectedSesi === sesi.id ? null : sesi.id,
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              sesi.status_bimbingan === 'selesai'
                                ? 'bg-green-600'
                                : sesi.status_bimbingan === 'dijadwalkan'
                                ? 'bg-blue-600'
                                : 'bg-gray-400'
                            }`}
                          >
                            {sesi.status_bimbingan === 'selesai' ? (
                              <CheckCircle className="text-white" size={16} />
                            ) : sesi.status_bimbingan === 'dijadwalkan' ? (
                              <Calendar className="text-white" size={16} />
                            ) : (
                              <XCircle className="text-white" size={16} />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">
                              Sesi Bimbingan #{sesi.sesi_ke}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {sesi.tanggal_bimbingan
                                ? new Date(
                                    sesi.tanggal_bimbingan,
                                  ).toLocaleDateString('id-ID')
                                : 'Belum dijadwalkan'}
                              {!!sesi.jam_bimbingan &&
                                ` • ${sesi.jam_bimbingan}`}
                              {!!sesi.jam_selesai && ` - ${sesi.jam_selesai}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              sesi.status_bimbingan === 'selesai'
                                ? BG_GREEN_100_TEXT_GREEN_800
                                : sesi.status_bimbingan === 'dijadwalkan'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sesi.status_bimbingan === 'selesai'
                              ? `Selesai dengan ${sesi.peran}`
                              : sesi.status_bimbingan === 'dijadwalkan'
                              ? `Dijadwalkan dengan ${sesi.peran}`
                              : 'Belum Dijadwalkan'}
                          </span>
                          {sesi.status_bimbingan !== 'selesai' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSesi(sesi.id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedSesi === sesi.id && (
                        <div className="p-4 space-y-4 border-t bg-gray-50">
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                              <Calendar size={14} />
                              Jadwal Bimbingan
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="date"
                                defaultValue={
                                  sesi.tanggal_bimbingan
                                    ? new Date(sesi.tanggal_bimbingan)
                                        .toISOString()
                                        .split('T')[0]
                                    : ''
                                }
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#7f1d1d] focus:ring-1 focus:ring-[#7f1d1d]"
                                id={`tanggal-${sesi.id}`}
                              />
                              <input
                                type="time"
                                defaultValue={sesi.jam_bimbingan || ''}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#7f1d1d] focus:ring-1 focus:ring-[#7f1d1d]"
                                id={`jam-mulai-${sesi.id}`}
                              />
                              <input
                                type="time"
                                defaultValue={sesi.jam_selesai || ''}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#7f1d1d] focus:ring-1 focus:ring-[#7f1d1d]"
                                id={`jam-selesai-${sesi.id}`}
                              />
                            </div>
                            <button
                              onClick={() => {
                                const inputTanggal = document.getElementById(
                                  `tanggal-${sesi.id}`,
                                ) as HTMLInputElement;
                                const inputJamMulai = document.getElementById(
                                  `jam-mulai-${sesi.id}`,
                                ) as HTMLInputElement;
                                const inputJamSelesai = document.getElementById(
                                  `jam-selesai-${sesi.id}`,
                                ) as HTMLInputElement;

                                const tanggal = inputTanggal.value;
                                const jamMulai = inputJamMulai.value;
                                const jamSelesai = inputJamSelesai.value;

                                if (tanggal && jamMulai && jamSelesai) {
                                  handleSetJadwal(
                                    sesi.id,
                                    tanggal,
                                    jamMulai,
                                    jamSelesai,
                                  );
                                }
                              }}
                              className="mt-2 px-3 py-2 bg-[#7f1d1d] text-white rounded-lg text-sm hover:bg-[#991b1b]"
                            >
                              Simpan Jadwal
                            </button>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                              <FileText size={14} />
                              Lampiran
                            </h4>
                            <div className="space-y-2">
                              {sesi.lampiran.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between bg-white p-2 rounded border text-sm"
                                >
                                  <span className="truncate">
                                    {file.file_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(
                                      file.created_at,
                                    ).toLocaleDateString('id-ID')}
                                  </span>
                                </div>
                              ))}
                              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border rounded-lg text-sm">
                                <Upload size={12} />
                                Upload File
                                <input
                                  type="file"
                                  multiple
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => handleUpload(e, sesi.id)}
                                />
                              </label>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                              <MessageSquare size={14} />
                              Catatan
                            </h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                              {sesi.catatan.map((note) => (
                                <div
                                  key={note.id}
                                  className="bg-white p-3 rounded border text-sm"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-xs">
                                      {note.author.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(note.created_at).toLocaleString(
                                        'id-ID',
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-sm">
                                    {note.catatan}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newCatatan}
                                onChange={(e) => setNewCatatan(e.target.value)}
                                placeholder="Tulis catatan..."
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#7f1d1d] focus:ring-1 focus:ring-[#7f1d1d]"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddCatatan(sesi.id);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleAddCatatan(sesi.id)}
                                disabled={!newCatatan.trim()}
                                className="px-3 py-2 bg-[#7f1d1d] text-white rounded-lg text-sm hover:bg-[#991b1b] disabled:bg-gray-400"
                              >
                                Kirim
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Pilih Pembimbing */}
            {showPembimbingModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Pilih Pembimbing</h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    Pilih pembimbing yang akan melakukan bimbingan pada sesi ini:
                  </p>
                  <div className="space-y-3">
                    {tugasAkhir.peranDosenTa.map((p) => (
                      <button
                        key={p.peran}
                        onClick={() => handleCreateSesi(p.peran as 'pembimbing1' | 'pembimbing2')}
                        disabled={createSesiMutation.isPending}
                        className="w-full p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#7f1d1d] rounded-lg flex items-center justify-center text-white font-bold">
                            {p.dosen.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {p.peran === 'pembimbing1' ? 'Pembimbing 1' : 'Pembimbing 2'}
                            </p>
                            <p className="text-sm text-gray-600">{p.dosen.user.name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowPembimbingModal(false)}
                      disabled={createSesiMutation.isPending}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </TAGuard>
    </PeriodeGuard>
  );
}
