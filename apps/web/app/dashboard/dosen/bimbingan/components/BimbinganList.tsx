'use client';

import React from 'react';
import { useBimbinganDosen } from '@/hooks/useBimbingan';
import BimbinganCard from './BimbinganCard';
import { TugasAkhir } from '../types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

export default function BimbinganList() {
  const { data, isLoading, isError } = useBimbinganDosen();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !data?.data) {
    return <EmptyState message="Gagal memuat daftar bimbingan." />;
  }

  const bimbinganList = data.data as unknown as TugasAkhir[];

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
