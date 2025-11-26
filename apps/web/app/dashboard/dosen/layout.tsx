'use client';

import { ReactNode } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import {
  Home,
  BookUser,
  Lightbulb,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  User as UserIcon,
  Users, // Add new icon
} from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

// Simplified Header from landing page
function DashboardHeader({
  userName,
  onLogout,
}: {
  userName: string;
  onLogout: () => void;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-md z-40">
      <div className="max-w-full mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Image
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYB48qcI4RmLRUfQqoGwJb6GIM7SqYE9rcBg&s"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-900 to-red-700 bg-clip-text text-transparent">
              SITA-BI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserIcon className="text-gray-600" size={20} />
              <span className="font-medium text-gray-700">{userName}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-900 transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-maroon-700 text-white shadow-md'
          : 'text-gray-700 hover:bg-maroon-100 hover:text-maroon-800'
      }`}
    >
      {children}
    </Link>
  );
};

export default function DosenLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  const isDosen = user?.roles?.some((role) => role.name === 'dosen');

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isDosen) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        Unauthorized: Dosen access required.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader userName={user?.nama || 'Dosen'} onLogout={logout} />
      <div className="flex flex-1 pt-16">
        <aside className="w-64 bg-white shadow-lg p-4">
          <nav className="flex flex-col gap-2">
            <NavLink href="/dashboard/dosen">
              <Home size={20} />
              <span>Home</span>
            </NavLink>
            <NavLink href="/dashboard/dosen/bimbingan">
              <BookUser size={20} />
              <span>Bimbingan</span>
            </NavLink>
            <NavLink href="/dashboard/dosen/pengajuan-bimbingan">
              <Users size={20} />
              <span>Pengajuan Bimbingan</span>
            </NavLink>
            <NavLink href="/dashboard/dosen/tawaran-topik">
              <Lightbulb size={20} />
              <span>Tawaran Topik</span>
            </NavLink>
            <NavLink href="/dashboard/dosen/sidang-approvals">
              <ClipboardCheck size={20} />
              <span>Persetujuan Sidang</span>
            </NavLink>
            <NavLink href="/dashboard/dosen/penilaian">
              <GraduationCap size={20} />
              <span>Penilaian</span>
            </NavLink>
          </nav>
        </aside>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
      {/* The footer can be added here if needed, or removed for a cleaner dashboard look */}
      {/* <DashboardFooter /> */}
    </div>
  );
}
