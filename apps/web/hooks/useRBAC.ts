'use client';

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { RoleName, RBACPermissions } from '../types';

export function useRBAC(): RBACPermissions & {
  role: RoleName | null;
  isJurusan: boolean;
  isProdi: boolean;
  isDosen: boolean;
  isMahasiswa: boolean;
  isAdmin: boolean;
  hasRole: (roles: RoleName[]) => boolean;
  canAccess: (requiredRoles: RoleName[]) => boolean;
  canAccessMahasiswa: (mahasiswaId: number) => boolean;
  user: any;
} {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user || !user.roles || user.roles.length === 0) {
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

    const role = user.roles[0]?.name || 'mahasiswa';
    const isJurusan = role === 'jurusan';
    const isProdi = role === 'prodi_d3' || role === 'prodi_d4';
    const isDosen = role === 'dosen' || isProdi || isJurusan;
    const isMahasiswa = role === 'mahasiswa';
    const isAdmin = role === 'admin';

    // Determine prodi scope
    let canAccessProdi: 'D3' | 'D4' | null = null;
    if (role === 'prodi_d3') canAccessProdi = 'D3';
    if (role === 'prodi_d4') canAccessProdi = 'D4';
    if (isJurusan) canAccessProdi = null; // Can access both

    // Determine accessible mahasiswa IDs
    const canAccessMahasiswaIds: number[] = [];
    if (isDosen && user.dosen?.assignedMahasiswa) {
      canAccessMahasiswaIds.push(...user.dosen.assignedMahasiswa.map((m) => m.id));
    }
    if (isMahasiswa && user.mahasiswa) {
      canAccessMahasiswaIds.push(user.mahasiswa.id);
    }

    // Permissions
    const canAccessAllData = isJurusan || isAdmin;
    const canManageUsers = isJurusan || isAdmin;
    const canAssignDosen = isJurusan || isProdi || isAdmin;
    const canValidateJudul = isJurusan || isProdi || isAdmin;
    const canViewReports = isJurusan || isProdi || isAdmin;

    // Helper functions
    const canAccess = (requiredRoles: RoleName[]): boolean => {
      if (isAdmin) return true;
      if (isJurusan && (requiredRoles.includes('jurusan') || requiredRoles.includes('prodi_d3') || requiredRoles.includes('prodi_d4') || requiredRoles.includes('dosen'))) {
        return true;
      }
      if (isProdi && (requiredRoles.includes(role) || requiredRoles.includes('dosen'))) {
        return true;
      }
      return requiredRoles.includes(role);
    };

    const canAccessMahasiswa = (mahasiswaId: number): boolean => {
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
