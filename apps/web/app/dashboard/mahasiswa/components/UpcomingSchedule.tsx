'use client';

import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { DashboardCardSkeleton } from '@/components/Suspense/LoadingFallback';
import EmptyState from '@/components/shared/EmptyState';
import { useDashboardSchedule } from '@/hooks/useDashboardData';

export default function UpcomingSchedule() {
  const { data: schedules, isLoading, isError } = useDashboardSchedule(5);

  if (isLoading) {
    return <DashboardCardSkeleton />;
  }

  if (isError || !schedules) {
    return <EmptyState message="Gagal memuat jadwal. Coba lagi nanti." />;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bimbingan':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          badge: 'bg-blue-100',
        };
      case 'sidang':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          border: 'border-purple-200',
          badge: 'bg-purple-100',
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          badge: 'bg-gray-100',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Jadwal Mendatang</h3>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
          Tambah Jadwal
        </button>
      </div>

      <div className="space-y-4">
        {schedules.map((schedule: any, index: number) => {
          const colors = getTypeColor(schedule.type);
          return (
            <div
              key={schedule.id}
              className={`group relative p-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-lg transition-all duration-300 cursor-pointer`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Status indicator */}
              {schedule.status === 'today' && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                  Hari Ini
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold ${colors.text} ${colors.badge} px-2 py-1 rounded-full uppercase`}
                    >
                      {schedule.type}
                    </span>
                  </div>
                  <h4
                    className={`font-bold ${colors.text} group-hover:text-blue-600 transition-colors duration-300`}
                  >
                    {schedule.title}
                  </h4>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(schedule.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{schedule.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{schedule.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{schedule.with}</span>
                </div>
              </div>

              {/* Action button */}
              <div className="mt-4 pt-4 border-t border-gray-200/50">
                <button
                  className={`w-full px-4 py-2 ${colors.text} ${colors.badge} hover:${colors.badge} rounded-lg font-medium text-sm transition-all duration-300 transform group-hover:scale-[1.02]`}
                >
                  Lihat Detail
                </button>
              </div>

              {/* Hover indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-xl"></div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {schedules.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm">Belum ada jadwal terjadwal</p>
        </div>
      )}
    </div>
  );
}
