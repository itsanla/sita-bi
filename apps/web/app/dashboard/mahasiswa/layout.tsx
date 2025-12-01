'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import UserSidebar from '@/components/shared/UserSidebar';
import UserFooter from '@/components/shared/UserFooter';
import {
  LayoutDashboard,
  FileText,
  UserPlus,
  MessagesSquare,
  CalendarCheck2,
  CalendarClock,
  Megaphone,
  Lock,
  Menu,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/mahasiswa', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/mahasiswa/tugas-akhir', icon: FileText, label: 'Tugas Akhir' },
  { href: '/dashboard/mahasiswa/pengajuan', icon: UserPlus, label: 'Pengajuan Pembimbing' },
  { href: '/dashboard/mahasiswa/bimbingan', icon: MessagesSquare, label: 'Bimbingan' },
  { href: '/dashboard/mahasiswa/sidang', icon: CalendarCheck2, label: 'Daftar Sidang' },
  { href: '/dashboard/mahasiswa/jadwal-sidang', icon: CalendarClock, label: 'Jadwal Sidang' },
  { href: '/dashboard/mahasiswa/pengumuman', icon: Megaphone, label: 'Pengumuman' },
];

export default function MahasiswaLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            <Lock className="w-8 h-8 text-red-900" />
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
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-lg lg:hidden hover:bg-gray-50"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      <UserSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navItems={navItems}
        menuTitle="Menu Mahasiswa"
        dashboardHref="/dashboard/mahasiswa"
      />

      <main
        className={`min-h-screen transition-all duration-300 flex flex-col ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}
      >
        <div className="p-0 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full flex-1">{children}</div>
        <UserFooter />
      </main>
    </div>
  );
}
