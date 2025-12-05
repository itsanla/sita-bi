'use client';

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { RoleName, RBACPermissions, User } from '../types';

export function useRBAC(): RBACPermissions & {
  role: RoleName | null;
  isJurusan: boolean;
  isProdi: boolean;
  isDosen: boolean;
  isMahasiswa: boolean;
  isAdmin: boolean;
  hasRole: (_roles: RoleName[]) => boolean;
  canAccess: (_requiredRoles: RoleName[]) => boolean;
  canAccessMahasiswa: (_mahasiswaId: number) => boolean;
  user: User | null;
} {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.roles?.length) {
      return {
        role: null,
        isJurusan: false,
        isProdi: false,
        isDosen: false,
        isMahasiswa: false,
        isAdmin: false,
        canAccessAllData: false,
        canAccessProdi: null,
        canAccessMahasiswaIds: [],
        canManageUsers: false,
        canAssignDosen: false,
        canValidateJudul: false,
        canViewReports: false,
        hasRole: () => false,
        canAccess: () => false,
        canAccessMahasiswa: () => false,
        user: null,
      };
    }

    const userRoles = user.roles.map((r) => r.name);
    const isJurusan = userRoles.includes('jurusan');
    const isProdi =
      userRoles.includes('prodi_d3') || userRoles.includes('prodi_d4');
    const isDosen = userRoles.includes('dosen') || isProdi || isJurusan;
    const isMahasiswa = userRoles.includes('mahasiswa');
    const isAdmin = userRoles.includes('admin');

    let role: RoleName;
    if (isJurusan) {
      role = 'jurusan';
    } else if (isProdi) {
      role =
        (userRoles.find(
          (r) => r === 'prodi_d3' || r === 'prodi_d4',
        ) as RoleName) || 'dosen';
    } else {
      role = userRoles[0]?.name || 'mahasiswa';
    }

    let canAccessProdi: 'D3' | 'D4' | null = null;
    if (userRoles.includes('prodi_d3')) {
      canAccessProdi = 'D3';
    } else if (userRoles.includes('prodi_d4')) {
      canAccessProdi = 'D4';
    }

    const canAccessMahasiswaIds: number[] = [];
    if (isDosen && user.dosen?.assignedMahasiswa?.length) {
      canAccessMahasiswaIds.push(
        ...user.dosen.assignedMahasiswa.map((m) => m.id),
      );
    }
    if (isMahasiswa && user.mahasiswa?.id) {
      canAccessMahasiswaIds.push(user.mahasiswa.id);
    }

    const canAccessAllData = isJurusan || isAdmin;
    const canManageUsers = isJurusan || isAdmin;
    const canAssignDosen = isJurusan || isProdi || isAdmin;
    const canValidateJudul = isJurusan || isProdi || isAdmin;
    const canViewReports = isJurusan || isProdi || isAdmin;

    const canAccess = (requiredRoles: RoleName[]): boolean => {
      if (!requiredRoles.length) return false;
      if (isAdmin) return true;
      if (isJurusan) {
        return (
          requiredRoles.includes('jurusan') ||
          requiredRoles.includes('prodi_d3') ||
          requiredRoles.includes('prodi_d4') ||
          requiredRoles.includes('dosen')
        );
      }
      if (isProdi) {
        return requiredRoles.includes(role) || requiredRoles.includes('dosen');
      }
      return requiredRoles.includes(role);
    };

    const canAccessMahasiswa = (mahasiswaId: number): boolean => {
      if (!mahasiswaId) return false;
      if (canAccessAllData) return true;
      return canAccessMahasiswaIds.includes(mahasiswaId);
    };

    return {
      role,
      isJurusan,
      isProdi,
      isDosen,
      isMahasiswa,
      isAdmin,
      canAccessAllData,
      canAccessProdi,
      canAccessMahasiswaIds,
      canManageUsers,
      canAssignDosen,
      canValidateJudul,
      canViewReports,
      hasRole: canAccess,
      canAccess,
      canAccessMahasiswa,
      user,
    };
  }, [user]);
}
