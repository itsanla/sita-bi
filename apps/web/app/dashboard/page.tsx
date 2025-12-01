'use client';

import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }

    if (!loading && user && user.roles && user.roles.length > 0) {
      const userRole = user.roles[0]?.name;
      
      // Redirect langsung ke dashboard sesuai role
      if (userRole === 'jurusan' || userRole === 'prodi_d3' || userRole === 'prodi_d4' || userRole === 'admin') {
        router.replace('/dashboard/admin');
      } else if (userRole === 'dosen') {
        router.replace('/dashboard/dosen');
      } else if (userRole === 'mahasiswa') {
        router.replace('/dashboard/mahasiswa');
      } else {
        // Fallback untuk role yang tidak dikenali
        router.replace('/dashboard/mahasiswa');
      }
    }
  }, [user, loading, router]);

  // Selalu tampilkan loading saat redirect
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
