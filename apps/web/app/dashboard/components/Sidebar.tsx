// apps/web/app/dashboard/components/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  Users,
  Calendar,
  Book,
  FileText,
  Settings,
  MessageCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const ChatbotModal = dynamic(
  () => import('@/app/components/SitaBot/ChatbotModal'),
  {
    ssr: false,
  },
);

const navLinks = {
  admin: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: Home },
    {
      href: '#sitabot',
      label: 'SitaBot AI',
      icon: MessageCircle,
      isSitaBot: true,
    },
    { href: '/dashboard/admin/users', label: 'Manajemen User', icon: Users },
    {
      href: '/admin/penjadwalan-sidang',
      label: 'Jadwal Sidang',
      icon: Calendar,
    },
    { href: '/admin/import', label: 'Import Data', icon: Book },
    { href: '/admin/reports', label: 'Laporan', icon: FileText },
  ],
  jurusan: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: Home },
    {
      href: '#sitabot',
      label: 'SitaBot AI',
      icon: MessageCircle,
      isSitaBot: true,
    },
    { href: '/dashboard/admin/users', label: 'Manajemen User', icon: Users },
    {
      href: '/admin/penjadwalan-sidang',
      label: 'Jadwal Sidang',
      icon: Calendar,
    },
    { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: FileText },
  ],
  prodi_d3: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: Home },
    {
      href: '#sitabot',
      label: 'SitaBot AI',
      icon: MessageCircle,
      isSitaBot: true,
    },
    { href: '/dashboard/admin/users', label: 'Manajemen User', icon: Users },
    {
      href: '/admin/penjadwalan-sidang',
      label: 'Jadwal Sidang',
      icon: Calendar,
    },
    { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: FileText },
  ],
  prodi_d4: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: Home },
    {
      href: '#sitabot',
      label: 'SitaBot AI',
      icon: MessageCircle,
      isSitaBot: true,
    },
    { href: '/dashboard/admin/users', label: 'Manajemen User', icon: Users },
    {
      href: '/admin/penjadwalan-sidang',
      label: 'Jadwal Sidang',
      icon: Calendar,
    },
    { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: FileText },
  ],
  dosen: [
    { href: '/dashboard/dosen', label: 'Dashboard', icon: Home },
    {
      href: '#sitabot',
      label: 'SitaBot AI',
      icon: MessageCircle,
      isSitaBot: true,
    },
    { href: '/dashboard/dosen/bimbingan', label: 'Bimbingan', icon: Book },
    { href: '/dashboard/dosen/sidang', label: 'Sidang', icon: Calendar },
  ],
  mahasiswa: [
    { href: '/dashboard/mahasiswa', label: 'Dashboard', icon: Home },
    {
      href: '#sitabot',
      label: 'SitaBot AI',
      icon: MessageCircle,
      isSitaBot: true,
    },
    { href: '/dashboard/mahasiswa/ta', label: 'Tugas Akhir', icon: Book },
    {
      href: '/dashboard/mahasiswa/bimbingan',
      label: 'Bimbingan',
      icon: Calendar,
    },
    {
      href: '/dashboard/mahasiswa/sidang',
      label: 'Pendaftaran Sidang',
      icon: FileText,
    },
  ],
};

const NavLink = ({
  href,
  icon: Icon,
  children,
  isSitaBot,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isSitaBot?: boolean;
  onClick?: () => void;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (isSitaBot) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-gray-500 hover:text-gray-900 hover:bg-gray-200 w-full text-left"
      >
        <Icon className="h-4 w-4" />
        {children}
      </button>
    );
  }

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSitaBotClick = () => {
    if (isMobile) {
      router.push('/chatbot');
    } else {
      setIsOpen(true);
    }
  };

  const role = user?.roles?.[0]?.name || 'mahasiswa';
  const links = navLinks[role as keyof typeof navLinks] || [];

  return (
    <>
      <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link href="#" className="flex items-center gap-2 font-semibold">
              <Settings className="h-6 w-6" />
              <span>SITA-BI</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              {links.map((link) => (
                <NavLink
                  key={link.href}
                  {...link}
                  onClick={link.isSitaBot ? handleSitaBotClick : undefined}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
      {!isMobile && !!isOpen && (
        <ChatbotModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
