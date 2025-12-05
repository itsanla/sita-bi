'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import UserSidebar from '@/components/shared/UserSidebar';
import UserFooter from '@/components/shared/UserFooter';
import Unauthorized from '@/components/shared/Unauthorized';
import { useRBAC } from '@/hooks/useRBAC';
import {
  LayoutDashboard,
  BookUser,
  Lightbulb,
  ClipboardCheck,
  GraduationCap,
  UserPlus,
  UserCircle,
  Settings,
  FileCheck,
  Award,
  ClipboardList,
} from 'lucide-react';

const baseNavItems = [
  { href: '/dashboard/dosen', icon: LayoutDashboard, label: 'Dashboard' },
  {
    href: '/dashboard/dosen/data-diri',
    icon: UserCircle,
    label: 'Data Diri',
  },
  {
    href: '/dashboard/dosen/pengajuan',
    icon: UserPlus,
    label: 'Pengajuan Pembimbing',
  },
  { href: '/dashboard/dosen/bimbingan', icon: BookUser, label: 'Bimbingan' },
  {
    href: '/dashboard/dosen/tawaran-topik',
    icon: Lightbulb,
    label: 'Tawaran Topik',
  },
  {
    href: '/dashboard/dosen/sidang-approvals',
    icon: ClipboardCheck,
    label: 'Persetujuan Sidang',
  },
  {
    href: '/dashboard/dosen/penilaian',
    icon: GraduationCap,
    label: 'Penilaian',
  },
];

const jurusanMenuItems = [
  {
    href: '/dashboard/dosen/fitur-jurusan-1',
    icon: Settings,
    label: 'Aturan Tugas Akhir',
  },
  {
    href: '/dashboard/dosen/fitur-jurusan-2',
    icon: FileCheck,
    label: 'Kelola Periode TA',
  },
];

const prodiMenuItems = [
  {
    href: '/dashboard/dosen/fitur-prodi-1',
    icon: Award,
    label: 'Fitur Prodi 1',
  },
  {
    href: '/dashboard/dosen/fitur-prodi-2',
    icon: ClipboardList,
    label: 'Fitur Prodi 2',
  },
];

export default function DosenLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isJurusan, isProdi } = useRBAC();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuSections: Array<{
    title: string;
    items: typeof baseNavItems;
  }> = [];

  if (isJurusan) {
    menuSections.push({
      title: 'Menu Jurusan',
      items: jurusanMenuItems,
    });
  } else if (isProdi) {
    menuSections.push({
      title: 'Menu Prodi',
      items: prodiMenuItems,
    });
  }

  menuSections.push({
    title: 'Menu Dosen',
    items: baseNavItems,
  });

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDosen = user?.roles?.some(
    (role) =>
      role.name === 'dosen' ||
      role.name === 'prodi_d3' ||
      role.name === 'prodi_d4' ||
      role.name === 'jurusan',
  );

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

  if (!isDosen) {
    return <Unauthorized message="Dashboard ini hanya untuk dosen." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuSections={menuSections}
        dashboardHref="/dashboard/dosen"
      />

      <main
        className={`min-h-screen transition-all duration-300 flex flex-col pt-16 lg:pt-0 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}
      >
        <div className="p-0 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
        <UserFooter />
      </main>
    </div>
  );
}
