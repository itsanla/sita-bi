// apps/web/app/dashboard/layout.tsx
'use client';

import React, { ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Skip this layout for routes that have their own layout
  if (pathname?.startsWith('/dashboard/admin') || 
      pathname?.startsWith('/dashboard/dosen') || 
      pathname?.startsWith('/dashboard/mahasiswa')) {
    return <>{children}</>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
