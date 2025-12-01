'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import type { Role } from '../../types/rbac';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export function RouteGuard({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = '/login',
}: RouteGuardProps) {
  const { user, loading } = useAuth();
  const { role, isJurusan } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && role) {
      // Kajur bypass
      if (isJurusan) return;

      const hasAccess = allowedRoles.includes(role);
      if (!hasAccess) {
        // Redirect ke dashboard sesuai role
        if (role === 'jurusan' || role === 'prodi_d3' || role === 'prodi_d4' || role === 'admin') {
          router.push('/dashboard/admin');
        } else if (role === 'dosen') {
          router.push('/dashboard/dosen');
        } else if (role === 'mahasiswa') {
          router.push('/dashboard/mahasiswa');
        } else {
          router.push('/dashboard/mahasiswa');
        }
      }
    }
  }, [user, loading, role, allowedRoles, requireAuth, redirectTo, router, isJurusan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
}
