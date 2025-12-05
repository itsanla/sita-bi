import React, { Suspense } from 'react';
import { TableSkeleton } from '@/app/components/Suspense/StreamingSkeleton';
import PeriodeGuard from '@/components/shared/PeriodeGuard';

// Server Component - tidak perlu 'use client'
export const dynamic = 'force-dynamic'; // Always fresh data
export const revalidate = 0; // No cache

// Async Server Component untuk fetch data
async function JadwalSidangContent() {
  // TODO: Implement fetch data dari API
  // const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jadwal-sidang`);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Jadwal Sidang Mahasiswa</h1>
      <p className="text-gray-600 mb-6">
        Konten jadwal sidang akan ditampilkan di sini.
      </p>

      {/* TODO: Render table jadwal sidang */}
      <div className="bg-white rounded-lg shadow p-6">
        <p>Data jadwal sidang</p>
      </div>
    </div>
  );
}

// Main page dengan Suspense untuk streaming
export default function JadwalSidangMahasiswaPage() {
  return (
    <PeriodeGuard>
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <JadwalSidangContent />
      </Suspense>
    </PeriodeGuard>
  );
}
