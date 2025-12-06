'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PeriodeGuard from '@/components/shared/PeriodeGuard';
import {
  useCreateSesi,
  useDeleteSesi,
  useSetJadwalSesi,
  useUploadLampiran,
  useAddCatatan,
  useCheckEligibility,
} from '@/hooks/useBimbingan';
import request from '@/lib/api';
import {
  Calendar,
  Upload,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  AlertCircle,
  Eye,
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

export default function BimbinganPage() {
  const { user } = useAuth();
  const [tugasAkhir, setTugasAkhir] = useState<TugasAkhir | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSesi, setSelectedSesi] = useState<number | null>(null);
  const [newCatatan, setNewCatatan] = useState('');
  const [uploadingDraf, setUploadingDraf] = useState(false);

  const createSesiMutation = useCreateSesi();
  const deleteSesiMutation = useDeleteSesi();
  const setJadwalMutation = useSetJadwalSesi();
  const uploadMutation = useUploadLampiran();
  const addCatatanMutation = useAddCatatan();

  const { data: eligibilityData } = useCheckEligibility(tugasAkhir?.id || 0);

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

  const handleCreateSesi = () => {
    if (!tugasAkhir) return;
    createSesiMutation.mutate(tugasAkhir.id, {
      onSuccess: () => fetchData(),
    });
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
        onSuccess: () => fetchData(),
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

  const handleUploadDraf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tugasAkhir) return;

    if (file.type !== 'application/pdf') {
      alert('Hanya file PDF yang diperbolehkan');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB');
      return;
    }

    try {
      setUploadingDraf(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dokumen-ta/${tugasAkhir.id}/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) throw new Error('Upload gagal');

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

  if (!tugasAkhir || tugasAkhir.peranDosenTa.length === 0) {
    return (
      <PeriodeGuard>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600" size={24} />
            <div>
              <h3 className="font-bold text-yellow-800">
                Belum Memiliki Pembimbing
              </h3>
              <p className="text-yellow-700 text-sm">
                Anda belum memiliki pembimbing. Silakan ajukan pembimbing
                terlebih dahulu.
              </p>
            </div>
          </div>
        </div>
      </PeriodeGuard>
    );
  }

  const isJudulValidated =
    tugasAkhir.judul_divalidasi_p1 || tugasAkhir.judul_divalidasi_p2;
  const judulValidatedBy = tugasAkhir.judul_divalidasi_p1
    ? 'Pembimbing 1'
    : tugasAkhir.judul_divalidasi_p2
      ? 'Pembimbing 2'
      : null;

  const validBimbinganCount = tugasAkhir.bimbinganTa.filter(
    (b) => b.status_bimbingan === 'selesai',
  ).length;

  const latestDokumen = tugasAkhir.dokumenTa[0];
  const isDrafValidatedP1 = !!latestDokumen?.divalidasi_oleh_p1;
  const isDrafValidatedP2 = !!latestDokumen?.divalidasi_oleh_p2;

  const allSesi = Array.from({ length: 9 }, (_, i) => {
    const existingSesi = tugasAkhir.bimbinganTa.find(
      (s) => s.sesi_ke === i + 1,
    );
    return (
      existingSesi || {
        id: -(i + 1),
        sesi_ke: i + 1,
        tanggal_bimbingan: null,
        jam_bimbingan: null,
        jam_selesai: null,
        status_bimbingan: 'belum',
        peran: '',
        lampiran: [],
        catatan: [],
        dosen: { id: 0, user: { name: '' } },
      }
    );
  });

  return (
    <PeriodeGuard>
      <div className="space-y-6">
        {/* Komponen 1: Rangkuman Bimbingan */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Bimbingan Tugas Akhir</h1>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Judul:</span> {tugasAkhir.judul}
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
                  {validBimbinganCount >=
                  (eligibilityData?.data?.minRequired || 9) ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <span className="text-sm">
                    Minimal {eligibilityData?.data?.minRequired || 9} Bimbingan
                    Valid:{' '}
                    <span className="font-bold">
                      {validBimbinganCount}/
                      {eligibilityData?.data?.minRequired || 9}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isDrafValidatedP1 && isDrafValidatedP2 ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <span className="text-sm">
                    Validasi Draf Tugas Akhir:{' '}
                    <span className="font-bold">
                      {isDrafValidatedP1 && isDrafValidatedP2
                        ? 'Lengkap'
                        : 'Belum Lengkap'}
                    </span>
                  </span>
                </div>
              </div>
              {!!eligibilityData?.data && !eligibilityData.data.eligible && (
                <p className="text-xs text-blue-700 mt-3 p-2 bg-blue-100 rounded">
                  {eligibilityData.data.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Komponen 2: Validasi Judul Tugas Akhir */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Judul Tugas Akhir</h2>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {tugasAkhir.judul}
            </p>
            {isJudulValidated ? (
              <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={18} />
                  <span className="text-sm font-semibold text-green-800">
                    Judul telah divalidasi oleh {judulValidatedBy}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-yellow-600" size={18} />
                    <span className="text-sm font-semibold text-yellow-800">
                      Menunggu validasi judul dari pembimbing
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <AlertCircle className="inline mr-2" size={16} />
                    Judul harus divalidasi oleh salah satu pembimbing sebelum
                    dapat melanjutkan ke tahap berikutnya
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Komponen 3: Draf Tugas Akhir */}
        <div
          className={`bg-white p-6 rounded-lg shadow ${!isJudulValidated ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <h2 className="text-xl font-bold mb-4">Draf Tugas Akhir</h2>
          {latestDokumen ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileText className="text-red-600" size={32} />
                  <div>
                    <p className="font-semibold">Draf TA (PDF)</p>
                    <p className="text-xs text-gray-500">
                      Diupload:{' '}
                      {new Date(latestDokumen.created_at).toLocaleDateString(
                        'id-ID',
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleViewPdf(latestDokumen.file_path)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Eye size={16} />
                  Lihat PDF
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-lg border ${
                    isDrafValidatedP1
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isDrafValidatedP1 ? (
                      <CheckCircle className="text-green-600" size={18} />
                    ) : (
                      <AlertCircle className="text-yellow-600" size={18} />
                    )}
                    <span className="text-sm font-semibold">
                      {isDrafValidatedP1
                        ? 'Divalidasi Pembimbing 1'
                        : 'Belum Divalidasi Pembimbing 1'}
                    </span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg border ${
                    isDrafValidatedP2
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isDrafValidatedP2 ? (
                      <CheckCircle className="text-green-600" size={18} />
                    ) : (
                      <AlertCircle className="text-yellow-600" size={18} />
                    )}
                    <span className="text-sm font-semibold">
                      {isDrafValidatedP2
                        ? 'Divalidasi Pembimbing 2'
                        : 'Belum Divalidasi Pembimbing 2'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500 mb-4">
                Belum ada draf TA yang diupload
              </p>
            </div>
          )}

          <label
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900 ${
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

        {/* Komponen 4: Daftar Sesi Bimbingan */}
        <div
          className={`bg-white p-6 rounded-lg shadow ${
            !isJudulValidated ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Daftar Sesi Bimbingan</h2>
            <button
              onClick={handleCreateSesi}
              disabled={createSesiMutation.isPending || !isJudulValidated}
              className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900 disabled:bg-gray-400"
            >
              <Plus size={16} />
              Tambah Sesi
            </button>
          </div>

          <div className="space-y-4">
            {allSesi.map((sesi) => (
              <div key={sesi.id} className="bg-white rounded-lg shadow border">
                <div
                  className={`p-4 flex justify-between items-center cursor-pointer ${
                    sesi.status_bimbingan === 'selesai'
                      ? 'bg-green-50'
                      : 'bg-gray-50'
                  }`}
                  onClick={() =>
                    setSelectedSesi(selectedSesi === sesi.id ? null : sesi.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    {sesi.status_bimbingan === 'selesai' ? (
                      <CheckCircle className="text-green-600" size={24} />
                    ) : (
                      <XCircle className="text-gray-400" size={24} />
                    )}
                    <div>
                      <h3 className="font-bold">
                        Sesi Bimbingan #{sesi.sesi_ke}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {sesi.tanggal_bimbingan
                          ? new Date(sesi.tanggal_bimbingan).toLocaleDateString(
                              'id-ID',
                            )
                          : 'Belum dijadwalkan'}
                        {!!sesi.jam_bimbingan && ` • ${sesi.jam_bimbingan}`}
                        {!!sesi.jam_selesai && ` - ${sesi.jam_selesai}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        sesi.status_bimbingan === 'selesai'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {sesi.status_bimbingan === 'selesai'
                        ? `Bimbingan ke-${sesi.sesi_ke} telah dilakukan dengan ${sesi.peran}`
                        : 'Belum Dijadwalkan'}
                    </span>
                    {sesi.status_bimbingan !== 'selesai' && sesi.id > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSesi(sesi.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {selectedSesi === sesi.id && sesi.id > 0 && (
                  <div className="p-4 space-y-4 border-t">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar size={16} />
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
                          className="border rounded px-3 py-2 text-sm"
                          id={`tanggal-${sesi.id}`}
                        />
                        <input
                          type="time"
                          defaultValue={sesi.jam_bimbingan || ''}
                          className="border rounded px-3 py-2 text-sm"
                          id={`jam-mulai-${sesi.id}`}
                        />
                        <input
                          type="time"
                          defaultValue={sesi.jam_selesai || ''}
                          className="border rounded px-3 py-2 text-sm"
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
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Simpan Jadwal
                      </button>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText size={16} />
                        Lampiran
                      </h4>
                      <div className="space-y-2">
                        {sesi.lampiran.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                          >
                            <span className="truncate">{file.file_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(file.created_at).toLocaleDateString(
                                'id-ID',
                              )}
                            </span>
                          </div>
                        ))}
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                          <Upload size={14} />
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
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MessageSquare size={16} />
                        Catatan
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto mb-2">
                        {sesi.catatan.map((note) => (
                          <div
                            key={note.id}
                            className="bg-gray-50 p-3 rounded text-sm"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold">
                                {note.author.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleString(
                                  'id-ID',
                                )}
                              </span>
                            </div>
                            <p className="text-gray-700">{note.catatan}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCatatan}
                          onChange={(e) => setNewCatatan(e.target.value)}
                          placeholder="Tulis catatan..."
                          className="flex-1 border rounded px-3 py-2 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddCatatan(sesi.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddCatatan(sesi.id)}
                          disabled={!newCatatan.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
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
      </div>
    </PeriodeGuard>
  );
}
