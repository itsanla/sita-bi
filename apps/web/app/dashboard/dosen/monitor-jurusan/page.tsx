'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRBAC } from '@/hooks/useRBAC';
import request from '@/lib/api';
import PeriodeGuard from '@/components/shared/PeriodeGuard';
import {
  Users,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Mahasiswa {
  id: number;
  nim: string;
  prodi: string;
  kelas: string;
  siap_sidang?: boolean;
  gagal_sidang?: boolean;
  user: {
    name: string;
    email: string;
  };
  tugasAkhir?: {
    id: number;
    judul: string;
    status: string;
    peranDosenTa: {
      peran: string;
      dosen: {
        user: { name: string };
      };
    }[];
    bimbinganTa: {
      id: number;
      sesi_ke: number;
      status_bimbingan: string;
      tanggal_bimbingan: string | null;
      peran: string;
    }[];
    dokumenTa: {
      divalidasi_oleh_p1: number | null;
      divalidasi_oleh_p2: number | null;
    }[];
  };
}

export default function MonitorJurusanPage() {
  const { user } = useAuth();
  const { isJurusan } = useRBAC();
  const [allMahasiswa, setAllMahasiswa] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filter dan paginasi di frontend
  const filteredMahasiswa = allMahasiswa.filter(mhs => {
    const matchesSearch = !search || 
      mhs.user.name.toLowerCase().includes(search.toLowerCase()) ||
      mhs.nim.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredMahasiswa.length / limit);
  const startIndex = (page - 1) * limit;
  const mahasiswaList = filteredMahasiswa.slice(startIndex, startIndex + limit);

  useEffect(() => {
    const fetchMahasiswa = async () => {
      try {
        setLoading(true);
        const response = await request<{ data: Mahasiswa[] }>('/users/mahasiswa/prodi');
        setAllMahasiswa(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching mahasiswa:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && isJurusan) {
      fetchMahasiswa();
    }
  }, [user, isJurusan]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (!isJurusan) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke fitur monitor jurusan.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai': return 'text-green-600 bg-green-100';
      case 'dijadwalkan': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getValidBimbinganCount = (bimbinganTa: any[]) => {
    return bimbinganTa.filter(b => b.status_bimbingan === 'selesai').length;
  };

  const isDrafValid = (dokumenTa: any[]) => {
    const latest = dokumenTa[0];
    return latest && latest.divalidasi_oleh_p1 && latest.divalidasi_oleh_p2;
  };

  const handleViewPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/mahasiswa-prodi`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Download for mobile
          const a = document.createElement('a');
          a.href = url;
          a.download = `laporan-mahasiswa-jurusan.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          // Open in new tab for desktop
          window.open(url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
    }
  };

  return (
    <PeriodeGuard>
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Monitor Jurusan</h1>
                  <p className="text-gray-600">Pantau progress semua mahasiswa di periode aktif</p>
                </div>
              </div>
              <button
                onClick={handleViewPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <FileText size={16} />
                <span className="hidden sm:inline">Download Laporan PDF</span>
              </button>
            </div>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={12} />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total Mahasiswa</p>
                  <p className="text-lg md:text-xl font-semibold text-gray-900">{filteredMahasiswa.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="text-red-600" size={12} />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Gagal Sidang</p>
                  <p className="text-lg md:text-xl font-semibold text-gray-900">
                    {filteredMahasiswa.filter(m => m.gagal_sidang).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-amber-600" size={12} />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Layak Sidang</p>
                  <p className="text-lg md:text-xl font-semibold text-gray-900">
                    {filteredMahasiswa.filter(m => m.siap_sidang).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-purple-600" size={12} />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Selesai</p>
                  <p className="text-lg md:text-xl font-semibold text-gray-900">
                    {filteredMahasiswa.filter(m => 
                      m.tugasAkhir?.status === 'LULUS_TANPA_REVISI' || 
                      m.tugasAkhir?.status === 'LULUS_DENGAN_REVISI'
                    ).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Daftar Mahasiswa */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Daftar Mahasiswa</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="Cari nama atau NIM..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-48 md:w-64"
                  />
                  <div className="text-xs md:text-sm text-gray-600 text-center sm:text-left">
                    {filteredMahasiswa.length} mahasiswa
                  </div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : (
              <div className="space-y-4">
                {mahasiswaList.map((mahasiswa) => {
                  const validBimbingan = mahasiswa.tugasAkhir ? getValidBimbinganCount(mahasiswa.tugasAkhir.bimbinganTa) : 0;
                  const isDrafValidated = mahasiswa.tugasAkhir ? isDrafValid(mahasiswa.tugasAkhir.dokumenTa) : false;
                  const isEligible = mahasiswa.siap_sidang;
                  const isExpanded = selectedMahasiswa === mahasiswa.id;

                  return (
                    <div key={mahasiswa.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedMahasiswa(isExpanded ? null : mahasiswa.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base flex-shrink-0">
                              {mahasiswa.user.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900 text-sm md:text-base truncate">{mahasiswa.user.name}</h3>
                              <p className="text-xs md:text-sm text-gray-600">{mahasiswa.nim} • {mahasiswa.kelas}</p>
                              {mahasiswa.tugasAkhir && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 md:line-clamp-1">
                                  {mahasiswa.tugasAkhir.judul}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3 flex-shrink-0 ml-2">
                            {mahasiswa.tugasAkhir ? (
                              <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                isEligible ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {isEligible ? 'Layak Sidang' : 'Belum Layak'}
                              </div>
                            ) : (
                              <div className="px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
                                Belum Ada TA
                              </div>
                            )}
                            {isExpanded ? <ChevronUp size={16} className="md:w-5 md:h-5" /> : <ChevronDown size={16} className="md:w-5 md:h-5" />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && mahasiswa.tugasAkhir && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Info Pembimbing */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Pembimbing</h4>
                              <div className="grid md:grid-cols-2 gap-3">
                                {mahasiswa.tugasAkhir.peranDosenTa.map((peran) => (
                                  <div key={peran.peran} className="flex items-center gap-2 p-2 bg-white rounded border">
                                    <span className="text-sm font-medium">
                                      {peran.peran === 'pembimbing1' ? 'Pembimbing 1' : 'Pembimbing 2'}:
                                    </span>
                                    <span className="text-sm text-gray-700">{peran.dosen.user.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Status Kelayakan */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Status Kelayakan Sidang</h4>
                              <div className="grid md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-3 p-3 bg-white rounded border">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    validBimbingan >= 8 ? 'bg-green-100' : 'bg-red-100'
                                  }`}>
                                    {validBimbingan >= 8 ? (
                                      <CheckCircle className="text-green-600" size={16} />
                                    ) : (
                                      <XCircle className="text-red-600" size={16} />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Bimbingan Valid</p>
                                    <p className="font-semibold text-gray-900">{validBimbingan}/8 sesi</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded border">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isDrafValidated ? 'bg-green-100' : 'bg-red-100'
                                  }`}>
                                    {isDrafValidated ? (
                                      <CheckCircle className="text-green-600" size={16} />
                                    ) : (
                                      <XCircle className="text-red-600" size={16} />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Validasi Draf</p>
                                    <p className={`font-semibold ${
                                      isDrafValidated ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                      {isDrafValidated ? 'Valid' : 'Belum Valid'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Rincian Bimbingan */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Rincian Bimbingan</h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {mahasiswa.tugasAkhir.bimbinganTa.map((sesi) => (
                                  <div key={sesi.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Sesi {sesi.sesi_ke}</span>
                                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(sesi.status_bimbingan)}`}>
                                        {sesi.status_bimbingan}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>{sesi.peran === 'pembimbing1' ? 'P1' : 'P2'}</span>
                                      {sesi.tanggal_bimbingan && (
                                        <span>{new Date(sesi.tanggal_bimbingan).toLocaleDateString('id-ID')}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Halaman {page} dari {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PeriodeGuard>
  );
}