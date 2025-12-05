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
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'belum ditentukan';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 p-4 rounded-full">
            <AlertCircle className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Periode TA Belum Dibuka
        </h2>

        <p className="text-gray-600 mb-6">
          Sistem Informasi Tugas Akhir saat ini belum dibuka oleh Ketua Jurusan.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-blue-700">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Jadwal Pembukaan:</span>
          </div>
          <p className="text-blue-900 font-bold text-lg mt-2">
            {formatDate(tanggalBuka)}
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Silakan hubungi Ketua Jurusan untuk informasi lebih lanjut.
        </p>
      </div>
    </div>
  );
}
