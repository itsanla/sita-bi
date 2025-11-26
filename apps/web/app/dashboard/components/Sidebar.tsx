// apps/web/app/dashboard/components/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Users, Calendar, Book, FileText, Settings } from 'lucide-react';

const navLinks = {
  admin: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: Home },
    { href: '/dashboard/admin/users', label: 'Manajemen User', icon: Users },
    { href: '/admin/penjadwalan-sidang', label: 'Jadwal Sidang', icon: Calendar },
    { href: '/admin/import', label: 'Import Data', icon: Book },
    { href: '/admin/reports', label: 'Laporan', icon: FileText },
  ],
  kajur: [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/admin/users', label: 'Manajemen User', icon: Users },
    { href: '/admin/penjadwalan-sidang', label: 'Jadwal Sidang', icon: Calendar },
    { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: FileText },
  ],
  kaprodi_d3: [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/admin/users', label: 'Manajemen User', icon: Users },
    { href: '/admin/penjadwalan-sidang', label: 'Jadwal Sidang', icon: Calendar },
    { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: FileText },
  ],
  kaprodi_d4: [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/admin/users', label: 'Manajemen User', icon: Users },
    { href: '/admin/penjadwalan-sidang', label: 'Jadwal Sidang', icon: Calendar },
    { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: FileText },
  ],
  dosen: [
    { href: '/dashboard/dosen', label: 'Dashboard', icon: Home },
    { href: '/dashboard/dosen/bimbingan', label: 'Bimbingan', icon: Book },
    { href: '/dashboard/dosen/sidang', label: 'Sidang', icon: Calendar },
  ],
  mahasiswa: [
    { href: '/dashboard/mahasiswa', label: 'Dashboard', icon: Home },
    { href: '/dashboard/mahasiswa/ta', label: 'Tugas Akhir', icon: Book },
    { href: '/dashboard/mahasiswa/bimbingan', label: 'Bimbingan', icon: Calendar },
    { href: '/dashboard/mahasiswa/sidang', label: 'Pendaftaran Sidang', icon: FileText },
  ],
};

const NavLink = ({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};

export default function Sidebar() {
  const { user } = useAuth();
  // Determine the primary role for navigation. This could be more sophisticated.
  const role = user?.roles?.[0]?.name || 'mahasiswa';
  const links = navLinks[role as keyof typeof navLinks] || [];

  return (
    <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Settings className="h-6 w-6" />
            <span>SITA-BI</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {links.map((link) => (
              <NavLink key={link.href} {...link}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
