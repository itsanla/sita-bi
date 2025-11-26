'use client';

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { RoleName, RBACPermissions } from '../types';

export function useRBAC(): RBACPermissions & {
  role: RoleName | null;
  isKajur: boolean;
  isKaprodi: boolean;
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
        isKajur: false,
        isKaprodi: false,
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
    const isKajur = role === 'kajur';
    const isKaprodi = role === 'kaprodi_d3' || role === 'kaprodi_d4';
    const isDosen = role === 'dosen' || isKaprodi || isKajur;
    const isMahasiswa = role === 'mahasiswa';
    const isAdmin = role === 'admin';

    // Determine prodi scope
    let canAccessProdi: 'D3' | 'D4' | null = null;
    if (role === 'kaprodi_d3') canAccessProdi = 'D3';
    if (role === 'kaprodi_d4') canAccessProdi = 'D4';
    if (isKajur) canAccessProdi = null; // Can access both

    // Determine accessible mahasiswa IDs
    const canAccessMahasiswaIds: number[] = [];
    if (isDosen && user.dosen?.assignedMahasiswa) {
      canAccessMahasiswaIds.push(...user.dosen.assignedMahasiswa.map((m) => m.id));
    }
    if (isMahasiswa && user.mahasiswa) {
      canAccessMahasiswaIds.push(user.mahasiswa.id);
    }

    // Permissions
    const canAccessAllData = isKajur || isAdmin;
    const canManageUsers = isKajur || isAdmin;
    const canAssignDosen = isKajur || isKaprodi || isAdmin;
    const canValidateJudul = isKajur || isKaprodi || isAdmin;
    const canViewReports = isKajur || isKaprodi || isAdmin;

    // Helper functions
    const canAccess = (requiredRoles: RoleName[]): boolean => {
      if (isAdmin) return true;
      if (isKajur && (requiredRoles.includes('kajur') || requiredRoles.includes('kaprodi_d3') || requiredRoles.includes('kaprodi_d4') || requiredRoles.includes('dosen'))) {
        return true;
      }
      if (isKaprodi && (requiredRoles.includes(role) || requiredRoles.includes('dosen'))) {
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
      isKajur,
      isKaprodi,
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
