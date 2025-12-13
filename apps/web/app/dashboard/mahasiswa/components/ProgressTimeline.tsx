// apps/web/app/dashboard/mahasiswa/components/ProgressTimeline.tsx
'use client';

import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { DashboardCardSkeleton } from '@/components/Suspense/LoadingFallback';
import EmptyState from '@/components/shared/EmptyState';
import { useDashboardProgress } from '@/hooks/useDashboardData';

interface TimelineItem {
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
  isError?: boolean;
}

function getStepDescription(statusTA: string): string {
  if (
    [
      'DISETUJUI',
      'BIMBINGAN',
      'LULUS_TANPA_REVISI',
      'LULUS_DENGAN_REVISI',
      'SELESAI',
    ].includes(statusTA)
  ) {
    return 'Judul disetujui';
  }
  if (statusTA === 'DIAJUKAN') {
    return 'Menunggu persetujuan judul';
  }
  if (statusTA === 'DITOLAK') {
    return 'Judul ditolak, silakan ajukan ulang';
  }
  return 'Belum mengajukan judul';
}

function getBimbinganStatus(
  bimbinganCount: number,
  minBimbingan: number,
  isBimbinganPhase: boolean,
): 'completed' | 'current' | 'upcoming' {
  if (bimbinganCount >= minBimbingan) {
    return 'completed';
  }
  if (isBimbinganPhase) {
    return 'current';
  }
  return 'upcoming';
}

export default function ProgressTimeline() {
  const { data: progress, isLoading, isError } = useDashboardProgress();

  if (isLoading) {
    return <DashboardCardSkeleton />;
  }

  if (isError || !progress) {
    return <EmptyState message="Gagal memuat progres. Coba lagi nanti." />;
  }

  const { statusTA, bimbinganCount, minBimbingan, tanggalDisetujui } = progress;

  const isJudulApproved = [
    'DISETUJUI',
    'BIMBINGAN',
    'LULUS_TANPA_REVISI',
    'LULUS_DENGAN_REVISI',
    'SELESAI',
  ].includes(statusTA);
  const isBimbinganPhase = statusTA === 'BIMBINGAN';
  const isSidangPhase = ['LULUS_TANPA_REVISI', 'LULUS_DENGAN_REVISI'].includes(
    statusTA,
  );
  const isSelesai = statusTA === 'SELESAI';

  const steps: TimelineItem[] = [
    {
      title: 'Pengajuan Judul',
      description: getStepDescription(statusTA),
      status: isJudulApproved ? 'completed' : 'current',
      date: tanggalDisetujui,
    },
    {
      title: 'Bimbingan',
      description: `Bimbingan: ${bimbinganCount}/${minBimbingan} sesi terkonfirmasi`,
      status: getBimbinganStatus(
        bimbinganCount,
        minBimbingan,
        isBimbinganPhase,
      ),
      isError: bimbinganCount < minBimbingan && isBimbinganPhase,
    },
    {
      title: 'Sidang',
      description: isSidangPhase
        ? 'Sidang selesai'
        : 'Pendaftaran Sidang Tugas Akhir',
      status: isSidangPhase || isSelesai ? 'completed' : 'upcoming',
    },
    {
      title: 'Selesai',
      description: isSelesai ? 'Tugas Akhir Selesai' : 'Menunggu penyelesaian',
      status: isSelesai ? 'completed' : 'upcoming',
    },
  ];

  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const percentage = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          Perjalanan Tugas Akhir
        </h3>
        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {percentage}% Selesai
        </div>
      </div>

      <div className="space-y-6">
        {steps.map((item) => {
          const renderIcon = () => {
            if (item.status === 'completed') {
              return (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              );
            }
            if (item.status === 'current') {
              if (item.isError) {
                return (
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                );
              }
              return (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              );
            }
            return (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Circle className="h-5 w-5 text-gray-400" />
              </div>
            );
          };

          return (
            <div key={item.title} className="flex gap-4">
              <div className="relative flex-shrink-0">{renderIcon()}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`font-semibold ${
                      item.status === 'completed'
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {item.title}
                  </h4>
                  {!!item.date && (
                    <span className="text-xs text-gray-500">{item.date}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
