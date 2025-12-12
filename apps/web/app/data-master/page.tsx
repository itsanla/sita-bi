'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from 'lucide-react';
import Header from '../components/landing-page/Header';

interface Periode {
  tahun: number;
  nama: string;
}

interface Dosen {
  id: number;
  nama: string;
  nip: string;
}

interface JudulTA {
  no: number;
  nim: string;
  nama_mahasiswa: string;
  judul: string;
  tahun: number;
}

interface JadwalTA {
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan: string;
  nim: string;
  nama_mahasiswa: string;
  judul: string;
  pembimbing_1: string;
  pembimbing_2: string;
  penguji_1: string;
  penguji_2: string;
  penguji_3: string;
  tahun: number;
}

interface JadwalTADosen {
  nama_dosen: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan: string;
  nim: string;
  nama_mahasiswa: string;
  judul: string;
  peran: string;
  tahun: number;
}

type TabType = 'judul' | 'jadwal' | 'jadwal-dosen';

const HEADER_NO = 'No';
const HEADER_NIM = 'NIM';
const HEADER_NAMA = 'Nama';
const HEADER_JUDUL = 'Judul';

export default function DataMasterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('judul');
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<number | null>(null);
  const [selectedDosen, setSelectedDosen] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  const [judulData, setJudulData] = useState<{
    data: JudulTA[];
    total: number;
    totalPages: number;
  }>({ data: [], total: 0, totalPages: 0 });
  const [jadwalData, setJadwalData] = useState<{
    data: JadwalTA[];
    total: number;
    totalPages: number;
  }>({ data: [], total: 0, totalPages: 0 });
  const [jadwalDosenData, setJadwalDosenData] = useState<{
    data: JadwalTADosen[];
    total: number;
    totalPages: number;
  }>({ data: [], total: 0, totalPages: 0 });

  const fetchData = useCallback(async () => {
    if (selectedPeriode === null) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tahun: selectedPeriode.toString(),
        search: '',
        page: '1',
        limit: '1000',
      });

      if (activeTab === 'jadwal-dosen' && selectedDosen !== null) {
        params.append('dosen_id', selectedDosen.toString());
      }

      let endpoint = '';
      if (activeTab === 'judul') endpoint = 'judul-ta';
      else if (activeTab === 'jadwal') endpoint = 'jadwal-ta';
      else endpoint = 'jadwal-ta-dosen';

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const res = await fetch(
        `${apiUrl}/api/data-master/${endpoint}?${params}`,
      );
      const json = await res.json();

      if (json.status === 'sukses') {
        if (activeTab === 'judul') {
          setJudulData({
            data: json.data,
            total: json.pagination.total,
            totalPages: json.pagination.totalPages,
          });
        } else if (activeTab === 'jadwal') {
          setJadwalData({
            data: json.data,
            total: json.pagination.total,
            totalPages: json.pagination.totalPages,
          });
        } else {
          setJadwalDosenData({
            data: json.data,
            total: json.pagination.total,
            totalPages: json.pagination.totalPages,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedPeriode, search, page, selectedDosen]);

  useEffect(() => {
    const fetchPeriode = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/data-master/periode`);
        const json = await res.json();
        if (json.status === 'sukses' && json.data.length > 0) {
          setPeriodeList(json.data);
          setSelectedPeriode(json.data[0].tahun);
        }
      } catch (error) {
        console.error('Error fetching periode:', error);
      }
    };

    const fetchDosen = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/data-master/dosen`);
        const json = await res.json();
        if (json.status === 'sukses' && json.data.length > 0) {
          setDosenList(json.data);
        }
      } catch (error) {
        console.error('Error fetching dosen:', error);
      }
    };

    void fetchPeriode();
    void fetchDosen();
  }, []);

  useEffect(() => {
    void fetchData();
  }, [activeTab, selectedPeriode, selectedDosen]);

  useEffect(() => {
    setPage(1);
  }, [search, activeTab, selectedPeriode, selectedDosen]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePeriodeChange = (tahun: number) => {
    setSelectedPeriode(tahun);
    setPage(1);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    if (tab !== 'jadwal-dosen') {
      setSelectedDosen(null);
    }
  };

  const filteredData = useMemo(() => {
    let data: any[] = [];
    if (activeTab === 'judul') data = judulData.data;
    else if (activeTab === 'jadwal') data = jadwalData.data;
    else data = jadwalDosenData.data;

    if (!search) return data;

    const searchLower = search.toLowerCase();
    return data.filter((item: any) => {
      if (activeTab === 'judul') {
        return (
          item.nim?.toLowerCase().includes(searchLower) ||
          item.nama_mahasiswa?.toLowerCase().includes(searchLower) ||
          item.judul?.toLowerCase().includes(searchLower)
        );
      } else if (activeTab === 'jadwal') {
        return (
          item.nim?.toLowerCase().includes(searchLower) ||
          item.nama_mahasiswa?.toLowerCase().includes(searchLower) ||
          item.penguji_1?.toLowerCase().includes(searchLower) ||
          item.penguji_2?.toLowerCase().includes(searchLower) ||
          item.penguji_3?.toLowerCase().includes(searchLower)
        );
      } else {
        return (
          item.nama_dosen?.toLowerCase().includes(searchLower) ||
          item.nim?.toLowerCase().includes(searchLower) ||
          item.nama_mahasiswa?.toLowerCase().includes(searchLower)
        );
      }
    });
  }, [activeTab, judulData.data, jadwalData.data, jadwalDosenData.data, search]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        mode="static"
        activePage="data-master"
      />

      <div className="pt-16">
      <div className="bg-red-900 text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Data Master Tugas Akhir</h1>
          <p className="text-sm md:text-base text-red-100">
            Database Tugas Akhir Jurusan Bahasa Inggris Politeknik Negeri Padang
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <div
            className={`grid grid-cols-1 gap-3 md:gap-4 ${activeTab === 'jadwal-dosen' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periode Tahun
              </label>
              <select
                value={selectedPeriode ?? ''}
                onChange={(e) => handlePeriodeChange(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
              >
                {periodeList.map((p) => (
                  <option key={p.tahun} value={p.tahun}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === 'jadwal-dosen' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Dosen
                </label>
                <select
                  value={selectedDosen ?? ''}
                  onChange={(e) => {
                    setSelectedDosen(
                      e.target.value ? parseInt(e.target.value) : null,
                    );
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                >
                  <option value="">Semua Dosen</option>
                  {dosenList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="hidden md:block">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pencarian
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Cari judul, nama, atau NIM..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6" id="data-table">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b">
            <div className="flex overflow-x-auto">
            <button
              onClick={() => handleTabChange('judul')}
              className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap text-sm md:text-base ${
                activeTab === 'judul'
                  ? 'text-red-900 border-b-2 border-red-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Judul Tugas Akhir</span>
              <span className="sm:hidden">Judul</span>
            </button>
            <button
              onClick={() => handleTabChange('jadwal')}
              className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap text-sm md:text-base ${
                activeTab === 'jadwal'
                  ? 'text-red-900 border-b-2 border-red-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Jadwal Tugas Akhir</span>
              <span className="sm:hidden">Jadwal</span>
            </button>
            <button
              onClick={() => handleTabChange('jadwal-dosen')}
              className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap text-sm md:text-base ${
                activeTab === 'jadwal-dosen'
                  ? 'text-red-900 border-b-2 border-red-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Jadwal Tugas Akhir Dosen</span>
              <span className="sm:hidden">Dosen</span>
            </button>
            </div>
            <div className="p-3 md:p-0">
            {activeTab === 'judul' && judulData.data.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
                    const response = await fetch(`${apiUrl}/api/data-master/export/judul-pdf?tahun=${selectedPeriode}`);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const isMobile = window.innerWidth < 768;
                    if (isMobile) {
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `judul-ta-${selectedPeriode}.pdf`;
                      link.click();
                    } else {
                      window.open(url, '_blank');
                    }
                  } catch (error) {
                    console.error('Error export PDF:', error);
                  }
                }}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all text-sm"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>
            )}
            {activeTab === 'jadwal' && jadwalData.data.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
                    const response = await fetch(`${apiUrl}/api/data-master/export/jadwal-pdf?tahun=${selectedPeriode}`);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const isMobile = window.innerWidth < 768;
                    if (isMobile) {
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `jadwal-sidang-${selectedPeriode}.pdf`;
                      link.click();
                    } else {
                      window.open(url, '_blank');
                    }
                  } catch (error) {
                    console.error('Error export PDF:', error);
                  }
                }}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all text-sm"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>
            )}
            {activeTab === 'jadwal-dosen' && jadwalDosenData.data.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
                    const params = new URLSearchParams({ tahun: selectedPeriode!.toString() });
                    if (selectedDosen) params.append('dosen_id', selectedDosen.toString());
                    const response = await fetch(`${apiUrl}/api/data-master/export/jadwal-dosen-pdf?${params}`);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const isMobile = window.innerWidth < 768;
                    if (isMobile) {
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `jadwal-dosen-${selectedPeriode}.pdf`;
                      link.click();
                    } else {
                      window.open(url, '_blank');
                    }
                  } catch (error) {
                    console.error('Error export PDF:', error);
                  }
                }}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all text-sm"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>
            )}
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="block md:hidden mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FileDown className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Tampilan Tabel Hanya untuk Desktop
                  </p>
                  <p className="text-xs text-blue-800">
                    Silakan unduh PDF menggunakan tombol di atas untuk melihat data.
                  </p>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Memuat data...</p>
              </div>
            ) : (
              <>
                {activeTab === 'judul' && (
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            {HEADER_NO}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            {HEADER_NIM}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            {HEADER_NAMA}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            {HEADER_JUDUL}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-gray-500"
                            >
                              Tidak ada data untuk periode ini
                            </td>
                          </tr>
                        ) : (
                          paginatedData.map((item: any) => (
                            <tr key={item.no} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-600">{item.no}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                {item.nim}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="max-w-xs truncate" title={item.nama_mahasiswa}>
                                  {item.nama_mahasiswa}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                <div className="max-w-md truncate" title={item.judul}>
                                  {item.judul}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'jadwal' && (
                  <div className="hidden md:block overflow-x-auto">
                    {paginatedData.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          Data jadwal tidak tersedia untuk periode ini
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Jadwal sidang hanya tersedia untuk data sistem terbaru
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Mahasiswa
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Ketua
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Anggota I
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Anggota II
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Hari/Tanggal
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Pukul
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Ruangan
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((item: any, idx: number) => {
                            const tanggal = new Date(item.tanggal);
                            const hariMap = [
                              'Minggu',
                              'Senin',
                              'Selasa',
                              'Rabu',
                              'Kamis',
                              'Jumat',
                              'Sabtu',
                            ];
                            const hari = hariMap[tanggal.getDay()];
                            const tanggalStr = tanggal.toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            });

                            return (
                              <tr
                                key={idx}
                                className="border-b border-gray-100 hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 text-gray-900">
                                  <div className="max-w-xs truncate" title={item.nama_mahasiswa}>
                                    {item.nama_mahasiswa}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-900">
                                  <div className="max-w-xs truncate" title={item.penguji_1 || '-'}>
                                    {item.penguji_1 || '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-900">
                                  <div className="max-w-xs truncate" title={item.penguji_2 || '-'}>
                                    {item.penguji_2 || '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-900">
                                  <div className="max-w-xs truncate" title={item.penguji_3 || '-'}>
                                    {item.penguji_3 || '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {hari}, {tanggalStr}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {item.waktu_mulai} - {item.waktu_selesai}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {item.ruangan}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'jadwal-dosen' && (
                  <div className="hidden md:block overflow-x-auto">
                    {paginatedData.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          Data jadwal dosen tidak tersedia untuk periode ini
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Jadwal sidang hanya tersedia untuk data sistem terbaru
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Dosen
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Tanggal
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Waktu
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Ruangan
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Mahasiswa
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Peran
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                <div className="max-w-xs truncate" title={item.nama_dosen}>
                                  {item.nama_dosen}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {new Date(item.tanggal).toLocaleDateString(
                                  'id-ID',
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {item.waktu_mulai} - {item.waktu_selesai}
                              </td>
                              <td className="px-4 py-3 text-gray-700">{item.ruangan}</td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900 max-w-xs truncate" title={item.nama_mahasiswa}>
                                  {item.nama_mahasiswa}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.nim}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                                  {item.peran}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-gray-600">
                      Total: {filteredData.length} data
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-600">
                        Halaman {page} dari {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
