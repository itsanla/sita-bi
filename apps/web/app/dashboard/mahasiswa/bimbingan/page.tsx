'use client';

import { useEffect, useState } from 'react';
import request from '@/lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { useUploadLampiran } from '@/hooks/useBimbingan';
import {
  Send,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Upload,
  User as UserIcon,
} from 'lucide-react';

// --- Interfaces ---
interface UserData {
  id: number;
  name: string;
}

interface Dosen {
  id: number;
  user: UserData;
}

interface Lampiran {
  id: number;
  file_path: string;
  original_name: string;
  created_at: string;
  uploader: UserData;
}

interface Catatan {
  id: number;
  catatan: string;
  created_at: string;
  author: UserData;
}

interface HistoryPerubahan {
  id: number;
  status: string;
  alasan_perubahan: string | null;
  tanggal_baru: string | null;
  jam_baru: string | null;
  created_at: string;
}

interface BimbinganTA {
  id: number;
  dosen: Dosen;
  peran: string;
  tanggal_bimbingan: string | null;
  jam_bimbingan: string | null;
  status_bimbingan: string;
  created_at: string;
  catatan: Catatan[];
  lampiran: Lampiran[];
  historyPerubahan: HistoryPerubahan[];
}

interface TugasAkhir {
  id: number;
  judul: string;
  status: string;
  peranDosenTa: { peran: string; dosen: { user: { name: string } } }[];
  bimbinganTa: BimbinganTA[];
}

interface DosenAvailable {
  id: number;
  name: string;
  email: string;
  nip: string;
}

interface PengajuanBimbingan {
  id: number;
  dosen_id: number;
  mahasiswa_id: number;
  status: string;
  diinisiasi_oleh: 'mahasiswa' | 'dosen';
  dosen: {
    user: { name: string };
  };
}

