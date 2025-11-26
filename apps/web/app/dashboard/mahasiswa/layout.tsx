'use client';

import { ReactNode, Suspense, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import dynamic from 'next/dynamic';

// Dynamic imports for components with lazy loading
const Sidebar = dynamic(() => import('./components/Sidebar'), { ssr: false });

export default function MahasiswaLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isMahasiswa = user?.roles?.some((role) => role.name === 'mahasiswa');

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

  if (!isMahasiswa) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Unauthorized Access
          </h2>
          <p className="text-sm text-gray-600">
            This dashboard is for students only.
          </p>
        </div>
      </div>
    );
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
          className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}
        >
          <div className="p-6 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
