import type { RoleName } from '../types';

const UNAUTHORIZED_PATH = '/unauthorized';

export function checkRouteAccess(
  userRoles: RoleName[] | undefined,
  pathname: string,
): { allowed: boolean; redirectTo?: string } {
  if (!userRoles || userRoles.length === 0) {
    return { allowed: false, redirectTo: '/login' };
  }

  const isAdmin = userRoles.some(
    (role) =>
      role === 'admin' ||
      role === 'jurusan' ||
      role === 'prodi_d3' ||
      role === 'prodi_d4',
  );
  const isDosen = userRoles.some(
    (role) =>
      role === 'dosen' ||
      role === 'prodi_d3' ||
      role === 'prodi_d4' ||
      role === 'jurusan',
  );
  const isMahasiswa = userRoles.includes('mahasiswa');

  if (pathname.startsWith('/dashboard/admin')) {
    if (!isAdmin) {
      return { allowed: false, redirectTo: UNAUTHORIZED_PATH };
    }
  }

  if (pathname.startsWith('/dashboard/dosen')) {
    if (!isDosen) {
      return { allowed: false, redirectTo: UNAUTHORIZED_PATH };
    }
  }

  if (pathname.startsWith('/dashboard/mahasiswa')) {
    if (!isMahasiswa) {
      return { allowed: false, redirectTo: UNAUTHORIZED_PATH };
    }
  }

  return { allowed: true };
}
