'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import request from '@/lib/api';
import { XCircle, AlertCircle, Eye, FileText } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHistoryStatus, setFilterHistoryStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;
  const historyPerPage = 10;
  const [selectedItem, setSelectedItem] = useState<PendaftaranSidang | null>(
    null,
  );
  const [syaratSidang, setSyaratSidang] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const pengaturanRes = await request('/pengaturan');

      const pendaftaranRes = await request(
        '/pendaftaran-sidang/list-for-validation',
      );

      const historyRes = await request('/pendaftaran-sidang/all-history');

      const settings = pengaturanRes.data?.data;
      setPengaturan(settings);
      setSyaratSidang(settings?.syarat_pendaftaran_sidang || []);

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
      setAllHistory(historyRes.data?.data || []);
    } catch {
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

  const handleViewFiles = (item: PendaftaranSidang) => {
    setSelectedItem(item);
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
        <p className="text-gray-600 mb-3">
          Daftar mahasiswa yang telah mendaftar sidang dan menunggu persetujuan
        </p>
        <div className="flex gap-4 text-xs text-gray-600">
          <span>
            <span className="font-semibold">P1:</span> Pembimbing 1
          </span>
          <span>
            <span className="font-semibold">P2:</span> Pembimbing 2
          </span>
          <span>
            <span className="font-semibold">PS:</span> Prodi
          </span>
          <span>
            <span className="font-semibold">JU:</span> Jurusan
          </span>
          <span className="ml-4">🟡 Belum validasi</span>
          <span>🟢 Sudah validasi</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Cari nama atau NIM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
          </select>
        </div>
      </div>

      {(() => {
        const filtered = pendaftaranList.filter((item) => {
          const matchSearch =
            searchQuery === '' ||
            item.tugasAkhir.mahasiswa.user.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            item.tugasAkhir.mahasiswa.nim.includes(searchQuery);
          const matchStatus =
            filterStatus === 'all' || item.status_validasi === filterStatus;
          return matchSearch && matchStatus;
        });

        if (filtered.length === 0)
          return (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <p className="text-gray-500">
                Tidak ada pendaftaran yang perlu divalidasi
              </p>
            </div>
          );

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedData = filtered.slice(
          startIndex,
          startIndex + itemsPerPage,
        );

        return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mahasiswa
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
                    Validator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item) => {
                  const showP1 = pengaturan?.validasi_pembimbing_1;
                  const showP2 = pengaturan?.validasi_pembimbing_2;
                  const showProdi = pengaturan?.validasi_prodi;
                  const showJurusan = pengaturan?.validasi_jurusan;

                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div>
                          <p>{item.tugasAkhir.mahasiswa.user.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.tugasAkhir.mahasiswa.nim}
                          </p>
                        </div>
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
                            {!!item.rejection_reason && (
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
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-1">
                          {!!showP1 && (
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${
                                item.divalidasi_pembimbing_1
                                  ? 'bg-green-500 text-white'
                                  : 'bg-yellow-400 text-gray-800'
                              }`}
                            >
                              P1
                            </span>
                          )}
                          {!!showP2 && (
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${
                                item.divalidasi_pembimbing_2
                                  ? 'bg-green-500 text-white'
                                  : 'bg-yellow-400 text-gray-800'
                              }`}
                            >
                              P2
                            </span>
                          )}
                          {!!showProdi && (
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${
                                item.divalidasi_prodi
                                  ? 'bg-green-500 text-white'
                                  : 'bg-yellow-400 text-gray-800'
                              }`}
                            >
                              PS
                            </span>
                          )}
                          {!!showJurusan && (
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${
                                item.divalidasi_jurusan
                                  ? 'bg-green-500 text-white'
                                  : 'bg-yellow-400 text-gray-800'
                              }`}
                            >
                              JU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {item.status_validasi === 'pending' ? (
                            <>
                              <button
                                onClick={() =>
                                  handleValidate(item.id, 'approve')
                                }
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
                                onClick={() => handleViewFiles(item)}
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
                                onClick={() => handleViewFiles(item)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                              >
                                <Eye size={14} />
                                Lihat
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleViewFiles(item)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                            >
                              <Eye size={14} />
                              Lihat
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-700">
                Menampilkan {startIndex + 1} -{' '}
                {Math.min(startIndex + itemsPerPage, filtered.length)} dari{' '}
                {filtered.length} data
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {allHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Riwayat Semua Pendaftaran</h2>
          <div className="mb-4">
            <select
              value={filterHistoryStatus}
              onChange={(e) => setFilterHistoryStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Aksi</option>
              <option value="submit">Mendaftar</option>
              <option value="approve">Disetujui</option>
              <option value="reject">Ditolak</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mahasiswa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prodi
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
                {(() => {
                  const filteredHistory = allHistory.filter(
                    (item) =>
                      filterHistoryStatus === 'all' ||
                      item.action === filterHistoryStatus,
                  );
                  const startIdx = (historyPage - 1) * historyPerPage;
                  return filteredHistory.slice(
                    startIdx,
                    startIdx + historyPerPage,
                  );
                })().map((item) => {
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
                  const roleLabel = roleLabels.join(' + ') || 'Pembimbing';

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
                        <div>
                          <p>{item.mahasiswa?.name || '-'}</p>
                          <p className="text-xs text-gray-500">
                            {item.mahasiswa?.nim || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.mahasiswa?.prodi || '-'}
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
            <div className="px-6 py-4 flex items-center justify-between border-t">
              {(() => {
                const filteredHistory = allHistory.filter(
                  (item) =>
                    filterHistoryStatus === 'all' ||
                    item.action === filterHistoryStatus,
                );
                const totalPages = Math.ceil(
                  filteredHistory.length / historyPerPage,
                );
                const startIdx = (historyPage - 1) * historyPerPage;
                return (
                  <>
                    <div className="text-sm text-gray-700">
                      Menampilkan {startIdx + 1} -{' '}
                      {Math.min(
                        startIdx + historyPerPage,
                        filteredHistory.length,
                      )}{' '}
                      dari {filteredHistory.length} data
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setHistoryPage((p) => Math.max(1, p - 1))
                        }
                        disabled={historyPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Prev
                      </button>
                      <span className="px-3 py-1">
                        {historyPage} / {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setHistoryPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={historyPage === totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {!!selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Detail Pendaftaran Sidang</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Informasi Mahasiswa
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nama</p>
                    <p className="font-medium">
                      {selectedItem.tugasAkhir.mahasiswa.user.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">NIM</p>
                    <p className="font-medium">
                      {selectedItem.tugasAkhir.mahasiswa.nim}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Prodi</p>
                    <p className="font-medium">
                      {selectedItem.tugasAkhir.mahasiswa.prodi}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium">
                      {selectedItem.status_validasi === 'approved' ? (
                        <span className="text-green-600">Disetujui</span>
                      ) : selectedItem.status_validasi === 'rejected' ? (
                        <span className="text-red-600">Ditolak</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Tugas Akhir</h3>
                <div className="text-sm">
                  <p className="text-gray-600">Judul</p>
                  <p className="font-medium">{selectedItem.tugasAkhir.judul}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Status Validasi</h3>
                <div className="grid grid-cols-2 gap-3">
                  {!!pengaturan?.validasi_pembimbing_1 && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded ${
                          selectedItem.divalidasi_pembimbing_1
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {selectedItem.divalidasi_pembimbing_1 ? '✓' : '○'}{' '}
                        Pembimbing 1
                      </span>
                    </div>
                  )}
                  {!!pengaturan?.validasi_pembimbing_2 && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded ${
                          selectedItem.divalidasi_pembimbing_2
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {selectedItem.divalidasi_pembimbing_2 ? '✓' : '○'}{' '}
                        Pembimbing 2
                      </span>
                    </div>
                  )}
                  {!!pengaturan?.validasi_prodi && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded ${
                          selectedItem.divalidasi_prodi
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {selectedItem.divalidasi_prodi ? '✓' : '○'} Prodi
                      </span>
                    </div>
                  )}
                  {!!pengaturan?.validasi_jurusan && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded ${
                          selectedItem.divalidasi_jurusan
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {selectedItem.divalidasi_jurusan ? '✓' : '○'} Jurusan
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Dokumen yang Diupload
                </h3>
                <div className="space-y-2">
                  {selectedItem.files.map((file: any) => {
                    const fileLabel =
                      syaratSidang.find((s: any) => s.key === file.tipe_dokumen)
                        ?.label || file.tipe_dokumen;
                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="text-red-600" size={24} />
                          <div>
                            <p className="font-medium text-sm">{fileLabel}</p>
                            <p className="text-xs text-gray-500">
                              {file.original_name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const fileName = file.file_path.split('/').pop();
                            window.open(
                              `/uploads/sidang-files/${fileName}`,
                              '_blank',
                            );
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                        >
                          Lihat
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedItem.status_validasi === 'rejected' &&
                !!selectedItem.rejection_reason && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-red-600">
                      Alasan Penolakan
                    </h3>
                    <p className="text-sm bg-red-50 p-3 rounded">
                      {selectedItem.rejection_reason}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
