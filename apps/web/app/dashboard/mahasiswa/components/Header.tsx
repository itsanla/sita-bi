'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, UserCircle, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 max-w-full mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard/mahasiswa"
              className="flex items-center gap-3"
            >
              <div className="relative w-10 h-10 bg-gradient-to-br from-red-900 to-red-800 rounded-xl flex items-center justify-center shadow-sm">
                <BookOpenCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">SITA-BI</span>
                <p className="text-xs text-gray-500">Student Dashboard</p>
              </div>
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {/* User Info Card */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className="w-9 h-9 bg-gradient-to-br from-red-900 to-red-800 rounded-lg flex items-center justify-center shadow-sm">
                <UserCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">
                  {user?.nama || 'Student'}
                </span>
                <span className="text-xs text-gray-500 capitalize flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  {user?.roles?.[0]?.name || 'Mahasiswa'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg transition-all duration-200 hover:shadow-md text-sm font-medium"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
