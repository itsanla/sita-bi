// apps/web/app/dashboard/dosen/bimbingan/components/BimbinganList.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import BimbinganCard from './BimbinganCard';
import { TugasAkhir } from '../types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

export default function BimbinganList() {
  const {
    data: bimbinganList,
    isLoading,
    isError,
  } = useQuery<TugasAkhir[]>({
    queryKey: ['dosenBimbinganList'],
    queryFn: async () => {
      const response = await api.get('/bimbingan/sebagai-dosen');
      return response.data.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !bimbinganList) {
    return <EmptyState message="Gagal memuat daftar bimbingan." />;
  }

  if (bimbinganList.length === 0) {
    return (
      <EmptyState message="Anda tidak memiliki mahasiswa bimbingan saat ini." />
    );
  }

  return (
    <div className="space-y-6">
      {bimbinganList.map((ta) => (
        <BimbinganCard key={ta.id} tugasAkhir={ta} />
      ))}
    </div>
  );
}
