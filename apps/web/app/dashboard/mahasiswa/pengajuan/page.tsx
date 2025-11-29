'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Clock, AlertCircle, Search, UserCheck, Send, X, Users, Award, UserX, HelpCircle } from 'lucide-react';

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
  updated_at: string;
}

interface PembimbingAktif {
  id: number;
  peran: string;
  dosen: {
    id: number;
    user: { name: string; email: string };
  };
  pengajuanPelepasanBimbingan?: Array<{
    id: number;
    diajukan_oleh_user_id: number;
    status: string;
  }>;
}

interface PengajuanPelepasan {
  id: number;
  peran_dosen_ta_id: number;
  diajukan_oleh_user_id: number;
  status: string;
  diajukanOleh: {
    id: number;
    name: string;
  };
  created_at: string;
}

export default function PengajuanMahasiswaPage() {
  const { user } = useAuth();
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [pengajuanList, setPengajuanList] = useState<Pengajuan[]>([]);
  const [pembimbingAktif, setPembimbingAktif] = useState<PembimbingAktif[]>([]);
  const [pengajuanPelepasan, setPengajuanPelepasan] = useState<PengajuanPelepasan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeran, setSelectedPeran] = useState<'pembimbing1' | 'pembimbing2'>('pembimbing1');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [riwayatSearchQuery, setRiwayatSearchQuery] = useState('');
  const [riwayatSortBy, setRiwayatSortBy] = useState<'terbaru' | 'terlama'>('terbaru');
  const [riwayatFilterStatus, setRiwayatFilterStatus] = useState<string>('semua');
  const [riwayatPage, setRiwayatPage] = useState(1);
  const [dosenSortBy, setDosenSortBy] = useState<'bimbingan_asc' | 'bimbingan_desc' | 'nama_asc' | 'nama_desc'>('bimbingan_asc');
  const itemsPerPage = 5;

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
      setPembimbingAktif(pengajuanData.pembimbingAktif || []);
      setPengajuanPelepasan(pengajuanData.pelepasan || []);
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

  const pengajuanP1 = pengajuanList.filter(p => p.peran_yang_diajukan === 'pembimbing1');
  const pengajuanP2 = pengajuanList.filter(p => p.peran_yang_diajukan === 'pembimbing2');
  const pengajuanAktifP1 = pengajuanP1.filter(p => p.status === 'MENUNGGU_PERSETUJUAN_DOSEN' && p.diinisiasi_oleh === 'mahasiswa').length;
  const pengajuanAktifP2 = pengajuanP2.filter(p => p.status === 'MENUNGGU_PERSETUJUAN_DOSEN' && p.diinisiasi_oleh === 'mahasiswa').length;
  const hasPembimbing1 = pembimbingAktif.some(p => p.peran === 'pembimbing1');
  const hasPembimbing2 = pembimbingAktif.some(p => p.peran === 'pembimbing2');

  const filteredDosen = dosenList
    .filter(d => d.available)
    .filter(d => 
      d.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nip.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (dosenSortBy === 'bimbingan_asc') {
        return a.jumlah_bimbingan - b.jumlah_bimbingan;
      } else if (dosenSortBy === 'bimbingan_desc') {
        return b.jumlah_bimbingan - a.jumlah_bimbingan;
      } else if (dosenSortBy === 'nama_asc') {
        return a.user.name.localeCompare(b.user.name);
      } else {
        return b.user.name.localeCompare(a.user.name);
      }
    });

  const totalPages = Math.ceil(filteredDosen.length / itemsPerPage);
  const paginatedDosen = filteredDosen.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filteredRiwayat = pengajuanList
    .filter(p => p.diinisiasi_oleh === 'mahasiswa')
    .filter(p => {
      const matchSearch = p.dosen.user.name.toLowerCase().includes(riwayatSearchQuery.toLowerCase());
      const matchStatus = riwayatFilterStatus === 'semua' || p.status === riwayatFilterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return riwayatSortBy === 'terbaru' ? dateB - dateA : dateA - dateB;
    });

  const totalRiwayatPages = Math.ceil(filteredRiwayat.length / itemsPerPage);
  const paginatedRiwayat = filteredRiwayat.slice(
    (riwayatPage - 1) * itemsPerPage,
    riwayatPage * itemsPerPage
  );

  const tawaranDosen = pengajuanList.filter(p => p.diinisiasi_oleh === 'dosen');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7f1d1d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-700">Pengajuan Pembimbing</h1>
            <p className="text-gray-500 mt-1">Ajukan dosen pembimbing untuk tugas akhir Anda</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-base border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pembimbing 1</p>
                <p className="text-3xl font-bold text-gray-700 mt-2">
                  {hasPembimbing1 ? '✓' : pengajuanAktifP1 > 0 ? pengajuanAktifP1 : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {hasPembimbing1 ? 'Sudah disetujui' : pengajuanAktifP1 > 0 ? `${pengajuanAktifP1}/3 pengajuan aktif` : 'Belum ada pengajuan'}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${hasPembimbing1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                {hasPembimbing1 ? (
                  <CheckCircle className="w-7 h-7 text-green-600" />
                ) : (
                  <UserCheck className="w-7 h-7 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-base border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pembimbing 2</p>
                <p className="text-3xl font-bold text-gray-700 mt-2">
                  {hasPembimbing2 ? '✓' : pengajuanAktifP2 > 0 ? pengajuanAktifP2 : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {hasPembimbing2 ? 'Sudah disetujui' : pengajuanAktifP2 > 0 ? `${pengajuanAktifP2}/3 pengajuan aktif` : 'Belum ada pengajuan'}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${hasPembimbing2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                {hasPembimbing2 ? (
                  <CheckCircle className="w-7 h-7 text-green-600" />
                ) : (
                  <UserCheck className="w-7 h-7 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] rounded-xl shadow-base p-6 text-white hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-100 uppercase tracking-wide">Total Dosen</p>
                <p className="text-3xl font-bold mt-2">{dosenList.length}</p>
                <p className="text-xs text-red-100 mt-1">{filteredDosen.length} tersedia</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Selector Peran */}
        <div className="bg-white rounded-xl shadow-base border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Pilih Peran Pembimbing
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedPeran('pembimbing1')}
              disabled={hasPembimbing1}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                selectedPeran === 'pembimbing1'
                  ? 'bg-[#7f1d1d] text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${hasPembimbing1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Award className="w-5 h-5" />
                <span>Pembimbing 1</span>
                {pengajuanAktifP1 > 0 && <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">({pengajuanAktifP1}/3)</span>}
              </div>
            </button>
            <button
              onClick={() => setSelectedPeran('pembimbing2')}
              disabled={hasPembimbing2}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                selectedPeran === 'pembimbing2'
                  ? 'bg-[#7f1d1d] text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${hasPembimbing2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Award className="w-5 h-5" />
                <span>Pembimbing 2</span>
                {pengajuanAktifP2 > 0 && <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">({pengajuanAktifP2}/3)</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Dosen List */}
        <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-700">Daftar Dosen Tersedia</h2>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  Pilih dosen yang tersedia dan ajukan sebagai pembimbing. Anda dapat mengajukan maksimal 3 dosen untuk setiap peran pembimbing.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIP dosen..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                />
              </div>
              <select
                value={dosenSortBy}
                onChange={(e) => {
                  setDosenSortBy(e.target.value as 'bimbingan_asc' | 'bimbingan_desc' | 'nama_asc' | 'nama_desc');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
              >
                <option value="bimbingan_asc">Membimbing Tersedikit</option>
                <option value="bimbingan_desc">Membimbing Terbanyak</option>
                <option value="nama_asc">Nama A-Z</option>
                <option value="nama_desc">Nama Z-A</option>
              </select>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {paginatedDosen.map((dosen) => (
              <div key={dosen.id} className="p-3 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {dosen.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{dosen.user.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-gray-500">NIP: {dosen.nip}</p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5 flex items-center">
                            <div 
                              className="bg-[#7f1d1d] h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${(dosen.jumlah_bimbingan / dosen.kuota_bimbingan) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {dosen.jumlah_bimbingan}/{dosen.kuota_bimbingan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAjukan(dosen.id)}
                    disabled={
                      (selectedPeran === 'pembimbing1' && (hasPembimbing1 || pengajuanAktifP1 >= 3)) ||
                      (selectedPeran === 'pembimbing2' && (hasPembimbing2 || pengajuanAktifP2 >= 3))
                    }
                    className="px-4 py-2 bg-[#7f1d1d] text-white rounded-lg text-sm font-semibold hover:bg-[#991b1b] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Ajukan
                  </button>
                </div>
              </div>
            ))}
            {paginatedDosen.length === 0 && (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Tidak ada dosen yang ditemukan</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredDosen.length)} dari {filteredDosen.length} dosen
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-[#7f1d1d] text-white shadow-md'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Riwayat Pengajuan */}
        <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-700">Riwayat Pengajuan</h2>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  Riwayat lengkap pengajuan pembimbing yang Anda ajukan beserta tanggal, waktu, dan status responsnya.
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama dosen..."
                  value={riwayatSearchQuery}
                  onChange={(e) => {
                    setRiwayatSearchQuery(e.target.value);
                    setRiwayatPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
                />
              </div>
              <select
                value={riwayatSortBy}
                onChange={(e) => {
                  setRiwayatSortBy(e.target.value as 'terbaru' | 'terlama');
                  setRiwayatPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
              >
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
              </select>
              <select
                value={riwayatFilterStatus}
                onChange={(e) => {
                  setRiwayatFilterStatus(e.target.value);
                  setRiwayatPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f1d1d]/10 focus:border-[#7f1d1d] transition-all text-sm"
              >
                <option value="semua">Semua Status</option>
                <option value="MENUNGGU_PERSETUJUAN_DOSEN">Menunggu</option>
                <option value="DISETUJUI">Diterima</option>
                <option value="DITOLAK">Ditolak</option>
                <option value="DIBATALKAN_MAHASISWA">Dibatalkan</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {paginatedRiwayat.map((pengajuan) => {
              const createdDate = new Date(pengajuan.created_at);
              const updatedDate = new Date(pengajuan.updated_at);
              const formatWIB = (date: Date) => {
                return new Intl.DateTimeFormat('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(date);
              };

              const getStatusInfo = (status: string) => {
                switch (status) {
                  case 'MENUNGGU_PERSETUJUAN_DOSEN':
                    return { icon: Clock, color: 'amber', text: 'Menunggu' };
                  case 'DISETUJUI':
                    return { icon: CheckCircle, color: 'green', text: 'Diterima' };
                  case 'DITOLAK':
                    return { icon: XCircle, color: 'red', text: 'Ditolak' };
                  case 'DIBATALKAN_MAHASISWA':
                    return { icon: X, color: 'gray', text: 'Dibatalkan' };
                  default:
                    return { icon: AlertCircle, color: 'gray', text: status };
                }
              };

              const statusInfo = getStatusInfo(pengajuan.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={pengajuan.id} className="p-3 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {pengajuan.dosen.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm">{pengajuan.dosen.user.name}</h3>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {pengajuan.peran_yang_diajukan === 'pembimbing1' ? 'P1' : 'P2'}
                          </span>
                          <div className="flex items-center gap-1">
                            <StatusIcon className={`w-3.5 h-3.5 text-${statusInfo.color}-500`} />
                            <span className={`text-xs text-${statusInfo.color}-600 font-medium`}>{statusInfo.text}</span>
                          </div>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-gray-500">
                            Diajukan: {formatWIB(createdDate)} WIB
                          </p>
                          {pengajuan.status !== 'MENUNGGU_PERSETUJUAN_DOSEN' && (
                            <p className="text-xs text-gray-500">
                              Respon: {formatWIB(updatedDate)} WIB
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {pengajuan.status === 'MENUNGGU_PERSETUJUAN_DOSEN' && (
                      <button
                        onClick={() => handleAction(pengajuan.id, 'batalkan')}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredRiwayat.length === 0 && (
              <div className="p-8 text-center">
                <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Belum ada pengajuan yang dikirim</p>
              </div>
            )}
          </div>
          {totalRiwayatPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {(riwayatPage - 1) * itemsPerPage + 1} - {Math.min(riwayatPage * itemsPerPage, filteredRiwayat.length)} dari {filteredRiwayat.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRiwayatPage(p => Math.max(1, p - 1))}
                  disabled={riwayatPage === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  Prev
                </button>
                <button
                  onClick={() => setRiwayatPage(p => Math.min(totalRiwayatPages, p + 1))}
                  disabled={riwayatPage === totalRiwayatPages}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pembimbing Aktif */}
        {pembimbingAktif.length > 0 && (
          <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-700">Pembimbing Aktif</h2>
              <p className="text-sm text-gray-500 mt-1">Dosen pembimbing yang sudah disetujui</p>
            </div>
            <div className="divide-y divide-gray-200">
              {pembimbingAktif.map((pembimbing) => {
                const pengajuanAktif = pembimbing.pengajuanPelepasanBimbingan?.[0];
                const isUserYangMengajukan = pengajuanAktif?.diajukan_oleh_user_id === user?.id;

                return (
                  <div key={pembimbing.id} className="p-3 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {pembimbing.dosen.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm">{pembimbing.dosen.user.name}</h3>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {pembimbing.peran === 'pembimbing1' ? 'P1' : 'P2'}
                            </span>
                            {pengajuanAktif && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                Pengajuan Pelepasan
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {pengajuanAktif ? (
                        isUserYangMengajukan ? (
                          <span className="text-xs text-gray-500">Menunggu konfirmasi dosen</span>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleKonfirmasiPelepasan(pengajuanAktif.id, 'konfirmasi')}
                              className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Setuju
                            </button>
                            <button
                              onClick={() => handleKonfirmasiPelepasan(pengajuanAktif.id, 'tolak')}
                              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Tolak
                            </button>
                          </div>
                        )
                      ) : (
                        <button
                          onClick={() => handleLepaskanBimbingan(pembimbing.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
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

        {/* Tawaran dari Dosen */}
        <div className="bg-white rounded-xl shadow-base border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-700">Tawaran dari Dosen</h2>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  Dosen yang menawarkan diri untuk membimbing Anda. Anda dapat menerima atau menolak tawaran ini.
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Dosen yang menawarkan diri sebagai pembimbing Anda</p>
          </div>
          <div className="divide-y divide-gray-200">
            {tawaranDosen.map((pengajuan) => {
              const createdDate = new Date(pengajuan.created_at);
              const formatWIB = (date: Date) => {
                return new Intl.DateTimeFormat('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(date);
              };

              return (
                <div key={pengajuan.id} className="p-3 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {pengajuan.dosen.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm">{pengajuan.dosen.user.name}</h3>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {pengajuan.peran_yang_diajukan === 'pembimbing1' ? 'P1' : 'P2'}
                          </span>
                          {pengajuan.status === 'DITOLAK' && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Ditolak
                            </span>
                          )}
                          {pengajuan.status === 'DISETUJUI' && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Disetujui
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Diajukan: {formatWIB(createdDate)} WIB
                        </p>
                      </div>
                    </div>
                    {pengajuan.status === 'MENUNGGU_PERSETUJUAN_MAHASISWA' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAction(pengajuan.id, 'terima')}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Terima
                        </button>
                        <button
                          onClick={() => handleAction(pengajuan.id, 'tolak')}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {tawaranDosen.length === 0 && (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Belum ada tawaran dari dosen</p>
                <p className="text-gray-400 text-xs mt-1">Tawaran akan muncul di sini ketika dosen menawarkan diri</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
