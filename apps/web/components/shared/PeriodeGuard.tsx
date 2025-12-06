'use client';

import { ReactNode, useEffect, useRef } from 'react';
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
  const wasInactiveRef = useRef(false);

  useEffect(() => {
    if (status !== null) {
      if (!status.isActive) {
        wasInactiveRef.current = true;
      } else if (wasInactiveRef.current && status.isActive) {
        wasInactiveRef.current = false;
        window.location.reload();
      }
    }
  }, [status]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user?.role === 'admin' || user?.role === 'jurusan') {
    return <>{children}</>;
  }

  if (!status?.isActive) {
    return <PeriodeNotActive tanggalBuka={status?.tanggalBuka} />;
  }

  return <>{children}</>;
}
