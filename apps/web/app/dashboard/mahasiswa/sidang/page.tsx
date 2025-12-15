'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import request from '@/lib/api';
import PeriodeGuard from '@/components/shared/PeriodeGuard';
import TAGuard from '@/components/shared/TAGuard';
import PendaftaranSidangGuard from '@/components/shared/PendaftaranSidangGuard';
import { Upload, FileText, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PendaftaranSidangFile {
  id: number;
  file_path: string;
  original_name: string;
  tipe_dokumen: string;
  created_at: string;
}

interface PendaftaranSidang {
  id: number;
  is_submitted: boolean;
  status_validasi?: string;
  rejected_by?: number;
  rejection_reason?: string;
  validated_at?: string;
  created_at?: string;
  files: PendaftaranSidangFile[];
  validator?: {
    name: string;
    roles: string[];
  };
}

interface HistoryItem {
  id: number;
  action: string;
  status_before?: string;
  status_after?: string;
  rejection_reason?: string;
  validator_role?: string;
  created_at: string;
  validator?: {
    name: string;
    roles: string[];
  };
}

interface SyaratSidang {
  key: string;
  label: string;
}

export default function PendaftaranSidangPage() {
  const { user } = useAuth();
  const [pendaftaran, setPendaftaran] = useState<PendaftaranSidang | null>(
    null,
  );
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [syaratSidang, setSyaratSidang] = useState<SyaratSidang[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const pendaftaranRes = await request<{ data: PendaftaranSidang | null }>(
        '/pendaftaran-sidang/my-registration',
      );
      setPendaftaran(pendaftaranRes.data?.data || null);

      const historyRes = await request<{ data: HistoryItem[] }>(
        '/pendaftaran-sidang/history',
      );
      setHistory(historyRes.data?.data || []);

      try {
        const pengaturanRes = await request<{
          data: { syarat_pendaftaran_sidang?: SyaratSidang[] };
        }>('/pengaturan');
        setSyaratSidang(
          pengaturanRes.data?.data?.syarat_pendaftaran_sidang || [],
        );
      } catch {
        setSyaratSidang([
          { key: 'NASKAH_TA', label: 'Naskah TA' },
          { key: 'TOEIC', label: 'Sertifikat TOEIC' },
          { key: 'RAPOR', label: 'Transkrip Nilai' },
          { key: 'IJAZAH_SLTA', label: 'Ijazah SLTA' },
          { key: 'BEBAS_JURUSAN', label: 'Surat Bebas Jurusan' },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const uploadFile = async (file: File, tipeDokumen: string, label: string) => {
    if (file.type !== 'application/pdf') {
      toast.error('Hanya file PDF yang diperbolehkan');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    try {
      setUploadingFiles((prev) => ({ ...prev, [tipeDokumen]: true }));

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pendaftaran-sidang/upload/${tipeDokumen}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!response.ok) throw new Error('Upload gagal');

      toast.success(`${label} berhasil diupload`);
      fetchData();
    } catch {
      toast.error('Gagal upload file');
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [tipeDokumen]: false }));
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    tipeDokumen: string,
    label: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file, tipeDokumen, label);
      e.target.value = '';
    }
  };

  const handleViewFile = (filePath: string) => {
    const fileName = filePath.split('/').pop() || '';
    window.open(`/uploads/sidang-files/${fileName}`, '_blank');
  };

  const handleDeleteFile = async (fileId: number, label: string) => {
    if (!confirm(`Hapus ${label}?`)) return;
    try {
      await request.delete(`/pendaftaran-sidang/file/${fileId}`);
      toast.success(`${label} berhasil dihapus`);
      fetchData();
    } catch {
      toast.error('Gagal menghapus file');
    }
  };

  const getFileByType = (tipe: string) => {
    return pendaftaran?.files?.find((f) => f.tipe_dokumen === tipe);
  };

  const isAllFilesUploaded = () => {
    return syaratSidang.every((syarat) => getFileByType(syarat.key));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await request.post('/pendaftaran-sidang/submit', {});
      toast.success('Berhasil mendaftar sidang!');
      fetchData();
    } catch {
      toast.error('Gagal mendaftar sidang');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pendaftaran sidang?'))
      return;
    try {
      setIsSubmitting(true);
      await request.post('/pendaftaran-sidang/cancel', {});
      toast.success('Pendaftaran sidang dibatalkan');
      fetchData();
    } catch {
      toast.error('Gagal membatalkan pendaftaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PeriodeGuard>
        <TAGuard requireEligibleForSidang>
          <PendaftaranSidangGuard>
            <div className="text-center p-8">Memuat...</div>
          </PendaftaranSidangGuard>
        </TAGuard>
      </PeriodeGuard>
    );
  }

  const isTerdaftar =
    pendaftaran?.is_submitted === true &&
    pendaftaran?.status_validasi !== 'rejected';

  return (
    <PeriodeGuard>
      <TAGuard requireEligibleForSidang>
        <PendaftaranSidangGuard>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h1 className="text-2xl font-bold mb-4">
                Pendaftaran Sidang Tugas Akhir
              </h1>
              <p className="text-gray-600">
                Upload 5 dokumen yang diperlukan untuk pendaftaran sidang.
              </p>
            </div>

            {pendaftaran?.status_validasi === 'rejected' && (
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <p className="text-red-800 font-semibold text-lg mb-2">
                  ✗ Pendaftaran Ditolak
                </p>
                <p className="text-red-700 text-sm">
                  Alasan: {pendaftaran.rejection_reason || 'Tidak ada alasan'}
                </p>
                <p className="text-red-600 text-xs mt-2">
                  Upload ulang dokumen yang diperlukan dan daftar kembali.
                </p>
              </div>
            )}

            {!!isTerdaftar && pendaftaran?.status_validasi !== 'rejected' && (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-800 font-semibold text-lg">
                      ✓ Anda sudah terdaftar sidang
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Jadwal sidang akan diumumkan kemudian
                    </p>
                  </div>
                  <button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 text-sm"
                  >
                    Batalkan Pendaftaran
                  </button>
                </div>
              </div>
            )}

            {!!isTerdaftar && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  ℹ️ Jika ingin mengubah file PDF yang sudah diupload, batalkan
                  pendaftaran sidang terlebih dahulu.
                </p>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Dokumen Pendaftaran</h2>
              <div className="space-y-4">
                {syaratSidang.map((syarat) => {
                  const existingFile = getFileByType(syarat.key);
                  const isUploading = uploadingFiles[syarat.key];

                  return (
                    <div key={syarat.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {syarat.label} <span className="text-red-500">*</span>
                      </label>

                      {existingFile ? (
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <FileText className="text-red-600" size={32} />
                            <div>
                              <p className="font-semibold">
                                {existingFile.original_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Diupload:{' '}
                                {new Date(
                                  existingFile.created_at,
                                ).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!isTerdaftar && (
                              <>
                                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">
                                  <Edit size={16} />
                                  Ubah
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleFileSelect(
                                        e,
                                        syarat.key,
                                        syarat.label,
                                      )
                                    }
                                  />
                                </label>
                                <button
                                  onClick={() =>
                                    handleDeleteFile(
                                      existingFile.id,
                                      syarat.label,
                                    )
                                  }
                                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  <Trash2 size={16} />
                                  Hapus
                                </button>
                              </>
                            )}
                            <button
                              onClick={() =>
                                handleViewFile(existingFile.file_path)
                              }
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Eye size={16} />
                              Lihat
                            </button>
                          </div>
                        </div>
                      ) : isUploading ? (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-700">
                            Mengupload...
                          </p>
                        </div>
                      ) : isTerdaftar ? (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600">
                            Batalkan pendaftaran untuk upload file
                          </p>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900">
                          <Upload size={16} />
                          Upload {syarat.label}
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) =>
                              handleFileSelect(e, syarat.key, syarat.label)
                            }
                          />
                        </label>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        Format: PDF | Maksimal: 10MB
                      </p>
                    </div>
                  );
                })}
              </div>

              {!isTerdaftar && (
                <button
                  onClick={handleSubmit}
                  disabled={!isAllFilesUploaded() || isSubmitting}
                  className="w-full mt-6 py-3 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg"
                >
                  {isSubmitting ? 'Mendaftar...' : 'Daftar Sidang'}
                </button>
              )}
            </div>

            {history.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Riwayat Pendaftaran</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tanggal Daftar
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Validator
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((item, idx) => {
                        const roles = item.validator_role?.split(',') || [];
                        const roleLabels = roles.map((r) =>
                          r === 'jurusan'
                            ? 'Jurusan'
                            : r === 'prodi_d3'
                              ? 'Prodi D3'
                              : r === 'prodi_d4'
                                ? 'Prodi D4'
                                : r === 'pembimbing1'
                                  ? 'Pembimbing 1'
                                  : r === 'pembimbing2'
                                    ? 'Pembimbing 2'
                                    : r,
                        );
                        const roleLabel =
                          roleLabels.join(' + ') || 'Pembimbing';

                        const actionLabel =
                          item.action === 'submit'
                            ? 'Mendaftar'
                            : item.action === 'approve'
                              ? 'Disetujui'
                              : item.action === 'reject'
                                ? 'Ditolak'
                                : item.action;

                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {history.length - idx}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(item.created_at).toLocaleDateString(
                                'id-ID',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {item.action === 'approve' ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  {actionLabel}
                                </span>
                              ) : item.action === 'reject' ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  {actionLabel}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {actionLabel}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.validator ? (
                                <div>
                                  <p className="font-medium">
                                    {item.validator.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    ({roleLabel})
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.action === 'reject'
                                ? item.rejection_reason || 'Tidak ada alasan'
                                : item.action === 'approve'
                                  ? 'Pendaftaran disetujui'
                                  : 'Pendaftaran disubmit'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </PendaftaranSidangGuard>
      </TAGuard>
    </PeriodeGuard>
  );
}
