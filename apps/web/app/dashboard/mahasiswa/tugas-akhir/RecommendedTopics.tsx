'use client';

import { useState, useMemo } from 'react';
import { BookMarked, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRecommendedTopics } from '@/hooks/useTugasAkhir';
import { usePeriode } from '@/context/PeriodeContext';
import SkeletonCard from '@/app/components/loading/SkeletonCard';
import request from '@/lib/api';

interface RecommendedTopicsProps {
  onSelectTitle: (_title: string) => void;
}

export default function RecommendedTopics({
  onSelectTitle,
}: RecommendedTopicsProps) {
  const { selectedPeriodeId } = usePeriode();
  const { recommendedTitles, loading, refetch } = useRecommendedTopics(selectedPeriodeId);
  const [applying, setApplying] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState<{id: number, title: string} | null>(null);
  const [showDetail, setShowDetail] = useState<{id: number, title: string, description: string, dosen: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return recommendedTitles;
    const lowerQuery = searchQuery.toLowerCase();
    return recommendedTitles.filter(topic => 
      topic.judul_topik.toLowerCase().includes(lowerQuery) ||
      topic.deskripsi.toLowerCase().includes(lowerQuery)
    );
  }, [recommendedTitles, searchQuery]);

  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTopics = filteredTopics.slice(startIndex, startIndex + itemsPerPage);

  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  


  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (recommendedTitles.length === 0 && !loading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 rounded-xl border border-slate-200 shadow-sm">
        <div className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gray-300/50 rounded-xl blur-lg"></div>
              <div className="relative bg-gradient-to-br from-gray-200 to-slate-200 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <BookMarked className="h-8 w-8 text-gray-500" />
              </div>
            </div>
            <p className="text-gray-800 font-bold text-base mb-1">
              Tidak Ada Topik di Periode Ini
            </p>
            <p className="text-gray-600 text-sm leading-normal">
              Belum ada topik rekomendasi yang tersedia untuk periode yang dipilih.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-slate-500/5 rounded-full blur-3xl -mr-24 -mt-24"></div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-slate-600/20 rounded-xl blur-md"></div>
                <div className="relative bg-gradient-to-br from-slate-700 to-gray-800 p-2.5 rounded-xl shadow-md hover:scale-105 transition-transform duration-300">
                  <BookMarked className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                Topik Rekomendasi
              </h2>
              <p className="text-gray-600 text-sm leading-normal">
                Daftar {recommendedTitles.length} topik rekomendasi dari dosen untuk periode yang dipilih
              </p>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="flex items-center gap-2 bg-gradient-to-br from-maroon-900 to-maroon-800 text-white px-4 py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform duration-300">
            <div className="text-right">
              <p className="text-lg font-bold">{filteredTopics.length}</p>
              <p className="text-xs text-white/80">Hasil Ditemukan</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-left">
              <p className="text-base font-semibold">{recommendedTitles.length}</p>
              <p className="text-xs text-white/80">Total Topik</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative group/search">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 rounded-xl opacity-0 group-hover/search:opacity-100 blur-lg transition-opacity duration-500"></div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <div className="bg-slate-100 p-1.5 rounded-lg group-hover/search:bg-slate-200 transition-colors duration-300">
                <Search className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <input
              type="text"
              placeholder="Cari berdasarkan judul atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-3 focus:ring-maroon-900/10 focus:border-maroon-900 hover:border-gray-300 transition-all duration-300 text-sm text-gray-800 placeholder-gray-400"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-lg transition-colors duration-200 group/clear"
              >
                <svg
                  className="h-4 w-4 text-gray-500 group-hover/clear:text-gray-700 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-20">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-maroon-900 rounded-full"></div>
                      No
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <BookMarked className="h-3.5 w-3.5 text-maroon-900" />
                      Judul Topik
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Dosen
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentTopics.length > 0 ? (
                  currentTopics.map((topic, idx) => (
                    <tr
                      key={topic.id}
                      className="hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                      onClick={() => setShowDetail({id: topic.id, title: topic.judul_topik, description: topic.deskripsi, dosen: topic.dosenPencetus.name})}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-slate-100 rounded-lg text-sm font-semibold text-gray-700 shadow-sm">
                          {startIndex + idx + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800 leading-normal font-medium">
                          {topic.judul_topik}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800 leading-normal">
                          {topic.dosenPencetus.name}
                        </p>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <button
                            onClick={() => setShowConfirm({id: topic.id, title: topic.judul_topik})}
                            disabled={applying === topic.id}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            {applying === topic.id ? 'Mengambil...' : 'Ambil'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gray-300/50 rounded-xl blur-lg"></div>
                          <div className="relative bg-gradient-to-br from-gray-200 to-slate-200 w-16 h-16 rounded-xl flex items-center justify-center shadow-md">
                            <Search className="h-8 w-8 text-gray-500" />
                          </div>
                        </div>
                        <div className="max-w-md">
                          <p className="text-gray-800 font-bold text-base mb-1">
                            {searchQuery ? 'Tidak Ada Hasil Pencarian' : 'Tidak Ada Topik Tersedia'}
                          </p>
                          <p className="text-gray-600 text-sm leading-normal">
                            {searchQuery
                              ? `Tidak ditemukan topik yang cocok dengan kata kunci "${searchQuery}".`
                              : 'Belum ada topik rekomendasi yang tersedia untuk periode ini.'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredTopics.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200">
            {/* Info Text */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-maroon-900 to-maroon-800 rounded-lg flex items-center justify-center shadow-sm">
                <BookMarked className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">
                  Menampilkan{' '}
                  <span className="font-bold text-maroon-900">
                    {startIndex + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-bold text-maroon-900">
                    {Math.min(endIndex, filteredTopics.length)}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  dari total{' '}
                  <span className="font-semibold text-gray-700">
                    {filteredTopics.length}
                  </span>{' '}
                  topik
                </p>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="group relative px-3 py-2 border border-gray-300 rounded-lg hover:border-maroon-900 hover:bg-maroon-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-maroon-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <ChevronLeft className="relative h-4 w-4 text-gray-600 group-hover:text-maroon-900 transition-colors duration-300" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    const showEllipsis =
                      (page === currentPage - 2 && currentPage > 3) ||
                      (page === currentPage + 2 && currentPage < totalPages - 2);

                    if (!showPage && !showEllipsis) return null;

                    if (showEllipsis) {
                      return (
                        <div
                          key={page}
                          className="px-2 py-2 text-gray-400 text-sm font-medium"
                        >
                          ...
                        </div>
                      );
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative min-w-[40px] px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden ${
                          currentPage === page
                            ? 'bg-gradient-to-br from-maroon-900 to-maroon-800 text-white shadow-md scale-105'
                            : 'border border-gray-300 text-gray-700 hover:border-maroon-900 hover:bg-maroon-50 hover:text-maroon-900 hover:scale-105'
                        }`}
                      >
                        {currentPage === page && (
                          <div className="absolute inset-0 bg-gradient-to-br from-maroon-800 to-maroon-900 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        )}
                        <span className="relative">{page}</span>
                      </button>
                    );
                  },
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="group relative px-3 py-2 border border-gray-300 rounded-lg hover:border-maroon-900 hover:bg-maroon-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-maroon-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <ChevronRight className="relative h-4 w-4 text-gray-600 group-hover:text-maroon-900 transition-colors duration-300" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Detail Overlay */}
      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-lg p-6 max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{showDetail.title}</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2"><strong>Dosen:</strong> {showDetail.dosen}</p>
              <p className="text-sm text-gray-600"><strong>Deskripsi:</strong></p>
              <p className="text-gray-700 mt-1">{showDetail.description}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDetail(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowDetail(null);
                  setShowConfirm({id: showDetail.id, title: showDetail.title});
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Ambil Topik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Konfirmasi Pengambilan Topik
              </h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin mengambil topik <strong>"{showConfirm.title}"</strong> sebagai judul tugas akhir Anda?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    setApplying(showConfirm.id);
                    try {
                      await request(`/tawaran-topik/${showConfirm.id}/take`, {
                        method: 'POST',
                      });
                      toast.success('Topik berhasil diambil', {
                        description: 'Topik telah diambil sebagai tugas akhir Anda',
                      });
                      setTimeout(() => {
                        window.location.reload();
                      }, 1500);
                    } catch (err) {
                      toast.error('Gagal mengambil topik', {
                        description: (err as Error).message,
                      });
                      setApplying(null);
                    }
                    setShowConfirm(null);
                  }}
                  disabled={applying === showConfirm.id}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {applying === showConfirm.id ? 'Mengambil...' : 'Ya, Ambil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}