'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { Lock, Monitor } from 'lucide-react';
import PenjadwalanSidang from '@/components/shared/PenjadwalanSidang';
import { useEffect, useState } from 'react';

export default function AdminKelolaSidangPage() {
  const { isJurusan, isAdmin, role } = useRBAC();
  const isOnlyAdmin = isAdmin && !isJurusan;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  if (!isJurusan && !isAdmin) {
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
            Fitur ini hanya dapat diakses oleh Admin dan Ketua Jurusan
          </p>
          <a
            href="/dashboard/admin"
            className="inline-block px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-blue-900" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Hanya Tersedia di Desktop
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Fitur Kelola Sidang hanya dapat diakses melalui perangkat desktop untuk pengalaman terbaik
          </p>
          <a
            href="/dashboard/admin"
            className="inline-block px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <PenjadwalanSidang isAdminOnly={isOnlyAdmin} />;
}
