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

export default function ProgressTimeline() {
  const { data: progress, isLoading, isError } = useDashboardProgress();

  if (isLoading) {
    return <DashboardCardSkeleton />;
  }

  if (isError || !progress) {
    return <EmptyState message="Gagal memuat progres. Coba lagi nanti." />;
  }

  const { statusTA, bimbinganCount, minBimbingan, tanggalDisetujui } = progress;

  const steps: TimelineItem[] = [
    {
      title: 'Pengajuan Judul',
      description: ['BIMBINGAN', 'SELESAI'].includes(statusTA)
        ? `Judul disetujui`
        : 'Menunggu persetujuan judul',
      status: ['BIMBINGAN', 'SELESAI'].includes(statusTA)
        ? 'completed'
        : 'current',
      date: tanggalDisetujui,
    },
    {
      title: 'Bimbingan',
      description: `Bimbingan: ${bimbinganCount}/${minBimbingan} sesi terkonfirmasi`,
      status:
        bimbinganCount >= minBimbingan
          ? 'completed'
          : statusTA === 'BIMBINGAN'
            ? 'current'
            : 'upcoming',
      isError: bimbinganCount < minBimbingan && statusTA === 'BIMBINGAN',
    },
    {
      title: 'Sidang',
      description: 'Pendaftaran Sidang Tugas Akhir',
      status:
        statusTA === 'SELESAI'
          ? 'completed'
          : bimbinganCount >= minBimbingan
            ? 'current'
            : 'upcoming',
    },
    {
      title: 'Selesai',
      description: 'Tugas Akhir Selesai',
      status: statusTA === 'SELESAI' ? 'completed' : 'upcoming',
    },
  ];

  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const percentage = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Thesis Journey</h3>
        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {percentage}% Complete
        </div>
      </div>

      <div className="space-y-6">
        {steps.map((item) => (
          <div key={item.title} className="flex gap-4">
            <div className="relative flex-shrink-0">
              {item.status === 'completed' ? (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ) : item.status === 'current' ? (
                item.isError ? (
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                )
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Circle className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4
                  className={`font-semibold ${item.status === 'completed' ? 'text-gray-900' : 'text-gray-500'}`}
                >
                  {item.title}
                </h4>
                {item.date ? (
                  <span className="text-xs text-gray-500">{item.date}</span>
                ) : null}
              </div>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
