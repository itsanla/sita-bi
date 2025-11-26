'use client';

import { FileCheck, FileX, FileClock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface SubmissionChartProps {
  stats: {
    tugasAkhir?: {
      disetujui?: number;
      pending?: number;
      ditolak?: number;
    };
  } | null;
  loading: boolean;
}

export default function SubmissionChart({
  stats,
  loading,
}: SubmissionChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="flex items-center justify-center">
            <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = {
    disetujui: stats?.tugasAkhir?.disetujui || 0,
    pending: stats?.tugasAkhir?.pending || 0,
    ditolak: stats?.tugasAkhir?.ditolak || 0,
  };

  const total = data.disetujui + data.pending + data.ditolak;
  const approvalRate =
    total > 0 ? ((data.disetujui / total) * 100).toFixed(0) : 0;

  const chartData = [
    {
      label: 'Disetujui',
      value: data.disetujui,
      percentage: total > 0 ? ((data.disetujui / total) * 100).toFixed(1) : 0,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      icon: FileCheck,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Pending',
      value: data.pending,
      percentage: total > 0 ? ((data.pending / total) * 100).toFixed(1) : 0,
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
      icon: FileClock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Ditolak',
      value: data.ditolak,
      percentage: total > 0 ? ((data.ditolak / total) * 100).toFixed(1) : 0,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      icon: FileX,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          Statistik Pengajuan Judul
        </h3>
        <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
          <TrendingUp className="h-4 w-4" />
          {approvalRate}% Sukses
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-8 relative">
        <div className="relative w-48 h-48">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="20"
            />
            {/* Data segments */}
            {(() => {
              let offset = 0;
              return chartData.map((item, index) => {
                const circumference = 2 * Math.PI * 80;
                const strokeDasharray = `${
                  (Number(item.percentage) / 100) * circumference
                } ${circumference}`;
                const strokeDashoffset = -offset;
                offset += (Number(item.percentage) / 100) * circumference;

                return (
                  <circle
                    key={item.label}
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke={
                      item.color === 'bg-green-500'
                        ? '#10b981'
                        : item.color === 'bg-amber-500'
                          ? '#f59e0b'
                          : '#ef4444'
                    }
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 hover:opacity-80"
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                );
              });
            })()}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div
            key={item.label}
            className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`${item.iconBg} p-2 rounded-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <item.icon className={`h-4 w-4 ${item.iconColor}`} />
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${item.color} ${item.hoverColor} transition-colors duration-300`}
                ></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
                  {item.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900">
                {item.value}
              </span>
              <span className="text-xs font-medium text-gray-500 min-w-[45px] text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick action */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <Link href="/dashboard/mahasiswa/tugas-akhir">
          <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg">
            Ajukan Judul Baru
          </button>
        </Link>
      </div>
    </div>
  );
}
