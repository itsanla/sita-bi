import { User, RoleName } from '../types';

export const ROLES = {
  JURUSAN: 'jurusan' as const,
  PRODI_D3: 'prodi_d3' as const,
  PRODI_D4: 'prodi_d4' as const,
  DOSEN: 'dosen' as const,
  MAHASISWA: 'mahasiswa' as const,
  ADMIN: 'admin' as const,
};

export const hasRole = (user: User | null, roles: RoleName[]): boolean => {
  if (!user) return false;
  return user.roles.some((r) => roles.includes(r.name));
};

export const isJurusan = (user: User | null): boolean => hasRole(user, [ROLES.JURUSAN]);
export const isProdi = (user: User | null): boolean => hasRole(user, [ROLES.PRODI_D3, ROLES.PRODI_D4]);
export const isDosen = (user: User | null): boolean => hasRole(user, [ROLES.DOSEN]);
export const isMahasiswa = (user: User | null): boolean => hasRole(user, [ROLES.MAHASISWA]);
export const isAdmin = (user: User | null): boolean => hasRole(user, [ROLES.ADMIN]);

export const getProdiScope = (user: User | null): 'D3' | 'D4' | null => {
  if (!user?.dosen) return null;
  return user.dosen.prodi as 'D3' | 'D4' | null;
};

export const canAccessProdi = (user: User | null, prodi: 'D3' | 'D4'): boolean => {
  if (isJurusan(user) || isAdmin(user)) return true;
  if (isProdi(user)) {
    const userProdi = getProdiScope(user);
    return userProdi === prodi;
  }
  return false;
};

export const canAccessMahasiswa = (user: User | null, mahasiswaId: number): boolean => {
  if (isJurusan(user) || isAdmin(user)) return true;
  
  if (isDosen(user) && user?.dosen?.assignedMahasiswa) {
    return user.dosen.assignedMahasiswa.some((m) => m.id === mahasiswaId);
  }
  
  if (isMahasiswa(user) && user?.mahasiswa) {
    return user.mahasiswa.id === mahasiswaId;
  }
  
  return false;
};

export const canManageUsers = (user: User | null): boolean => {
  return isJurusan(user) || isAdmin(user);
};

export const canAssignPembimbing = (user: User | null): boolean => {
  return isJurusan(user) || isProdi(user) || isAdmin(user);
};

export const canValidateJudul = (user: User | null): boolean => {
  return isJurusan(user) || isProdi(user) || isAdmin(user);
};

export const canViewAllBimbingan = (user: User | null): boolean => {
  return isJurusan(user) || isProdi(user) || isAdmin(user);
};

export const filterByProdiScope = <T extends { prodi?: string }>(
  user: User | null,
  items: T[],
): T[] => {
  if (isJurusan(user) || isAdmin(user)) return items;
  
  if (isProdi(user)) {
    const userProdi = getProdiScope(user);
    if (!userProdi) return [];
    return items.filter((item) => item.prodi === userProdi);
  }
  
  return items;
};

export const filterByAssignment = <T extends { mahasiswa_id?: number; mahasiswa?: { id: number } }>(
  user: User | null,
  items: T[],
): T[] => {
  if (isJurusan(user) || isProdi(user) || isAdmin(user)) return items;
  
  if (isDosen(user) && user?.dosen?.assignedMahasiswa) {
    const assignedIds = user.dosen.assignedMahasiswa.map((m) => m.id);
    return items.filter((item) => {
      const mhsId = item.mahasiswa_id || item.mahasiswa?.id;
      return mhsId && assignedIds.includes(mhsId);
    });
  }
  
  return [];
};

export const getDosenCapacity = (user: User | null): { current: number; max: number } => {
  if (!user?.dosen?.assignedMahasiswa) return { current: 0, max: 4 };
  return {
    current: user.dosen.assignedMahasiswa.length,
    max: 4,
  };
};

export const canAcceptMoreMahasiswa = (user: User | null): boolean => {
  const capacity = getDosenCapacity(user);
  return capacity.current < capacity.max;
};
