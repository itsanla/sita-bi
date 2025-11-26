// apps/web/app/dashboard/mahasiswa/components/DashboardStats.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BookOpen, MessagesSquare, Calendar, Award } from 'lucide-react';
import { DashboardCardSkeleton } from '@/components/Suspense/LoadingFallback';
import EmptyState from '@/components/shared/EmptyState';

interface StatsData {
  tugasAkhir: { total: number; disetujui: number };
  bimbingan: { total: number; bulanIni: number };
  sidang: { status: string; tanggal: string | null };
  progress: { percentage: number; tahap: string };
}

export default function DashboardStats() {
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery<StatsData>({
    queryKey: ['mahasiswaDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/mahasiswa/stats');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return <EmptyState message="Gagal memuat statistik. Coba lagi nanti." />;
  }

  const statsCards = [
    {
      title: 'Total Pengajuan TA',
      value: stats.tugasAkhir.total,
      subtitle: `${stats.tugasAkhir.disetujui} Disetujui`,
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Sesi Bimbingan',
      value: stats.bimbingan.total,
      subtitle: `${stats.bimbingan.bulanIni} Bulan ini`,
      icon: MessagesSquare,
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      title: 'Status Sidang',
      value: stats.sidang.status,
      subtitle: stats.sidang.tanggal
        ? new Date(stats.sidang.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
          })
        : 'Belum dijadwalkan',
      icon: Calendar,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Progress TA',
      value: `${stats.progress.percentage}%`,
      subtitle: stats.progress.tahap,
      icon: Award,
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((card) => (
        <div
          key={card.title}
          className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
          ></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gray-100">
                <card.icon className="h-6 w-6 text-gray-700" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
