'use client';

import { useRBAC } from '../../hooks/useRBAC';
import { RoleName } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
  requireProdi?: 'D3' | 'D4';
  requireMahasiswaAccess?: number;
  fallback?: React.ReactNode;
}

export default function RoleGuard({
  children,
  allowedRoles,
  requireProdi,
  requireMahasiswaAccess,
  fallback = null,
}: RoleGuardProps) {
  const { canAccess, canAccessProdi, canAccessMahasiswa } = useRBAC();

  if (allowedRoles && !canAccess(allowedRoles)) {
    return <>{fallback}</>;
  }

  if (
    requireProdi &&
    canAccessProdi !== requireProdi &&
    canAccessProdi !== null
  ) {
    return <>{fallback}</>;
  }

  if (requireMahasiswaAccess && !canAccessMahasiswa(requireMahasiswaAccess)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
