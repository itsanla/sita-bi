'use client';

import { ReactNode } from 'react';
import { usePeriodeStatus } from '@/hooks/usePeriodeStatus';
import { useAuth } from '@/context/AuthContext';
import PeriodeNotActive from './PeriodeNotActive';
import LoadingSpinner from './LoadingSpinner';

interface PeriodeGuardProps {
  children: ReactNode;
}

export default function PeriodeGuard({ children }: PeriodeGuardProps) {
  const { status, loading } = usePeriodeStatus();
  const { user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Admin dan Jurusan bypass periode guard
  if (user?.role === 'admin' || user?.role === 'jurusan') {
    return <>{children}</>;
  }

  // Jika periode tidak aktif, tampilkan peringatan
  if (!status?.isActive) {
    return <PeriodeNotActive tanggalBuka={status?.tanggalBuka} />;
  }

  return <>{children}</>;
}
