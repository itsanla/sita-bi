'use client';

import { ReactNode } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Home,
  BookUser,
  Lightbulb,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  User as UserIcon,
  Users,
  Menu,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard/dosen', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/dosen/bimbingan', icon: BookUser, label: 'Bimbingan' },
  { href: '/dashboard/dosen/pengajuan-bimbingan', icon: Users, label: 'Pengajuan Bimbingan' },
  { href: '/dashboard/dosen/tawaran-topik', icon: Lightbulb, label: 'Tawaran Topik' },
  { href: '/dashboard/dosen/sidang-approvals', icon: ClipboardCheck, label: 'Persetujuan Sidang' },
  { href: '/dashboard/dosen/penilaian', icon: GraduationCap, label: 'Penilaian' },
];

const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-maroon-700 text-white shadow-md'
          : 'text-gray-700 hover:bg-maroon-100 hover:text-maroon-800'
      }`}
    >
      <item.icon size={20} />
      <span>{item.label}</span>
    </Link>
  );
};

export default function DosenLayout({ children }: { children: ReactNode }) {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const isDosen = user?.roles?.some((role) => role.name === 'dosen');

  if (!isDosen) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        Unauthorized: Dosen access required.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-md z-40">
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-between py-4">
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
                    <div className="p-4 space-y-2">
                      {navItems.map((item) => (
                        <NavLink key={item.href} item={item} />
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

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
                <span className="font-medium text-gray-700">{user?.nama || 'Dosen'}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-900 transition-all"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white shadow-lg">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex-1 overflow-auto py-2">
              <nav className="p-4 flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
