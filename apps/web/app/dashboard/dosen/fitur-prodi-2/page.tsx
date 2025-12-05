'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { ClipboardList, Lock } from 'lucide-react';

export default function FiturProdi2Page() {
  const { isProdi, isJurusan, role, canAccessProdi } = useRBAC();

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-600">
            Memuat data pengguna...
          </p>
        </div>
      </div>
    );
  }

  if (!isProdi && !isJurusan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-900" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Fitur ini hanya dapat diakses oleh Ketua Program Studi
          </p>
          <a
            href="/dashboard/dosen"
            className="inline-block px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  const prodiName = canAccessProdi || 'Program Studi';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Fitur Khusus Prodi 2
            </h1>
            <p className="text-sm text-gray-600">
              Akses untuk Ketua Program Studi {prodiName}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Deskripsi Fitur
        </h2>
        <p className="text-gray-600 mb-4">
          Ini adalah contoh fitur kedua yang dapat diakses oleh Ketua Program
          Studi. Fitur ini dapat digunakan untuk monitoring dan evaluasi program
          studi.
        </p>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-sm text-green-700">
            <strong>Info:</strong> Anda memiliki akses ke data Program Studi{' '}
            {prodiName}
          </p>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
          <p className="text-sm text-blue-700">
            <strong>Catatan:</strong> Fitur ini masih dalam tahap pengembangan.
            Konten akan ditambahkan sesuai kebutuhan sistem.
          </p>
        </div>
      </div>
    </div>
  );
}
