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
      setMahasiswaList(response.data?.data?.data || []);
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
    } catch {
      toast.error('Gagal validasi judul');
    }
  };

  const handleValidasiDraf = async (dokumenId: number) => {
    if (!confirm('Validasi draf tugas akhir ini?')) return;
    try {
      await request.post(`/dokumen-ta/${dokumenId}/validasi`, {});
      toast.success('Draf berhasil divalidasi');
      fetchData();
    } catch {
      toast.error('Gagal validasi draf');
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

  return (
    <PeriodeGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users size={28} />
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
                    Minimal 9 sesi bimbingan valid
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    Draf TA divalidasi oleh kedua pembimbing
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {mahasiswaList.map((mhs, idx) => (
                <button
                  key={mhs.id}
                  onClick={() => setSelectedMahasiswa(idx)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedMahasiswa === idx
                      ? 'bg-red-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Mahasiswa Bimbingan {idx + 1}
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
                      {tugasAkhir.bimbinganTa.filter(
                        (b) => b.status_bimbingan === 'selesai',
                      ).length >= 9 ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <XCircle className="text-red-600" size={20} />
                      )}
                      <span className="text-sm">
                        Minimal 9 Bimbingan Valid:{' '}
                        <span className="font-bold">
                          {
                            tugasAkhir.bimbinganTa.filter(
                              (b) => b.status_bimbingan === 'selesai',
                            ).length
                          }
                          /9
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tugasAkhir.dokumenTa?.[0]?.divalidasi_oleh_p1 &&
                      tugasAkhir.dokumenTa?.[0]?.divalidasi_oleh_p2 ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <XCircle className="text-red-600" size={20} />
                      )}
                      <span className="text-sm">
                        Validasi Draf Tugas Akhir:{' '}
                        <span className="font-bold">
                          {tugasAkhir.dokumenTa?.[0]?.divalidasi_oleh_p1 &&
                          tugasAkhir.dokumenTa?.[0]?.divalidasi_oleh_p2
                            ? 'Lengkap'
                            : 'Belum Lengkap'}
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
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {tugasAkhir.judul}
                </p>
                {!!(
                  (currentDosenPeran === 'pembimbing1' &&
                    tugasAkhir.judul_divalidasi_p1) ||
                  (currentDosenPeran === 'pembimbing2' &&
                    tugasAkhir.judul_divalidasi_p2)
                ) && (
                  <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={18} />
                      <span className="text-sm font-semibold text-green-800">
                        Anda telah memvalidasi judul ini
                      </span>
                    </div>
                  </div>
                )}
                {((currentDosenPeran === 'pembimbing1' &&
                  !tugasAkhir.judul_divalidasi_p1) ||
                  (currentDosenPeran === 'pembimbing2' &&
                    !tugasAkhir.judul_divalidasi_p2)) && (
                  <button
                    onClick={() => handleValidasiJudul(tugasAkhir.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <FileCheck size={16} />
                    Validasi Judul
                  </button>
                )}
              </div>
            </div>

            {/* Komponen 3: Draf TA */}
            {!!tugasAkhir.dokumenTa?.[0] && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Draf Tugas Akhir</h2>
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
                      {((currentDosenPeran === 'pembimbing1' &&
                        !tugasAkhir.dokumenTa[0].divalidasi_oleh_p1) ||
                        (currentDosenPeran === 'pembimbing2' &&
                          !tugasAkhir.dokumenTa[0].divalidasi_oleh_p2)) && (
                        <button
                          onClick={() =>
                            handleValidasiDraf(tugasAkhir.dokumenTa[0].id)
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          <FileCheck size={14} />
                          Validasi
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                </div>
              </div>
            )}

            {/* Komponen 4: Sesi Bimbingan */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Daftar Sesi Bimbingan</h2>
              <div className="space-y-4">
                {tugasAkhir.bimbinganTa.map((sesi) => (
                  <div
                    key={sesi.id}
                    className="bg-white rounded-lg shadow border"
                  >
                    <div
                      className={`p-4 flex justify-between items-center cursor-pointer ${
                        sesi.status_bimbingan === 'selesai'
                          ? 'bg-green-50'
                          : 'bg-gray-50'
                      }`}
                      onClick={() =>
                        setSelectedSesi(
                          selectedSesi === sesi.id ? null : sesi.id,
                        )
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
                              ? new Date(
                                  sesi.tanggal_bimbingan,
                                ).toLocaleDateString('id-ID')
                              : 'Belum dijadwalkan'}
                            {!!sesi.jam_bimbingan && ` • ${sesi.jam_bimbingan}`}
                            {!!sesi.jam_selesai && ` - ${sesi.jam_selesai}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sesi.status_bimbingan !== 'selesai' &&
                          !!sesi.tanggal_bimbingan && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKonfirmasiSesi(sesi.id);
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              Validasi
                            </button>
                          )}
                        {sesi.status_bimbingan === 'selesai' &&
                          sesi.peran === currentDosenPeran && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBatalkanValidasi(sesi.id);
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                            >
                              Batalkan
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
    </PeriodeGuard>
  );
}
