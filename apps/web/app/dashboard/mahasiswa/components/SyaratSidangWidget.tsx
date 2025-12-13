// apps/web/app/dashboard/mahasiswa/components/SyaratSidangWidget.tsx
'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { DashboardCardSkeleton } from '@/components/Suspense/LoadingFallback';
import EmptyState from '@/components/shared/EmptyState';
import { useCheckEligibility } from '@/hooks/useBimbingan';
import { useAuth } from '@/context/AuthContext';
import { usePeriode } from '@/context/PeriodeContext';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function SyaratSidangWidget() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedPeriodeId } = usePeriode();
  const [tugasAkhirId, setTugasAkhirId] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTugasAkhir = async () => {
      try {
        console.log('Fetching tugas akhir for periode:', selectedPeriodeId);
        const response = await api.get('/bimbingan/sebagai-mahasiswa');
        console.log('Tugas akhir response:', response.data);
        setTugasAkhirId(response.data.data?.id || 0);
      } catch (error) {
        console.error('Error fetching tugas akhir:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user && selectedPeriodeId) fetchTugasAkhir();
  }, [user, selectedPeriodeId]);

  const { data: eligibility, isLoading: eligibilityLoading, error } =
    useCheckEligibility(tugasAkhirId);

  console.log('SyaratSidangWidget Debug:', {
    user: !!user,
    selectedPeriodeId,
    tugasAkhirId,
    loading,
    eligibilityLoading,
    eligibility,
    error
  });

  if (loading || eligibilityLoading) {
    return <DashboardCardSkeleton />;
  }

  // Jika belum ada tugas akhir, tampilkan syarat default
  if (tugasAkhirId === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Syarat Pendaftaran Sidang
          </h3>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            Belum Memenuhi
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-700">Judul TA Disetujui</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-700">
              Bimbingan Terkonfirmasi (0/8)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-700">
              Validasi Draf Tugas Akhir
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <div className="flex gap-2 text-xs text-red-700 items-center">
            <AlertCircle className="h-4 w-4" />
            <span>Silakan daftar tugas akhir dan mulai bimbingan terlebih dahulu</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/mahasiswa/tugas-akhir')}
          className="mt-6 w-full py-2 rounded-lg font-medium transition-colors bg-gray-200 text-gray-500 cursor-not-allowed"
          disabled
        >
          Daftar Sidang
        </button>
      </div>
    );
  }

  if (!eligibility?.data) {
    return <EmptyState message={`Gagal memuat syarat sidang. Error: ${error?.message || 'Unknown'}`} />;
  }

  const { eligible, message, validBimbingan, minRequired, isDrafValid } =
    eligibility.data;
  const isTAApproved = eligibility.data.isTAApproved ?? false;
  const isBimbinganComplete = validBimbingan >= minRequired;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Syarat Pendaftaran Sidang
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            eligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {eligible ? 'Memenuhi Syarat' : 'Belum Memenuhi'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {isTAApproved ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-500" />
          )}
          <span className="text-sm text-gray-700">Judul TA Disetujui</span>
        </div>
        <div className="flex items-center gap-3">
          {isBimbinganComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-500" />
          )}
          <span className="text-sm text-gray-700">
            Bimbingan Terkonfirmasi ({validBimbingan}/{minRequired})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isDrafValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-500" />
          )}
          <span className="text-sm text-gray-700">
            Validasi Draf Tugas Akhir
          </span>
        </div>
      </div>

      {!eligible && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <div className="flex gap-2 text-xs text-red-700 items-center">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        </div>
      )}

      <button
        onClick={() => router.push('/dashboard/mahasiswa/sidang')}
        disabled={!eligible}
        className="mt-6 w-full py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        Daftar Sidang
      </button>
    </div>
  );
}
