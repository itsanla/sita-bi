// apps/web/app/dashboard/components/Header.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button'; // Assuming a button component exists
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Assuming sheet components exist
import { Menu, LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            {/* Mobile Sidebar content would go here */}
          </SheetContent>
        </Sheet>
      </div>
      <div className="w-full flex-1">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-600 hidden md:block">
          Selamat datang, {user?.nama}
        </p>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  );
}
