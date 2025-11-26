// apps/web/app/dashboard/dosen/bimbingan/page.tsx
'use client';

import React from 'react';
import BimbinganList from './components/BimbinganList';

export default function DosenBimbinganPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Mahasiswa Bimbingan</h1>
      <BimbinganList />
    </div>
  );
}
