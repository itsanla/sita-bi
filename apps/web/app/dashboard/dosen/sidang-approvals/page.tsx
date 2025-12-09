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
}

export default function SidangApprovalsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pengaturan, setPengaturan] = useState<any>(null);
  const [pendaftaranList, setPendaftaranList] = useState<PendaftaranSidang[]>(
    [],
  );
  const [canValidate, setCanValidate] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pengaturanRes, pendaftaranRes] = await Promise.all([
        request('/pengaturan'),
        request('/pendaftaran-sidang/list-for-validation'),
      ]);

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

      setCanValidate(canVal);
      setPendaftaranList(pendaftaranRes.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (
    pendaftaranId: number,
    action: 'approve' | 'reject',
  ) => {
    try {
      await request.post(`/pendaftaran-sidang/${pendaftaranId}/validate`, {
        action,
      });
      toast.success(
        `Pendaftaran ${action === 'approve' ? 'disetujui' : 'ditolak'}`,
      );
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memvalidasi');
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.status_validasi === 'approved' ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Disetujui
                      </span>
                    ) : item.status_validasi === 'rejected' ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Ditolak
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.status_validasi === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleValidate(item.id, 'approve')}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                        >
                          Setuju
                        </button>
                        <button
                          onClick={() => handleValidate(item.id, 'reject')}
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
                      </div>
                    ) : (
                      <button
                        onClick={() => handleViewFiles(item.files)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Lihat
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
