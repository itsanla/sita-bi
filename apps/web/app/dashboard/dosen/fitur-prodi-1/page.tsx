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

export default function MonitorProdiPage() {
  const { user } = useAuth();
  const { canAccessProdi, isProdi } = useRBAC();
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchMahasiswa = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(search && { search }),
        });
        const response = await request<{ 
          data: Mahasiswa[];
          total: number;
          totalPages: number;
        }>(`/users/mahasiswa/prodi?${params}`);
        setMahasiswaList(response.data?.data || []);
        setTotal(response.data?.total || 0);
        setTotalPages(response.data?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching mahasiswa:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && isProdi) {
      fetchMahasiswa();
    }
  }, [user, isProdi, page, search]);

  if (!isProdi) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke fitur monitor prodi.</p>
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

  return (
    <PeriodeGuard>
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Monitor Prodi {canAccessProdi}</h1>
                <p className="text-gray-600">Pantau progress semua mahasiswa di prodi Anda</p>
              </div>
            </div>
          </div>

          {/* Statistik */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Mahasiswa</p>
                  <p className="text-xl font-semibold text-gray-900">{filteredMahasiswa.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-green-600" size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Memiliki TA</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {filteredMahasiswa.filter(m => m.tugasAkhir).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-amber-600" size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Layak Sidang</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {filteredMahasiswa.filter(m => 
                      m.tugasAkhir && 
                      getValidBimbinganCount(m.tugasAkhir.bimbinganTa) >= 8 && 
                      isDrafValid(m.tugasAkhir.dokumenTa)
                    ).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-purple-600" size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Selesai</p>
                  <p className="text-xl font-semibold text-gray-900">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Daftar Mahasiswa</h2>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Cari nama atau NIM..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
                <div className="text-sm text-gray-600">
                  {total} mahasiswa
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
                  const isEligible = validBimbingan >= 8 && isDrafValidated;
                  const isExpanded = selectedMahasiswa === mahasiswa.id;

                  return (
                    <div key={mahasiswa.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedMahasiswa(isExpanded ? null : mahasiswa.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {mahasiswa.user.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{mahasiswa.user.name}</h3>
                              <p className="text-sm text-gray-600">{mahasiswa.nim} • {mahasiswa.kelas}</p>
                              {mahasiswa.tugasAkhir && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {mahasiswa.tugasAkhir.judul}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {mahasiswa.tugasAkhir ? (
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isEligible ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {isEligible ? 'Layak Sidang' : 'Belum Layak'}
                              </div>
                            ) : (
                              <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                Belum Ada TA
                              </div>
                            )}
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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