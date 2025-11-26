'use client';

import { ReactNode, Suspense, useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./components/Sidebar'), { ssr: false });

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = useMemo(() => {
    return user?.roles?.some(
      (role) => role.name === 'admin' || role.name === 'kajur' || role.name === 'kaprodi_d3' || role.name === 'kaprodi_d4'
    ) || false;
  }, [user]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      const userRole = user.roles?.[0]?.name;
      if (userRole === 'dosen') {
        router.replace('/dashboard/dosen');
      } else if (userRole === 'mahasiswa') {
        router.replace('/dashboard/mahasiswa');
      } else {
        router.replace('/login');
      }
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!loading && user && !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Suspense
          fallback={
            <div className="w-64 bg-white shadow-lg animate-pulse fixed inset-y-0 left-0" />
          }
        >
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </Suspense>

        <main
          className={`flex-1 min-h-screen transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-20'
          }`}
        >
          <div className="p-6 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
