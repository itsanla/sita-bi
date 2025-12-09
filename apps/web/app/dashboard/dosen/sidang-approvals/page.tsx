'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import request from '@/lib/api';
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface PendaftaranSidang {
  id: number;
  is_submitted: boolean;
  status_validasi: string;
  divalidasi_pembimbing_1: boolean;
  divalidasi_pembimbing_2: boolean;
  divalidasi_prodi: boolean;
  divalidasi_jurusan: boolean;
  rejected_by?: number;
  rejection_reason?: string;
  validated_at?: string;
  created_at?: string;
  tugasAkhir: {
    id: number;
    judul: string;
    mahasiswa: {
      id: number;
      nim: string;
      prodi: string;
      user: {
        name: string;
      };
    };
  };
  files: any[];
  validator?: {
    name: string;
    roles: string[];
  };
}

export default function SidangApprovalsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pengaturan, setPengaturan] = useState<any>(null);
  const [pendaftaranList, setPendaftaranList] = useState<PendaftaranSidang[]>(
    [],
  );
  const [allHistory, setAllHistory] = useState<any[]>([]);
  const [canValidate, setCanValidate] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[DEBUG] Fetching data...');
      console.log('[DEBUG] User:', user);
      
      const pengaturanRes = await request('/pengaturan');
      console.log('[DEBUG] Pengaturan response:', pengaturanRes);
      
      const pendaftaranRes = await request('/pendaftaran-sidang/list-for-validation');
      console.log('[DEBUG] Pendaftaran response:', pendaftaranRes);
      
      const historyRes = await request('/pendaftaran-sidang/all-history');
      console.log('[DEBUG] History response:', historyRes);

      const settings = pengaturanRes.data?.data;
      setPengaturan(settings);

      const validasiAktif = settings?.validasi_pendaftaran_sidang_aktif;
      const validasiP1 = settings?.validasi_pembimbing_1;
      const validasiP2 = settings?.validasi_pembimbing_2;
      const validasiProdi = settings?.validasi_prodi;
      const validasiJurusan = settings?.validasi_jurusan;

      const userRoles = user?.roles?.map((r: any) => r.name) || [];
      const isJurusan = userRoles.includes('jurusan');
      const isProdi =
        userRoles.includes('prodi_d3') || userRoles.includes('prodi_d4');
      const isDosen = userRoles.includes('dosen');

      const canVal =
        validasiAktif &&
        ((validasiJurusan && isJurusan) ||
          (validasiProdi && isProdi) ||
          (validasiP1 && isDosen) ||
          (validasiP2 && isDosen));

      console.log('[DEBUG] Can validate:', canVal);
      setCanValidate(canVal);
      setPendaftaranList(pendaftaranRes.data?.data || []);
      setAllHistory(historyRes.data?.data || []);
      console.log('[DEBUG] Data loaded successfully');
    } catch (err: any) {
      console.error('[DEBUG] Error in fetchData:', err);
      console.error('[DEBUG] Error response:', err.response);
      console.error('[DEBUG] Error message:', err.message);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (
    pendaftaranId: number,
    action: 'approve' | 'reject',
    mahasiswaNama?: string,
  ) => {
    try {
      let catatan = '';
      if (action === 'reject') {
        catatan =
          prompt(
            `Apa alasan Anda menolak pendaftaran mahasiswa ${mahasiswaNama}?`,
          ) || '';
        if (!catatan.trim()) {
          toast.error('Alasan penolakan harus diisi');
          return;
        }
      }
      await request.post(`/pendaftaran-sidang/${pendaftaranId}/validate`, {
        action,
        catatan,
      });
      toast.success(
        `Pendaftaran ${action === 'approve' ? 'disetujui' : 'ditolak'}`,
      );
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memvalidasi');
    }
  };

  const handleCancelValidation = async (pendaftaranId: number) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan validasi Anda?')) return;
    try {
      await request.post(
        `/pendaftaran-sidang/${pendaftaranId}/cancel-validation`,
        {},
      );
      toast.success('Validasi dibatalkan');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan validasi');
    }
  };

  const handleViewFiles = (files: any[]) => {
    // TODO: Implement view files modal
    toast.info('Fitur lihat file akan segera tersedia');
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">Memuat...</div>
      </div>
    );
  }

  if (!pengaturan?.validasi_pendaftaran_sidang_aktif) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Persetujuan Pendaftaran Sidang
        </h1>
        <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-blue-50 p-12 rounded-lg border border-blue-200">
          <AlertCircle size={48} className="mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-blue-800">
            Persetujuan Pendaftaran Tidak Diaktifkan
          </h2>
          <p className="mt-2 max-w-md text-blue-700">
            Sistem persetujuan pendaftaran sidang saat ini tidak aktif.
            Mahasiswa dapat langsung mendaftar sidang tanpa persetujuan.
          </p>
        </div>
      </div>
    );
  }

  if (!canValidate) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Persetujuan Pendaftaran Sidang
        </h1>
        <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-red-50 p-12 rounded-lg border border-red-200">
          <XCircle size={48} className="mb-4 text-red-600" />
          <h2 className="text-xl font-semibold text-red-800">
            Anda Tidak Berhak Memvalidasi Pendaftaran Sidang
          </h2>
          <p className="mt-2 max-w-md text-red-700">
            Anda tidak memiliki akses untuk memvalidasi pendaftaran sidang
            berdasarkan pengaturan saat ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">
          Persetujuan Pendaftaran Sidang
        </h1>
        <p className="text-gray-600">
          Daftar mahasiswa yang telah mendaftar sidang dan menunggu persetujuan
        </p>
      </div>

      {pendaftaranList.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500">
            Tidak ada pendaftaran yang perlu divalidasi
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mahasiswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  NIM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prodi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Judul TA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendaftaranList.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.tugasAkhir.mahasiswa.user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.tugasAkhir.mahasiswa.nim}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.tugasAkhir.mahasiswa.prodi}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {item.tugasAkhir.judul}
                  </td>
                  <td className="px-6 py-4">
                    {item.status_validasi === 'approved' ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Disetujui
                      </span>
                    ) : item.status_validasi === 'rejected' ? (
                      <div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Ditolak
                        </span>
                        {item.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            {item.rejection_reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {item.status_validasi === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleValidate(item.id, 'approve')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                          >
                            Setuju
                          </button>
                          <button
                            onClick={() =>
                              handleValidate(
                                item.id,
                                'reject',
                                item.tugasAkhir.mahasiswa.user.name,
                              )
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleViewFiles(item.files)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                          >
                            <Eye size={14} />
                            Lihat
                          </button>
                        </>
                      ) : item.status_validasi === 'approved' ? (
                        <>
                          <button
                            onClick={() => handleCancelValidation(item.id)}
                            className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs"
                          >
                            Batalkan
                          </button>
                          <button
                            onClick={() => handleViewFiles(item.files)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                          >
                            <Eye size={14} />
                            Lihat
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleViewFiles(item.files)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                        >
                          <Eye size={14} />
                          Lihat
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {allHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Riwayat Semua Pendaftaran</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mahasiswa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    NIM
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aksi
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
                {allHistory.map((item) => {
                  const roleLabel = item.validator_role === 'jurusan'
                    ? 'Jurusan'
                    : item.validator_role === 'prodi_d3'
                    ? 'Prodi D3'
                    : item.validator_role === 'prodi_d4'
                    ? 'Prodi D4'
                    : item.validator_role === 'pembimbing1'
                    ? 'Pembimbing 1'
                    : item.validator_role === 'pembimbing2'
                    ? 'Pembimbing 2'
                    : 'Pembimbing';

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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.mahasiswa?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.mahasiswa?.nim || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
                            <p className="font-medium">{item.validator.name}</p>
                            <p className="text-xs text-gray-500">({roleLabel})</p>
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
  );
}
