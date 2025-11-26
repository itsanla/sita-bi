'use client';

import { useRBAC } from '../../hooks/useRBAC';
import type { RoleName } from '../../types';

interface RBACGuardProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
  fallback?: React.ReactNode;
}

export default function RBACGuard({
  children,
  allowedRoles,
  fallback = null,
}: RBACGuardProps) {
  const { canAccess, role } = useRBAC();

  if (!role) {
    return <>{fallback}</>;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = canAccess(allowedRoles);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
