'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Clock, AlertCircle, Users, X } from 'lucide-react';

interface Mahasiswa {
  id: number;
  user: { id: number; name: string; email: string };
  nim: string;
  prodi: string;
  kelas: string;
  has_pembimbing1: boolean;
  has_pembimbing2: boolean;
  available_for_p1: boolean;
  available_for_p2: boolean;
}

interface Pengajuan {
  id: number;
  peran_yang_diajukan: string;
  diinisiasi_oleh: string;
  status: string;
  mahasiswa: {
    id: number;
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

export default function PengajuanDosenPage() {
  const { user } = useAuth();
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [pengajuanList, setPengajuanList] = useState<Pengajuan[]>([]);
  const [mahasiswaBimbingan, setMahasiswaBimbingan] = useState<MahasiswaBimbingan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeran, setSelectedPeran] = useState<'pembimbing1' | 'pembimbing2'>('pembimbing1');
  const [kuotaInfo, setKuotaInfo] = useState({ current: 0, max: 4 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mahasiswaRes, pengajuanRes] = await Promise.all([
        fetch('http://localhost:3002/api/pengajuan/mahasiswa-tersedia', {
          headers: { 'x-user-id': user?.id?.toString() || '' },
        }),
        fetch('http://localhost:3002/api/pengajuan/dosen', {
          headers: { 'x-user-id': user?.id?.toString() || '' },
        }),
      ]);

      const mahasiswaData = await mahasiswaRes.json();
      const pengajuanData = await pengajuanRes.json();

      setMahasiswaList(mahasiswaData.data || []);
      setPengajuanList(pengajuanData.data || []);
      setMahasiswaBimbingan(pengajuanData.mahasiswaBimbingan || []);

      setKuotaInfo({ current: pengajuanData.mahasiswaBimbingan?.length || 0, max: 4 });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTawarkan = async (mahasiswaId: number) => {
    try {
      const res = await fetch('http://localhost:3002/api/pengajuan/dosen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
        },
        body: JSON.stringify({ mahasiswaId, peran: selectedPeran }),
      });

      const data = await res.json();
      if (data.status === 'sukses') {
        alert(`Berhasil menawarkan sebagai ${selectedPeran}`);
        fetchData();
      } else {
        alert(data.message || 'Gagal menawarkan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleAction = async (pengajuanId: number, action: 'terima' | 'tolak' | 'batalkan') => {
    try {
      const res = await fetch(`http://localhost:3002/api/pengajuan/${pengajuanId}/${action}`, {
        method: 'POST',
        headers: { 'x-user-id': user?.id?.toString() || '' },
      });

      const data = await res.json();
      if (data.status === 'sukses') {
        alert(`Berhasil ${action} pengajuan`);
        fetchData();
      } else {
        alert(data.message || `Gagal ${action} pengajuan`);
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleLepaskanBimbingan = async (peranDosenTaId: number) => {
    if (!confirm('Apakah Anda yakin ingin mengajukan pelepasan bimbingan ini?')) return;
    try {
      const res = await fetch('http://localhost:3002/api/pengajuan/lepaskan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
        },
        body: JSON.stringify({ peranDosenTaId }),
      });

      const data = await res.json();
      if (data.status === 'sukses') {
        alert('Berhasil mengajukan pelepasan bimbingan');
        fetchData();
      } else {
        alert(data.message || 'Gagal mengajukan pelepasan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleKonfirmasiPelepasan = async (pengajuanId: number, action: 'konfirmasi' | 'tolak') => {
    try {
      const res = await fetch(`http://localhost:3002/api/pengajuan/lepaskan/${pengajuanId}/${action}`, {
        method: 'POST',
        headers: { 'x-user-id': user?.id?.toString() || '' },
      });

      const data = await res.json();
      if (data.status === 'sukses') {
        alert(`Berhasil ${action === 'konfirmasi' ? 'menyetujui' : 'menolak'} pelepasan`);
        fetchData();
      } else {
        alert(data.message || `Gagal ${action} pelepasan`);
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const tawaranAktif = pengajuanList.filter(p => p.diinisiasi_oleh === 'dosen' && p.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA').length;
  const kuotaPenuh = kuotaInfo.current >= kuotaInfo.max;

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pengajuan Pembimbing</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">
            Kuota: {kuotaInfo.current}/{kuotaInfo.max} Mahasiswa
          </span>
        </div>
      </div>

      {kuotaPenuh && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Kuota bimbingan Anda sudah penuh. Anda tidak dapat menerima mahasiswa baru.
            </p>
          </div>
        </div>
      )}

      {/* Mahasiswa Bimbingan Aktif */}
      {mahasiswaBimbingan.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Mahasiswa Bimbingan Aktif</h2>
          </div>
          <div className="divide-y">
            {mahasiswaBimbingan.map((bimbingan) => {
              const pengajuanAktif = bimbingan.pengajuanPelepasanBimbingan?.[0];
              const isUserYangMengajukan = pengajuanAktif?.diajukan_oleh_user_id === user?.id;

              return (
                <div key={bimbingan.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{bimbingan.tugasAkhir.mahasiswa.user.name}</h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {bimbingan.peran === 'pembimbing1' ? 'P1' : 'P2'}
                        </span>
                        {pengajuanAktif && (
                          <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                            Pengajuan Pelepasan
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">NIM: {bimbingan.tugasAkhir.mahasiswa.nim}</p>
                    </div>
                    {pengajuanAktif ? (
                      isUserYangMengajukan ? (
                        <span className="text-sm text-gray-500">Menunggu konfirmasi mahasiswa</span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleKonfirmasiPelepasan(pengajuanAktif.id, 'konfirmasi')}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Setuju
                          </button>
                          <button
                            onClick={() => handleKonfirmasiPelepasan(pengajuanAktif.id, 'tolak')}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Tolak
                          </button>
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => handleLepaskanBimbingan(bimbingan.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Lepaskan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tawarkan sebagai:
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedPeran('pembimbing1')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedPeran === 'pembimbing1'
                ? 'bg-red-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pembimbing 1
          </button>
          <button
            onClick={() => setSelectedPeran('pembimbing2')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedPeran === 'pembimbing2'
                ? 'bg-red-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pembimbing 2
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Tawaran aktif: {tawaranAktif}/5
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Mahasiswa Tersedia</h2>
        </div>
        <div className="divide-y">
          {mahasiswaList
            .filter(m => 
              (selectedPeran === 'pembimbing1' && m.available_for_p1) ||
              (selectedPeran === 'pembimbing2' && m.available_for_p2)
            )
            .map((mahasiswa) => (
            <div key={mahasiswa.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{mahasiswa.user.name}</h3>
                <p className="text-sm text-gray-600">
                  NIM: {mahasiswa.nim} | Prodi: {mahasiswa.prodi} | Kelas: {mahasiswa.kelas}
                </p>
                <div className="flex gap-2 mt-1">
                  {mahasiswa.has_pembimbing1 && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                      Sudah ada P1
                    </span>
                  )}
                  {mahasiswa.has_pembimbing2 && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                      Sudah ada P2
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleTawarkan(mahasiswa.id)}
                disabled={kuotaPenuh || tawaranAktif >= 5}
                className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tawarkan
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Ajuan dari Mahasiswa</h2>
        </div>
        <div className="divide-y">
          {pengajuanList.filter(p => p.diinisiasi_oleh === 'mahasiswa' && p.status === 'MENUNGGU_PERSETUJUAN_DOSEN').map((pengajuan) => (
            <div key={pengajuan.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{pengajuan.mahasiswa.user.name}</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {pengajuan.peran_yang_diajukan === 'pembimbing1' ? 'P1' : 'P2'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">NIM: {pengajuan.mahasiswa.nim}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Mengajukan sebagai {pengajuan.peran_yang_diajukan}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(pengajuan.id, 'terima')}
                    disabled={kuotaPenuh}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Terima
                  </button>
                  <button
                    onClick={() => handleAction(pengajuan.id, 'tolak')}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pengajuanList.filter(p => p.diinisiasi_oleh === 'mahasiswa' && p.status === 'MENUNGGU_PERSETUJUAN_DOSEN').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Belum ada ajuan dari mahasiswa</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Tawaran Saya</h2>
        </div>
        <div className="divide-y">
          {pengajuanList.filter(p => p.diinisiasi_oleh === 'dosen').map((pengajuan) => (
            <div key={pengajuan.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{pengajuan.mahasiswa.user.name}</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {pengajuan.peran_yang_diajukan === 'pembimbing1' ? 'P1' : 'P2'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">NIM: {pengajuan.mahasiswa.nim}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {pengajuan.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA' && (
                      <>
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-600">Menunggu Persetujuan Mahasiswa</span>
                      </>
                    )}
                    {pengajuan.status === 'DISETUJUI' && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Disetujui</span>
                      </>
                    )}
                    {pengajuan.status === 'DITOLAK' && (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">Ditolak</span>
                      </>
                    )}
                  </div>
                </div>
                {pengajuan.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA' && (
                  <button
                    onClick={() => handleAction(pengajuan.id, 'batalkan')}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Batalkan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
