'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTAStatus } from '@/hooks/useTAStatus';
import TANotAllowed from './TANotAllowed';
import LoadingSpinner from './LoadingSpinner';

interface TAGuardProps {
  children: ReactNode;
  requireTA?: boolean;
  requirePembimbing?: boolean;
  requireJudulValidated?: boolean;
  requireEligibleForSidang?: boolean;
  customMessage?: string;
  customTitle?: string;
}

export default function TAGuard({
  children,
  requireTA = false,
  requirePembimbing = false,
  requireJudulValidated = false,
  requireEligibleForSidang = false,
  customMessage,
  customTitle,
}: TAGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { status, loading: taLoading } = useTAStatus();

  if (authLoading || taLoading) {
    return <LoadingSpinner />;
  }

  if (user?.role === 'admin' || user?.role === 'jurusan') {
    return <>{children}</>;
  }

  if (requireTA && !status?.hasTA) {
    return <TANotAllowed type="no-ta" />;
  }

  if (requirePembimbing && !status?.hasPembimbing) {
    return <TANotAllowed type="no-pembimbing" />;
  }

  if (requireJudulValidated && !status?.isJudulValidated) {
    return <TANotAllowed type="judul-not-validated" />;
  }

  if (requireEligibleForSidang && !status?.isEligibleForSidang) {
    return (
      <TANotAllowed
        type="custom"
        customTitle="Belum Memenuhi Syarat Sidang"
        customMessage="Anda belum memenuhi syarat untuk mendaftar sidang. Pastikan Anda telah menyelesaikan minimal 9 bimbingan dan draf TA Anda telah divalidasi sesuai aturan."
      />
    );
  }

  if (customMessage) {
    return (
      <TANotAllowed
        type="custom"
        customMessage={customMessage}
        customTitle={customTitle}
      />
    );
  }

  return <>{children}</>;
}
