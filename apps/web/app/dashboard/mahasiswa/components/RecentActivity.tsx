'use client';

import { useState } from 'react';
import {
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'bimbingan' | 'pengajuan' | 'approval' | 'rejection';
  title: string;
  description: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

export default function RecentActivity() {
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'approval',
      title: 'Judul Disetujui',
      description: 'Judul "Sistem Informasi Tugas Akhir" telah disetujui',
      time: '2 jam lalu',
      icon: CheckCircle,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      id: '2',
      type: 'bimbingan',
      title: 'Bimbingan Selesai',
      description: 'Sesi bimbingan BAB III dengan Dr. Ahmad',
      time: '1 hari lalu',
      icon: MessageSquare,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      id: '3',
      type: 'pengajuan',
      title: 'Pengajuan Baru',
      description: 'Mengajukan judul alternatif kedua',
      time: '2 hari lalu',
      icon: FileText,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      id: '4',
      type: 'rejection',
      title: 'Judul Ditolak',
      description: 'Judul pertama ditolak, revisi diperlukan',
      time: '3 hari lalu',
      icon: XCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Aktivitas Terkini</h3>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
          Lihat Semua
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="group relative flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-7 top-14 bottom-0 w-px bg-gray-200 group-hover:bg-blue-300 transition-colors duration-300"></div>
            )}

            {/* Icon */}
            <div
              className={`relative flex-shrink-0 ${activity.iconBg} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300`}
            >
              <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  {activity.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {activity.description}
              </p>
            </div>

            {/* Hover indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state (if no activities) */}
      {activities.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm">Belum ada aktivitas terkini</p>
        </div>
      )}
    </div>
  );
}
