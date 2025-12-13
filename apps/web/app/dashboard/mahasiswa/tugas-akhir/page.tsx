'use client';

import { useState } from 'react';
import { Trash2, BookOpen, Users, CheckCircle2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteTugasAkhir = async () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteTugasAkhir = async () => {
    try {
      await deleteTugasAkhir();
      toast.success('Pengajuan berhasil dihapus', {
        description: 'Tugas akhir Anda telah dihapus dari sistem',
      });
    } catch (err) {
      toast.error('Gagal menghapus pengajuan', {
        description: (err as Error).message,
      });
    }
  };

  const handleEditTitle = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmEdit = async () => {
    setShowConfirmDialog(false);
    try {
      await deleteTugasAkhir();
      toast.success('Judul berhasil dihapus', {
        description: 'Silakan ajukan judul baru dengan pengecekan similaritas',
      });
      refetch();
    } catch (err) {
      toast.error('Gagal menghapus judul', {
        description: (err as Error).message,
      });
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
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 md:p-6 rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <svg
                className="h-5 w-5 md:h-6 md:w-6 text-red-600"
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
              <h3 className="font-semibold text-red-800 text-sm md:text-base">
                Error
              </h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PeriodeGuard>
      <div className="space-y-4 md:space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-white md:bg-gradient-to-br md:from-white md:via-white md:to-gray-50/50 rounded-xl border border-gray-200 shadow-sm md:hover:shadow-md md:transition-all md:duration-300">
          {/* Decorative Elements - Hidden on mobile */}
          <div className="hidden md:block absolute top-0 right-0 w-48 h-48 bg-maroon-900/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="hidden md:block absolute bottom-0 left-0 w-32 h-32 bg-maroon-900/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

          <div className="relative p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              {/* Icon - Simplified on mobile */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="hidden md:block absolute inset-0 bg-maroon-900/20 rounded-xl blur-lg"></div>
                  <div className="relative bg-maroon-900 md:bg-gradient-to-br md:from-maroon-900 md:to-maroon-800 p-2 md:p-3 rounded-lg md:rounded-xl shadow-sm md:shadow-md md:hover:scale-105 md:transition-transform md:duration-300">
                    <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-700 mb-1 tracking-tight">
                  Tugas Akhir
                </h1>
                <p className="text-gray-600 text-sm leading-normal max-w-3xl">
                  Kelola pengajuan tugas akhir, cek kemiripan judul, dan
                  jelajahi topik rekomendasi dari dosen pembimbing
                </p>

                {/* Important Notice */}
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className="h-4 w-4 text-amber-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-800 mb-1">
                        Catatan
                      </p>
                      <p className="text-xs text-amber-700 leading-normal">
                        Semua aturan pengecekan kemiripan judul (persentase
                        maksimal, scope pengecekan, dan status aktif/nonaktif)
                        <span className="font-semibold">
                          , ditentukan dan diatur secara dinamis oleh pihak
                          jurusan
                        </span>
                        . Jika judul Anda ditolak karena kemiripan, silakan ubah
                        judul atau hubungi jurusan untuk informasi lebih lanjut.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Thesis Status */}
        {tugasAkhir ? (
          <div className="group relative overflow-hidden bg-white md:bg-gradient-to-br md:from-white md:to-emerald-50/30 rounded-xl border border-gray-200 md:border-emerald-100 shadow-sm md:hover:shadow-md md:hover:border-emerald-200 md:transition-all md:duration-300">
            {/* Decorative gradient overlay - Hidden on mobile */}
            <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative p-4 md:p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1 space-y-4">
                  {/* Header with Status */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="hidden md:block absolute inset-0 bg-emerald-500/20 rounded-lg blur-md"></div>
                        <div className="relative bg-emerald-600 md:bg-gradient-to-br md:from-emerald-600 md:to-emerald-700 p-2 md:p-2.5 rounded-lg shadow-sm md:shadow-md md:group-hover:scale-105 md:transition-transform md:duration-300">
                          <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h2 className="text-base md:text-lg font-bold text-gray-800">
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
                              <div className="hidden md:block absolute inset-0 bg-maroon-900/20 rounded-full blur-sm opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative w-8 h-8 md:w-9 md:h-9 bg-maroon-900 md:bg-gradient-to-br md:from-maroon-900 md:to-maroon-800 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-sm md:group-hover/item:scale-110 md:transition-transform md:duration-300">
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
                            <div className="flex-shrink-0 hidden sm:block">
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
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  <button
                    onClick={handleEditTitle}
                    className="group/btn relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden text-sm"
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
                      className="group/btn relative px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden text-sm"
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

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Hapus Pengajuan Tugas Akhir"
          description="Apakah Anda yakin ingin menghapus pengajuan tugas akhir ini? Tindakan ini tidak dapat dibatalkan."
          confirmText="Ya, Hapus"
          cancelText="Batal"
          onConfirm={confirmDeleteTugasAkhir}
          variant="danger"
        />
      </div>
    </PeriodeGuard>
  );
}
