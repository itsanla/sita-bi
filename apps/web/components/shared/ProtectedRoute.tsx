'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import type { RoleName } from '../../types';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const { canAccess } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (allowedRoles && user && !canAccess(allowedRoles)) {
      // Redirect ke dashboard sesuai role
      const userRole = user.roles?.[0]?.name;
      if (
        userRole === 'jurusan' ||
        userRole === 'prodi_d3' ||
        userRole === 'prodi_d4' ||
        userRole === 'admin'
      ) {
        router.push('/dashboard/admin');
      } else if (userRole === 'dosen') {
        router.push('/dashboard/dosen');
      } else if (userRole === 'mahasiswa') {
        router.push('/dashboard/mahasiswa');
      } else {
        router.push('/login');
      }
    }
  }, [
    loading,
    isAuthenticated,
    user,
    allowedRoles,
    requireAuth,
    redirectTo,
    router,
    canAccess,
  ]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !canAccess(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
