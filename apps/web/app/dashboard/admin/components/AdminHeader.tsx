'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, UserCircle, Crown } from 'lucide-react';
import Link from 'next/link';

export default function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-white via-white to-red-50/30 border-b border-red-900/10 sticky top-0 z-40 backdrop-blur-sm">
      <div className="px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-900 to-red-800 rounded-lg shadow-lg shadow-red-900/20">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <Link href="/dashboard/admin" className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-red-900 via-red-800 to-red-900 bg-clip-text text-transparent tracking-tight">
                Admin Panel
              </span>
              <span className="text-xs text-red-800/60 font-medium tracking-wider uppercase">
                Management System
              </span>
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-red-900/10 shadow-sm">
              <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-red-900 to-red-800 rounded-full">
                <UserCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">
                  {user?.nama || 'Admin'}
                </span>
                <span className="text-xs text-red-800/70">Administrator</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-900 border border-red-900/20 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-red-900/20"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 text-red-900 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-red-900 group-hover:text-white transition-colors">
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
