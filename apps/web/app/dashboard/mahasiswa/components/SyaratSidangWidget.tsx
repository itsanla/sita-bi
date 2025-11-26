// apps/web/app/dashboard/mahasiswa/components/SyaratSidangWidget.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { DashboardCardSkeleton } from '@/components/Suspense/LoadingFallback';
import EmptyState from '@/components/shared/EmptyState';

interface EligibilityDetails {
  tugasAkhirApproved: boolean;
  bimbinganCount: number;
  minBimbingan: number;
}

interface EligibilityData {
  isEligible: boolean;
  details: EligibilityDetails;
  reason: string[];
}

export default function SyaratSidangWidget() {
  const router = useRouter();
  const {
    data: eligibility,
    isLoading,
    isError,
  } = useQuery<EligibilityData>({
    queryKey: ['sidangEligibility'],
    queryFn: async () => {
      const response = await api.get('/pendaftaran-sidang/check-eligibility');
      return response.data.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  if (isLoading) {
    return <DashboardCardSkeleton />;
  }

  if (isError || !eligibility) {
    return <EmptyState message="Gagal memuat syarat sidang." />;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Syarat Pendaftaran Sidang</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            eligibility.isEligible
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {eligibility.isEligible ? 'Memenuhi Syarat' : 'Belum Memenuhi'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {eligibility.details.tugasAkhirApproved ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span>Judul TA Disetujui</span>
        </div>
        <div className="flex items-center gap-3">
          {eligibility.details.bimbinganCount >=
          eligibility.details.minBimbingan ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-500" />
          )}
          <span>
            Bimbingan Terkonfirmasi ({eligibility.details.bimbinganCount}/
            {eligibility.details.minBimbingan})
          </span>
        </div>
      </div>

      {!eligibility.isEligible && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <ul className="space-y-1">
            {eligibility.reason.map((r, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs text-red-700 items-center"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => router.push('/dashboard/mahasiswa/sidang')}
        disabled={!eligibility.isEligible}
        className="mt-6 w-full py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500"
      >
        Daftar Sidang
      </button>
    </div>
  );
}
