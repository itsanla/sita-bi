'use client';

import { useEffect, useState } from 'react';
import request from '@/lib/api';
import { useAuth } from '../../../../context/AuthContext';
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Users,
  X,
} from 'lucide-react';

// --- Interfaces ---
interface Mahasiswa {
  id: number;
  user: { id: number; name: string; email: string };
  nim: string;
  prodi: string;
  angkatan: string;
  kelas: string;
}

interface PengajuanBimbingan {
  id: number;
  status: string;
  diinisiasi_oleh: 'mahasiswa' | 'dosen';
  mahasiswa: {
    user: { name: string; email: string };
    nim: string;
  };
  created_at: string;
}

interface MahasiswaBimbingan {
  id: number;
  peran: string;
  tugasAkhir: {
    mahasiswa: {
      user: { name: string; email: string };
      nim: string;
    };
  };
  pengajuanPelepasanBimbingan?: Array<{
    id: number;
    diajukan_oleh_user_id: number;
    status: string;
  }>;
}

// --- Main Page Component ---
export default function PengajuanBimbinganPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<PengajuanBimbingan[]>([]);
  const [availableMahasiswa, setAvailableMahasiswa] = useState<Mahasiswa[]>([]);
  const [mahasiswaBimbingan, setMahasiswaBimbingan] = useState<
    MahasiswaBimbingan[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch proposals for this dosen
      const proposalsResponse = await request<{
        data: PengajuanBimbingan[];
        mahasiswaBimbingan: MahasiswaBimbingan[];
      }>('/pengajuan/dosen');
      if (Array.isArray(proposalsResponse.data)) {
        setProposals(proposalsResponse.data);
      }
      if (Array.isArray(proposalsResponse.mahasiswaBimbingan)) {
        setMahasiswaBimbingan(proposalsResponse.mahasiswaBimbingan);
      }

      // Fetch available mahasiswa (yang belum punya pembimbing)
      const mahasiswaResponse = await request<{ data: { data: Mahasiswa[] } }>(
        '/users/mahasiswa-tanpa-pembimbing',
      );
      if (Array.isArray(mahasiswaResponse.data?.data)) {
        setAvailableMahasiswa(mahasiswaResponse.data.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // --- Handlers ---
  const handleOfferToStudent = async (mahasiswaId: number) => {
    if (!confirm('Are you sure you want to offer supervision to this student?'))
      return;
    try {
      await request('/pengajuan/dosen', {
        method: 'POST',
        data: { mahasiswaId },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleAccept = async (pengajuanId: number) => {
    if (
      !confirm('Are you sure you want to accept this student for supervision?')
    )
      return;
    try {
      await request(`/pengajuan/${pengajuanId}/terima`, { method: 'POST' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleReject = async (_pengajuanId: number) => {
    if (!confirm('Are you sure you want to reject this student?')) return;
    try {
      await request(`/pengajuan/${_pengajuanId}/tolak`, { method: 'POST' });
      alert('Student rejected.');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleCancel = async (pengajuanId: number) => {
    if (!confirm('Are you sure you want to cancel this offer?')) return;
    try {
      await request(`/pengajuan/${pengajuanId}/batalkan`, { method: 'POST' });
      alert('Offer cancelled.');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleLepaskanBimbingan = async (peranDosenTaId: number) => {
    if (!confirm('Apakah Anda yakin ingin mengajukan pelepasan bimbingan ini?'))
      return;
    try {
      await request('/pengajuan/lepaskan', {
        method: 'POST',
        data: { peranDosenTaId },
      });
      alert('Berhasil mengajukan pelepasan bimbingan');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleKonfirmasiPelepasan = async (
    pengajuanId: number,
    action: 'konfirmasi' | 'tolak',
  ) => {
    try {
      await request(`/pengajuan/lepaskan/${pengajuanId}/${action}`, {
        method: 'POST',
      });
      alert(
        `Berhasil ${action === 'konfirmasi' ? 'menyetujui' : 'menolak'} pelepasan`,
      );
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );

  if (error)
    return (
      <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">
        <strong>Error:</strong> {error}
      </div>
    );

  const incomingRequests = proposals.filter(
    (p) =>
      p.diinisiasi_oleh === 'mahasiswa' &&
      p.status === 'MENUNGGU_PERSETUJUAN_DOSEN',
  );

  const sentOffers = proposals.filter((p) => p.diinisiasi_oleh === 'dosen');
  const activeSentOffers = sentOffers.filter(
    (p) => p.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA',
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">
        Supervision Proposals
      </h1>

      {/* Mahasiswa Bimbingan Aktif */}
      {mahasiswaBimbingan.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <Users className="mr-2" size={24} />
            Mahasiswa Bimbingan Aktif ({mahasiswaBimbingan.length})
          </h2>
          <div className="space-y-3">
            {mahasiswaBimbingan.map((bimbingan) => {
              const pengajuanAktif = bimbingan.pengajuanPelepasanBimbingan?.[0];
              const isUserYangMengajukan =
                pengajuanAktif?.diajukan_oleh_user_id === user?.id;

              return (
                <div
                  key={bimbingan.id}
                  className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">
                        {bimbingan.tugasAkhir.mahasiswa.user.name}
                      </p>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {bimbingan.peran === 'pembimbing1' ? 'P1' : 'P2'}
                      </span>
                      {pengajuanAktif && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          Pengajuan Pelepasan
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      NIM: {bimbingan.tugasAkhir.mahasiswa.nim}
                    </p>
                  </div>
                  {pengajuanAktif ? (
                    isUserYangMengajukan ? (
                      <span className="text-xs text-gray-500">
                        Menunggu konfirmasi mahasiswa
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleKonfirmasiPelepasan(
                              pengajuanAktif.id,
                              'konfirmasi',
                            )
                          }
                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle size={14} />
                          Setuju
                        </button>
                        <button
                          onClick={() =>
                            handleKonfirmasiPelepasan(
                              pengajuanAktif.id,
                              'tolak',
                            )
                          }
                          className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-1.5"
                        >
                          <XCircle size={14} />
                          Tolak
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => handleLepaskanBimbingan(bimbingan.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <X size={14} />
                      Lepaskan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Available Students */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <User className="mr-2" size={24} />
              Students Without Supervisor ({availableMahasiswa.length})
            </h2>
            <div className="space-y-3">
              {availableMahasiswa.length > 0 ? (
                availableMahasiswa.map((mahasiswa) => (
                  <div
                    key={mahasiswa.id}
                    className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        {mahasiswa.user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        NIM: {mahasiswa.nim} | {mahasiswa.prodi} |{' '}
                        {mahasiswa.angkatan}
                      </p>
                      <p className="text-xs text-gray-400">
                        {mahasiswa.user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOfferToStudent(mahasiswa.id)}
                      disabled={activeSentOffers.length >= 3}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white font-semibold rounded-lg hover:bg-red-900 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Send size={14} />
                      Offer Supervision
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-6">
                  No students without supervisors available.
                </p>
              )}
            </div>
          </div>

          {/* Incoming Requests from Students */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <Clock className="mr-2" size={24} />
              Incoming Student Requests ({incomingRequests.length})
            </h2>
            <div className="space-y-4">
              {incomingRequests.length > 0 ? (
                incomingRequests.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        {p.mahasiswa.user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        NIM: {p.mahasiswa.nim}
                      </p>
                      <p className="text-xs text-gray-400">
                        Requested: {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(p.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1"
                      >
                        <CheckCircle size={16} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(p.id)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-1"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-6">
                  No incoming requests from students.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sent Offers */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              My Sent Offers ({activeSentOffers.length}/3)
            </h2>
            <div className="space-y-3">
              {sentOffers.length > 0 ? (
                sentOffers.map((p) => (
                  <div key={p.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {p.mahasiswa.user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          NIM: {p.mahasiswa.nim}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          p.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA'
                            ? 'bg-yellow-100 text-yellow-800'
                            : p.status === 'DISETUJUI'
                              ? 'bg-green-100 text-green-800'
                              : p.status === 'DITOLAK'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {p.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      Sent: {new Date(p.created_at).toLocaleDateString()}
                    </p>
                    {p.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA' && (
                      <button
                        onClick={() => handleCancel(p.id)}
                        className="w-full px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200"
                      >
                        Cancel Offer
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4 text-sm">
                  You have not sent any offers.
                </p>
              )}
            </div>
            {activeSentOffers.length >= 3 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  You have reached the maximum of 3 active offers. Cancel an
                  existing offer to send a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