// --- Main Page Component ---
export default function BimbinganPage() {
  const { user } = useAuth();
  const [tugasAkhir, setTugasAkhir] = useState<TugasAkhir | null>(null);
  const [availableDosen, setAvailableDosen] = useState<DosenAvailable[]>([]);
  const [pengajuan, setPengajuan] = useState<PengajuanBimbingan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const uploadMutation = useUploadLampiran();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const taResponse = await request<{ data: TugasAkhir | null }>(
        '/bimbingan/sebagai-mahasiswa',
      );

      if (
        taResponse.data?.data &&
        (taResponse.data.data as TugasAkhir).peranDosenTa?.length > 0
      ) {
        setTugasAkhir(taResponse.data.data);
      } else {
        setTugasAkhir(null);
        const pengajuanResponse = await request<{ data: PengajuanBimbingan[] }>(
          '/pengajuan/mahasiswa',
        );
        if (Array.isArray(pengajuanResponse.data)) {
          setPengajuan(pengajuanResponse.data);
        }

        const dosenResponse = await request<{
          data: { data: DosenAvailable[] };
        }>('/users/dosen');
        if (Array.isArray(dosenResponse.data?.data)) {
          setAvailableDosen(dosenResponse.data.data);
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleAjukan = async (dosenId: number) => {
    if (
      !confirm(
        'Are you sure you want to send a supervision request to this lecturer?',
      )
    )
      return;
    try {
      await request('/pengajuan/mahasiswa', {
        method: 'POST',
        data: { dosenId },
      });
      alert('Request sent successfully!');
      fetchData();
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const handleBatalkan = async (pengajuanId: number) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      await request(`/pengajuan/${pengajuanId}/batalkan`, { method: 'POST' });
      alert('Request cancelled.');
      fetchData();
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const handleTerima = async (pengajuanId: number) => {
    if (!confirm('Are you sure you want to accept this supervision offer?'))
      return;
    try {
      await request(`/pengajuan/${pengajuanId}/terima`, { method: 'POST' });
      alert('Offer accepted! You now have a supervisor.');
      fetchData();
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const handleTolak = async (pengajuanId: number) => {
    if (!confirm('Are you sure you want to reject this offer?')) return;
    try {
      await request(`/pengajuan/${pengajuanId}/tolak`, { method: 'POST' });
      alert('Offer rejected.');
      fetchData();
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    bimbinganId: number,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    uploadMutation.mutate(
      { bimbinganId, files },
      {
        onSuccess: () => {
          fetchData();
          e.target.value = '';
        },
      },
    );
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error)
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;

  if (tugasAkhir) {
    return (
      <div className="space-y-8 pb-20">
        {/* Header info about Supervisors */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Proses Bimbingan
          </h1>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Pembimbing
            </h3>
            <div className="flex flex-wrap gap-4">
              {tugasAkhir.peranDosenTa?.length > 0 ? (
                tugasAkhir.peranDosenTa.map((p) => (
                  <div
                    key={p.peran}
                    className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border"
                  >
                    <div className="bg-red-100 p-2 rounded-full text-red-700">
                      <UserIcon size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">
                        {p.peran}
                      </p>
                      <p className="font-medium text-gray-800">
                        {p.dosen.user.name}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">
                  No supervisors assigned yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Bimbingan */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">
            Riwayat Bimbingan & Jadwal
          </h2>

          {tugasAkhir.bimbinganTa && tugasAkhir.bimbinganTa.length > 0 ? (
            tugasAkhir.bimbinganTa.map((bimbingan) => (
              <div
                key={bimbingan.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
              >
                {/* Header Bimbingan */}
                <div
                  className={`p-4 flex justify-between items-center ${
                    bimbingan.status_bimbingan === 'selesai'
                      ? 'bg-green-50'
                      : bimbingan.status_bimbingan === 'dibatalkan'
                        ? 'bg-red-50'
                        : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        bimbingan.status_bimbingan === 'selesai'
                          ? 'bg-green-100 text-green-600'
                          : bimbingan.status_bimbingan === 'dibatalkan'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {bimbingan.status_bimbingan === 'selesai' ? (
                        <CheckCircle size={24} />
                      ) : bimbingan.status_bimbingan === 'dibatalkan' ? (
                        <XCircle size={24} />
                      ) : (
                        <Calendar size={24} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Sesi Bimbingan</p>
                      <p className="text-sm text-gray-600">
                        Bersama: {bimbingan.dosen.user.name} ({bimbingan.peran})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar size={14} />
                      {bimbingan.tanggal_bimbingan
                        ? new Date(
                            bimbingan.tanggal_bimbingan,
                          ).toLocaleDateString('id-ID')
                        : 'Belum ditentukan'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 justify-end">
                      <Clock size={14} />
                      {bimbingan.jam_bimbingan || '-'}
                    </div>
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full font-semibold uppercase tracking-wide ${
                        bimbingan.status_bimbingan === 'selesai'
                          ? 'bg-green-200 text-green-800'
                          : bimbingan.status_bimbingan === 'dibatalkan'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {bimbingan.status_bimbingan}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Lampiran */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText size={16} /> Lampiran
                    </h4>
                    <div className="space-y-2">
                      {bimbingan.lampiran && bimbingan.lampiran.length > 0 ? (
                        bimbingan.lampiran.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded border text-sm"
                          >
                            <span className="truncate max-w-xs text-blue-600 font-medium">
                              {file.original_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              by {file.uploader.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Belum ada lampiran.
                        </p>
                      )}

                      {/* Upload Button */}
                      <div className="mt-2">
                        <label
                          className={`cursor-pointer inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Upload size={12} />
                          {uploadMutation.isPending
                            ? 'Uploading...'
                            : 'Upload File'}
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="hidden"
                            disabled={uploadMutation.isPending}
                            onChange={(e) => handleUpload(e, bimbingan.id)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Catatan */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">
                      Catatan & Diskusi
                    </h4>
                    <div className="bg-gray-50 p-4 rounded border space-y-3 max-h-80 overflow-y-auto">
                      {bimbingan.catatan && bimbingan.catatan.length > 0 ? (
                        bimbingan.catatan.map((note) => (
                          <div
                            key={note.id}
                            className="text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-gray-800">
                                {note.author.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(note.created_at).toLocaleString(
                                  'id-ID',
                                )}
                              </span>
                            </div>
                            <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                              {note.catatan}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic text-center py-2">
                          Belum ada catatan.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* History Log (Collapsed by default could be better, but showing for now) */}
                  {bimbingan.historyPerubahan &&
                  bimbingan.historyPerubahan.length > 0 ? (
                    <div className="border-t pt-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                        Riwayat Aktivitas
                      </h4>
                      <div className="space-y-2">
                        {bimbingan.historyPerubahan.map((log) => (
                          <div
                            key={log.id}
                            className="text-xs flex gap-2 text-gray-500"
                          >
                            <span className="min-w-[120px]">
                              {new Date(log.created_at).toLocaleString('id-ID')}
                            </span>
                            <span>
                              Status:{' '}
                              <span className="font-semibold">
                                {log.status}
                              </span>
                              {!!log.alasan_perubahan &&
                                ` - ${log.alasan_perubahan}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500 font-medium">
                Belum ada jadwal bimbingan.
              </p>
              <p className="text-sm text-gray-400">
                Hubungi dosen pembimbing untuk menjadwalkan sesi.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    const outgoingRequests = pengajuan.filter(
      (p) => p.diinisiasi_oleh === 'mahasiswa',
    );
    const incomingOffers = pengajuan.filter(
      (p) => p.diinisiasi_oleh === 'dosen',
    );
    const canSendRequest =
      outgoingRequests.filter((p) => p.status === 'MENUNGGU_PERSETUJUAN_DOSEN')
        .length < 3;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Pencarian Pembimbing
          </h1>
          <p className="mt-2 text-gray-600">
            Anda belum memiliki pembimbing. Ajukan diri ke dosen atau terima
            tawaran yang masuk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Dosen Tersedia
            </h2>
            <div className="space-y-4">
              {availableDosen.map((dosen) => (
                <div
                  key={dosen.id}
                  className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-lg text-gray-900">
                      {dosen.name}
                    </p>
                    <p className="text-sm text-gray-500">{dosen.email}</p>
                  </div>
                  <button
                    onClick={() => handleAjukan(dosen.id)}
                    disabled={!canSendRequest}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white font-semibold rounded-lg hover:bg-red-900 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                    Kirim Pengajuan
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Tawaran Masuk
              </h2>
              <div className="space-y-3">
                {incomingOffers.length > 0 ? (
                  incomingOffers.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-4 rounded-lg shadow-sm border border-blue-300"
                    >
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-blue-800">
                          {p.dosen.user.name}
                        </span>{' '}
                        ingin menjadi pembimbing Anda.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleTerima(p.id)}
                          className="w-full text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Terima
                        </button>
                        <button
                          onClick={() => handleTolak(p.id)}
                          className="w-full text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-gray-500 py-4">
                    Tidak ada tawaran masuk.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Pengajuan Terkirim ({outgoingRequests.length}/3)
              </h2>
              <div className="space-y-3">
                {outgoingRequests.length > 0 ? (
                  outgoingRequests.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {p.dosen.user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {p.status.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {p.status === 'MENUNGGU_PERSETUJUAN_DOSEN' && (
                        <button
                          onClick={() => handleBatalkan(p.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-gray-500 py-4">
                    Anda belum mengirim pengajuan.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
