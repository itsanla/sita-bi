// apps/web/app/admin/penjadwalan-sidang/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import JadwalSidangForm from './components/JadwalSidangForm';

export default function PenjadwalanSidangPage() {
  const { user } = useAuth();

  if (!user || !user.roles?.some((r) => r.name === 'admin')) {
    return <div className="p-8 text-center text-red-500">Akses Ditolak.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Penjadwalan Sidang</h1>
        <p className="text-gray-600 mt-1">
          Buat jadwal sidang baru dengan pengecekan konflik otomatis.
        </p>
      </div>
      <JadwalSidangForm />
    </div>
  );
}
