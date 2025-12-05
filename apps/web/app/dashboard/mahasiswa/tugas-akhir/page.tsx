'use client';

import { useState } from 'react';
import { Trash2, BookOpen, Users, CheckCircle2, Edit3 } from 'lucide-react';
import PeriodeGuard from '@/components/shared/PeriodeGuard';
import { useTugasAkhir } from '@/hooks/useTugasAkhir';
import { getStatusChip } from '@/app/components/ui/StatusChip';
import PageLoader from '@/app/components/loading/PageLoader';
import SimilarityForm from './SimilarityForm';
import RecommendedTopics from './RecommendedTopics';
import SubmittedTitlesTable from './SubmittedTitlesTable';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function TugasAkhirPage() {
  const { tugasAkhir, loading, error, refetch, deleteTugasAkhir } =
    useTugasAkhir();
  const [selectedTitle, setSelectedTitle] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDeleteTugasAkhir = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your thesis submission? This action cannot be undone.',
      )
    )
      return;
    try {
      await deleteTugasAkhir();
      alert('Submission successfully deleted.');
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const handleEditTitle = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmEdit = async () => {
    setShowConfirmDialog(false);
    try {
      await deleteTugasAkhir();
      alert(
        'Judul berhasil dihapus. Silakan ajukan judul baru dengan pengecekan similaritas.',
      );
      refetch();
    } catch (err) {
      alert(`Gagal: ${(err as Error).message}`);
    }
  };

  const handleSelectRecommendedTitle = (title: string) => {
    setSelectedTitle(title);
    // Scroll to form
    document.getElementById('similarity-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PeriodeGuard>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-maroon-900/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-maroon-900/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

          <div className="relative p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-maroon-900/20 rounded-xl blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-maroon-900 to-maroon-800 p-3 rounded-xl shadow-md hover:scale-105 transition-transform duration-300">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-700 mb-1 tracking-tight">
                  Tugas Akhir
                </h1>
                <p className="text-gray-600 text-sm leading-normal max-w-3xl">
                  Kelola pengajuan tugas akhir, cek kemiripan judul, dan
                  jelajahi topik rekomendasi dari dosen pembimbing
                </p>

                {/* Stats Pills */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-700">
                      Sistem Aktif
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-maroon-900" />
                    <span className="text-xs font-medium text-gray-700">
                      Proses Otomatis
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Thesis Status */}
        {tugasAkhir ? (
          <div className="group relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-4">
                  {/* Header with Status */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-lg blur-md"></div>
                        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 p-2.5 rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-bold text-gray-800">
                          Tugas Akhir Anda Saat Ini
                        </h2>
                        <div className="transition-transform duration-300 group-hover:scale-105">
                          {getStatusChip(tugasAkhir.status)}
                        </div>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-emerald-100">
                        <p className="text-sm text-gray-800 leading-normal font-medium">
                          {tugasAkhir.judul}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Supervisors Section */}
                  {tugasAkhir.peranDosenTa.length > 0 && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-maroon-900/10 p-1.5 rounded-lg">
                          <Users className="h-4 w-4 text-maroon-900" />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm">
                          Dosen Pembimbing
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {tugasAkhir.peranDosenTa.map((peran, idx) => (
                          <div
                            key={idx}
                            className="group/item flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gradient-to-r hover:from-maroon-50 hover:to-white border border-gray-100 hover:border-maroon-200 hover:shadow-sm transition-all duration-300"
                          >
                            <div className="relative flex-shrink-0">
                              <div className="absolute inset-0 bg-maroon-900/20 rounded-full blur-sm opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative w-9 h-9 bg-gradient-to-br from-maroon-900 to-maroon-800 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover/item:scale-110 transition-transform duration-300">
                                {peran.dosen.user.name.charAt(0)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 group-hover/item:text-maroon-900 transition-colors duration-300 truncate">
                                {peran.dosen.user.name}
                              </p>
                              <p className="text-xs text-gray-500 group-hover/item:text-gray-600 transition-colors duration-300">
                                {peran.peran}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex gap-2">
                  <button
                    onClick={handleEditTitle}
                    className="group/btn relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-2 overflow-hidden text-sm"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <Edit3
                      size={16}
                      className="relative z-10 group-hover/btn:scale-110 transition-transform duration-300"
                    />
                    <span className="relative z-10">Ubah Judul</span>
                  </button>
                  {tugasAkhir.status === 'DIAJUKAN' && (
                    <button
                      onClick={handleDeleteTugasAkhir}
                      className="group/btn relative px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-2 overflow-hidden text-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <Trash2
                        size={16}
                        className="relative z-10 group-hover/btn:rotate-12 transition-transform duration-300"
                      />
                      <span className="relative z-10">Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div id="similarity-form">
              <SimilarityForm
                initialTitle={selectedTitle}
                onSuccess={refetch}
              />
            </div>

            <RecommendedTopics onSelectTitle={handleSelectRecommendedTitle} />
          </>
        )}

        <SubmittedTitlesTable />

        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title="Peringatan Ubah Judul"
          description="Jika Anda mengubah judul tugas akhir, judul saat ini akan dihapus dan Anda perlu mengajukan judul baru dengan pengecekan similaritas. Apakah Anda yakin ingin melanjutkan?"
          confirmText="Ya, Lanjutkan"
          cancelText="Batal"
          onConfirm={handleConfirmEdit}
          variant="warning"
        />
      </div>
    </PeriodeGuard>
  );
}
