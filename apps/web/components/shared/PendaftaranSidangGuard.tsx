'use client';

import { ReactNode } from 'react';
import { Calendar, Lock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { usePenjadwalanSidangStatus } from '@/hooks/usePenjadwalanSidangStatus';

interface PendaftaranSidangGuardProps {
  children: ReactNode;
}

export default function PendaftaranSidangGuard({
  children,
}: PendaftaranSidangGuardProps) {
  const { status, loading } = usePenjadwalanSidangStatus();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Jika jadwal sudah di-generate (SELESAI), tutup pendaftaran
  if (status?.status === 'SELESAI' && status.isGenerated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Pendaftaran Sidang Ditutup
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Jadwal sidang telah dipublish. Pendaftaran sidang untuk periode ini sudah ditutup.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-blue-800">
              <Calendar className="w-4 h-4" />
              <p className="text-xs font-medium">
                Lihat jadwal sidang di menu Jadwal Sidang
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
