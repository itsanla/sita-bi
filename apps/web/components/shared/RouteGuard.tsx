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
  const { role, isKajur } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && role) {
      // Kajur bypass
      if (isKajur) return;

      const hasAccess = allowedRoles.includes(role);
      if (!hasAccess) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, role, allowedRoles, requireAuth, redirectTo, router, isKajur]);

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
