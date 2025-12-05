'use client';

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import UserSidebar from '@/components/shared/UserSidebar';
import UserFooter from '@/components/shared/UserFooter';
import Unauthorized from '@/components/shared/Unauthorized';
import {
  LayoutDashboard,
  Users,
  BookUser,
  Calendar,
  Megaphone,
  Upload,
  FileText,
  ScrollText,
  UserCircle,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/admin/data-diri', icon: UserCircle, label: 'Data Diri' },
  { href: '/dashboard/admin/users', icon: Users, label: 'Manajemen User' },
  { href: '/dashboard/admin/penugasan', icon: BookUser, label: 'Penugasan' },
  {
    href: '/dashboard/admin/kelola-sidang',
    icon: Calendar,
    label: 'Kelola Sidang',
  },
  { href: '/dashboard/admin/pengumuman', icon: Megaphone, label: 'Pengumuman' },
  { href: '/dashboard/admin/import', icon: Upload, label: 'Import Data' },
  { href: '/dashboard/admin/reports', icon: FileText, label: 'Laporan' },
  { href: '/dashboard/admin/logs', icon: ScrollText, label: 'Log Aktivitas' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = useMemo(() => {
    return (
      user?.roles?.some(
        (role) =>
          role.name === 'admin' ||
          role.name === 'jurusan' ||
          role.name === 'prodi_d3' ||
          role.name === 'prodi_d4',
      ) || false
    );
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (!isAdmin) {
    return (
      <Unauthorized message="Dashboard ini hanya untuk administrator, jurusan, dan prodi." />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navItems={navItems}
        menuTitle="Menu Admin"
        dashboardHref="/dashboard/admin"
      />

      <main
        className={`min-h-screen transition-all duration-300 flex flex-col pt-16 lg:pt-0 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        <div className="p-0 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
        <UserFooter />
      </main>
    </div>
  );
}
