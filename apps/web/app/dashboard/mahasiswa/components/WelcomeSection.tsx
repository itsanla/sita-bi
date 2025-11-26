'use client';

import { useAuth } from '../../../../context/AuthContext';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function WelcomeSection() {
  const { user } = useAuth();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Selamat Pagi'
      : currentHour < 18
        ? 'Selamat Siang'
        : 'Selamat Malam';

  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-2xl p-8 shadow-lg border border-red-700/20 hover:shadow-2xl transition-all duration-500">
      {/* Animated decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-150"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-300"></div>
      </div>

      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-white">
                  {greeting}, {user?.nama || 'Mahasiswa'}!
                </h1>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <p className="text-red-100/90 leading-relaxed">
                Kelola tugas akhir, jadwal bimbingan, dan pendaftaran sidang
                Anda dengan mudah
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 group-hover:bg-white/20 transition-all duration-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">Active</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>Progress 75%</span>
            </div>
          </div>
        </div>

        {/* Quick info tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition-all duration-300 cursor-pointer">
            <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span>
            NIM: {user?.nim || '-'}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition-all duration-300 cursor-pointer">
            <span className="w-1.5 h-1.5 bg-green-300 rounded-full"></span>
            Semester 7
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition-all duration-300 cursor-pointer">
            <span className="w-1.5 h-1.5 bg-purple-300 rounded-full"></span>
            Teknik Informatika
          </span>
        </div>
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
    </div>
  );
}
