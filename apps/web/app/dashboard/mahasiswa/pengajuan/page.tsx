'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface Dosen {
  id: number;
  user: { id: number; name: string; email: string };
  nip: string;
  prodi: string;
  kuota_bimbingan: number;
  jumlah_bimbingan: number;
  available: boolean;
}

interface Pengajuan {
  id: number;
  peran_yang_diajukan: string;
  diinisiasi_oleh: string;
  status: string;
  dosen: {
    id: number;
    user: { name: string; email: string };
  };
  created_at: string;
}

export default function PengajuanMahasiswaPage() {
  const { user } = useAuth();
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [pengajuanList, setPengajuanList] = useState<Pengajuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeran, setSelectedPeran] = useState<'pembimbing1' | 'pembimbing2'>('pembimbing1');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dosenRes, pengajuanRes] = await Promise.all([
        fetch('http://localhost:3002/api/pengajuan/dosen-tersedia', {
          headers: { 'x-user-id': user?.id?.toString() || '' },
        }),
        fetch('http://localhost:3002/api/pengajuan/mahasiswa', {
          headers: { 'x-user-id': user?.id?.toString() || '' },
        }),
      ]);

      const dosenData = await dosenRes.json();
      const pengajuanData = await pengajuanRes.json();

      setDosenList(dosenData.data || []);
      setPengajuanList(pengajuanData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAjukan = async (dosenId: number) => {
    try {
      const res = await fetch('http://localhost:3002/api/pengajuan/mahasiswa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
        },
        body: JSON.stringify({ dosenId, peran: selectedPeran }),
      });

      const data = await res.json();
      if (data.status === 'sukses') {
        alert(`Berhasil mengajukan ke ${selectedPeran}`);
        fetchData();
      } else {
        alert(data.message || 'Gagal mengajukan');
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

  const pengajuanP1 = pengajuanList.filter(p => p.peran_yang_diajukan === 'pembimbing1');
  const pengajuanP2 = pengajuanList.filter(p => p.peran_yang_diajukan === 'pembimbing2');
  const pengajuanAktifP1 = pengajuanP1.filter(p => p.status === 'MENUNGGU_PERSETUJUAN_DOSEN' && p.diinisiasi_oleh === 'mahasiswa').length;
  const pengajuanAktifP2 = pengajuanP2.filter(p => p.status === 'MENUNGGU_PERSETUJUAN_DOSEN' && p.diinisiasi_oleh === 'mahasiswa').length;
  const hasPembimbing1 = pengajuanP1.some(p => p.status === 'DISETUJUI');
  const hasPembimbing2 = pengajuanP2.some(p => p.status === 'DISETUJUI');

  const filteredDosen = dosenList
    .filter(d => d.available)
    .filter(d => 
      d.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nip.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const totalPages = Math.ceil(filteredDosen.length / itemsPerPage);
  const paginatedDosen = filteredDosen.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pengajuan Pembimbing</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            {hasPembimbing1 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm">Pembimbing 1</span>
          </div>
          <div className="flex items-center gap-2">
            {hasPembimbing2 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm">Pembimbing 2</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ajukan sebagai:
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedPeran('pembimbing1')}
            disabled={hasPembimbing1}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedPeran === 'pembimbing1'
                ? 'bg-red-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${hasPembimbing1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Pembimbing 1 {pengajuanAktifP1 > 0 && `(${pengajuanAktifP1}/3)`}
          </button>
          <button
            onClick={() => setSelectedPeran('pembimbing2')}
            disabled={hasPembimbing2}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedPeran === 'pembimbing2'
                ? 'bg-red-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${hasPembimbing2 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Pembimbing 2 {pengajuanAktifP2 > 0 && `(${pengajuanAktifP2}/3)`}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b space-y-3">
          <h2 className="text-lg font-semibold">Dosen Tersedia</h2>
          <input
            type="text"
            placeholder="Cari nama atau NIP dosen..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
          />
        </div>
        <div className="divide-y">
          {paginatedDosen.map((dosen) => (
            <div key={dosen.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{dosen.user.name}</h3>
                <p className="text-sm text-gray-600">NIP: {dosen.nip}</p>
                <p className="text-sm text-gray-500">
                  Telah membimbing {dosen.jumlah_bimbingan} dari {dosen.kuota_bimbingan} mahasiswa
                </p>
              </div>
              <button
                onClick={() => handleAjukan(dosen.id)}
                disabled={
                  (selectedPeran === 'pembimbing1' && (hasPembimbing1 || pengajuanAktifP1 >= 3)) ||
                  (selectedPeran === 'pembimbing2' && (hasPembimbing2 || pengajuanAktifP2 >= 3))
                }
                className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajukan
              </button>
            </div>
          ))}
          {paginatedDosen.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>Tidak ada dosen yang ditemukan</p>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredDosen.length)} dari {filteredDosen.length} dosen
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === page
                      ? 'bg-red-900 text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Pengajuan Saya</h2>
        </div>
        <div className="divide-y">
          {pengajuanList.filter(p => p.diinisiasi_oleh === 'mahasiswa').map((pengajuan) => (
            <div key={pengajuan.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{pengajuan.dosen.user.name}</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {pengajuan.peran_yang_diajukan === 'pembimbing1' ? 'P1' : 'P2'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {pengajuan.status === 'MENUNGGU_PERSETUJUAN_DOSEN' && (
                      <>
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-600">Menunggu Persetujuan Dosen</span>
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
                {pengajuan.status === 'MENUNGGU_PERSETUJUAN_DOSEN' && (
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

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Tawaran dari Dosen</h2>
        </div>
        <div className="divide-y">
          {pengajuanList.filter(p => p.diinisiasi_oleh === 'dosen' && p.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA').map((pengajuan) => (
            <div key={pengajuan.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{pengajuan.dosen.user.name}</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {pengajuan.peran_yang_diajukan === 'pembimbing1' ? 'P1' : 'P2'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Menawarkan diri sebagai {pengajuan.peran_yang_diajukan}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(pengajuan.id, 'terima')}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
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
          {pengajuanList.filter(p => p.diinisiasi_oleh === 'dosen' && p.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Belum ada tawaran dari dosen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
