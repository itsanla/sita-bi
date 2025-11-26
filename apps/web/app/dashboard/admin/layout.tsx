'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Home,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  Megaphone,
  BookUser,
  LogOut,
  Crown,
  Menu,
  Settings,
  Upload,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/admin', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/admin/users', icon: Users, label: 'Manajemen User' },
  { href: '/dashboard/admin/validasi-ta', icon: ClipboardList, label: 'Validasi TA' },
  { href: '/dashboard/admin/penugasan', icon: BookUser, label: 'Penugasan' },
  { href: '/dashboard/admin/kelola-sidang', icon: Calendar, label: 'Kelola Sidang' },
  { href: '/dashboard/admin/pengumuman', icon: Megaphone, label: 'Pengumuman' },
  { href: '/dashboard/admin/import', icon: Upload, label: 'Import Data' },
  { href: '/dashboard/admin/reports', icon: FileText, label: 'Laporan' },
];

const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg shadow-red-900/20'
          : 'text-gray-700 hover:bg-red-50 hover:text-red-900 hover:translate-x-1'
      }`}
    >
      <item.icon className="h-5 w-5" />
      <span>{item.label}</span>
    </Link>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (!user?.roles?.some((role) => role.name === 'admin')) {
    return (
      <div className="flex h-screen items-center justify-center">
        Unauthorized Access
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-red-100 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="flex h-[60px] items-center border-b px-6">
                    <Link href="/dashboard/admin" className="flex items-center gap-2 font-semibold">
                      <Crown className="h-6 w-6 text-red-900" />
                      <span>Admin Panel</span>
                    </Link>
                  </div>
                  <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                      <NavLink key={item.href} item={item} />
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-900 to-red-800 rounded-xl shadow-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-900 to-red-800 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-red-800/60 font-medium hidden md:block">Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-red-50 rounded-full border border-red-100">
              <div className="w-8 h-8 bg-gradient-to-br from-red-900 to-red-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.nama?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.nama || 'Admin'}</p>
                <p className="text-xs text-red-800/70">Administrator</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-red-200 hover:bg-red-900 hover:text-white hover:border-red-900 transition-all"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 min-h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-sm border-r border-red-100 p-4 sticky top-16">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
