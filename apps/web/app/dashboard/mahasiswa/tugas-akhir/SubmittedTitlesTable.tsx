'use client';

import { useMemo, useState } from 'react';
import { Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAllTitles } from '@/hooks/useTugasAkhir';
import { usePeriode } from '@/context/PeriodeContext';
import TableSkeleton from '@/app/components/loading/TableSkeleton';

export default function SubmittedTitlesTable() {
  const { selectedPeriodeId } = usePeriode();
  const { allTitles, loading } = useAllTitles(selectedPeriodeId);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredTitles = useMemo(() => {
    if (!searchQuery.trim()) return allTitles;
    const lowerQuery = searchQuery.toLowerCase();
    return allTitles.filter(
      (t) =>
        t.judul.toLowerCase().includes(lowerQuery) ||
        t.mahasiswa?.user?.name?.toLowerCase().includes(lowerQuery),
    );
  }, [allTitles, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTitles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredTitles.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, []);

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="relative overflow-hidden bg-white md:bg-gradient-to-br md:from-white md:to-slate-50/50 rounded-xl border border-gray-200 md:border-slate-200 shadow-sm md:hover:shadow-md md:transition-all md:duration-300">
      {/* Decorative elements - Hidden on mobile */}
      <div className="hidden md:block absolute top-0 right-0 w-48 h-48 bg-slate-500/5 rounded-full blur-3xl -mr-24 -mt-24"></div>

      <div className="relative p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 md:mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="hidden md:block absolute inset-0 bg-slate-600/20 rounded-xl blur-md"></div>
                <div className="relative bg-slate-700 md:bg-gradient-to-br md:from-slate-700 md:to-gray-800 p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-sm md:shadow-md md:hover:scale-105 md:transition-transform md:duration-300">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-base md:text-lg font-bold text-gray-800 mb-1">
                Judul TA Periode Ini
              </h2>
              <p className="text-gray-600 text-sm leading-normal">
                Daftar {allTitles.length} judul tugas akhir yang diajukan pada
                periode yang dipilih
              </p>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="flex items-center gap-2 bg-gradient-to-br from-maroon-900 to-maroon-800 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform duration-300 w-full sm:w-auto justify-center">
            <div className="text-center sm:text-right">
              <p className="text-base md:text-lg font-bold">
                {filteredTitles.length}
              </p>
              <p className="text-xs text-white/80">Hasil Ditemukan</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center sm:text-left">
              <p className="text-sm md:text-base font-semibold">
                {allTitles.length}
              </p>
              <p className="text-xs text-white/80">Total Judul</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative group/search">
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 rounded-xl opacity-0 group-hover/search:opacity-100 blur-lg transition-opacity duration-500"></div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <div className="bg-slate-100 p-1.5 rounded-lg md:group-hover/search:bg-slate-200 md:transition-colors md:duration-300">
                <Search className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <input
              type="text"
              placeholder="Cari judul TA atau nama mahasiswa..."
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
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-12 md:w-20">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-maroon-900 rounded-full"></div>
                      <span className="hidden sm:inline">No</span>
                    </div>
                  </th>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-maroon-900" />
                      Judul Tugas Akhir
                    </div>
                  </th>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">
                    Mahasiswa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length > 0 ? (
                  currentItems.map((title, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-100 transition-colors duration-200"
                    >
                      <td className="px-2 md:px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-gray-100 to-slate-100 rounded-lg text-xs md:text-sm font-semibold text-gray-700 shadow-sm">
                          {startIndex + index + 1}
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-800 leading-normal line-clamp-2">
                            {title.judul}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 md:hidden">
                            {title.mahasiswa?.user?.name || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-800 leading-normal">
                          {title.mahasiswa?.user?.name || 'N/A'}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 md:py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gray-300/50 rounded-xl blur-lg"></div>
                          <div className="relative bg-gradient-to-br from-gray-200 to-slate-200 w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-md">
                            <Search className="h-6 w-6 md:h-8 md:w-8 text-gray-500" />
                          </div>
                        </div>
                        <div className="max-w-md px-4">
                          <p className="text-gray-800 font-bold text-sm md:text-base mb-1">
                            {searchQuery
                              ? 'Tidak Ada Hasil Pencarian'
                              : 'Belum Ada Judul TA'}
                          </p>
                          <p className="text-gray-600 text-xs md:text-sm leading-normal">
                            {searchQuery
                              ? `Tidak ditemukan judul yang cocok dengan kata kunci "${searchQuery}" pada periode ini.`
                              : 'Belum ada judul tugas akhir yang diajukan pada periode yang dipilih.'}
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
        {filteredTitles.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200">
            {/* Info Text */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-maroon-900 to-maroon-800 rounded-lg flex items-center justify-center shadow-sm">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">
                  Menampilkan{' '}
                  <span className="font-bold text-maroon-900">
                    {startIndex + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-bold text-maroon-900">
                    {Math.min(endIndex, filteredTitles.length)}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  dari total{' '}
                  <span className="font-semibold text-gray-700">
                    {filteredTitles.length}
                  </span>{' '}
                  judul
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
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    const showEllipsis =
                      (page === currentPage - 2 && currentPage > 3) ||
                      (page === currentPage + 2 &&
                        currentPage < totalPages - 2);

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
    </div>
  );
}
