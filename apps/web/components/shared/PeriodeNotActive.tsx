'use client';

import { AlertCircle, Calendar } from 'lucide-react';

interface PeriodeNotActiveProps {
  tanggalBuka?: string | null;
}

export default function PeriodeNotActive({
  tanggalBuka,
}: PeriodeNotActiveProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'belum ditentukan';
    try {
      const date = new Date(dateString);
      const tanggal = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      });
      const jam = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      });
      return `${tanggal} Pukul ${jam} WIB`;
    } catch {
      return 'belum ditentukan';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-md">
            <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">
          Periode TA Belum Dibuka
        </h2>

        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 leading-relaxed">
          Sistem Informasi Tugas Akhir saat ini belum dibuka oleh Ketua Jurusan.
        </p>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-blue-700 mb-3 sm:mb-4">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">Jadwal Pembukaan</span>
          </div>
          <div className="text-gray-900 font-bold">
            {formatDate(tanggalBuka).split(' Pukul ').map((part, i) => (
              <p key={i} className={i === 0 ? 'text-lg sm:text-xl mb-1' : 'text-base sm:text-lg text-blue-900'}>
                {i === 1 ? `Pukul ${part}` : part}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
          <p className="text-xs text-gray-600">
            Silakan hubungi Ketua Jurusan untuk informasi lebih lanjut.
          </p>
        </div>
      </div>
    </div>
  );
}
