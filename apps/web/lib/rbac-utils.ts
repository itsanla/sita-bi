import type { User, RoleName } from '../types';

export function getUserRole(user: User | null): RoleName | null {
  if (!user || !user.roles || user.roles.length === 0) return null;
  return user.roles[0]?.name ?? null;
}

export function hasRole(user: User | null, roles: RoleName[]): boolean {
  const userRole = getUserRole(user);
  if (!userRole) return false;

  // Admin has all access
  if (userRole === 'admin') return true;

  // Kajur inherits Kaprodi & Dosen access
  if (userRole === 'jurusan') {
    return (
      roles.includes('jurusan') ||
      roles.includes('prodi_d3') ||
      roles.includes('prodi_d4') ||
      roles.includes('dosen')
    );
  }

  // Kaprodi inherits Dosen access
  if (userRole === 'prodi_d3' || userRole === 'prodi_d4') {
    return roles.includes(userRole) || roles.includes('dosen');
  }

  return roles.includes(userRole);
}

export function canAccessMahasiswa(
  user: User | null,
  mahasiswaId: number,
): boolean {
  if (!user) return false;

  const role = getUserRole(user);

  // Kajur & Admin can access all
  if (role === 'jurusan' || role === 'admin') return true;

  // Mahasiswa can access their own
  if (role === 'mahasiswa' && user.mahasiswa?.id === mahasiswaId) return true;

  // Dosen can access assigned mahasiswa
  if (role === 'dosen' && user.dosen?.assignedMahasiswa) {
    return user.dosen.assignedMahasiswa.some((m) => m.id === mahasiswaId);
  }

  return false;
}

export function filterDataByProdi<T extends { prodi?: string }>(
  data: T[],
  user: User | null,
): T[] {
  if (!user) return [];

  const role = getUserRole(user);

  // Kajur & Admin see all
  if (role === 'jurusan' || role === 'admin') return data;

  // Kaprodi filter by prodi
  if (role === 'prodi_d3') {
    return data.filter((item) => item.prodi === 'D3');
  }

  if (role === 'prodi_d4') {
    return data.filter((item) => item.prodi === 'D4');
  }

  return data;
}

export function getDosenCapacityStatus(
  current: number,
  max: number = 4,
): {
  status: 'available' | 'warning' | 'full';
  color: string;
  label: string;
} {
  const percentage = (current / max) * 100;

  if (percentage >= 100) {
    return {
      status: 'full',
      color: 'text-red-600',
      label: 'Penuh',
    };
  }

  if (percentage >= 75) {
    return {
      status: 'warning',
      color: 'text-yellow-600',
      label: 'Hampir Penuh',
    };
  }

  return {
    status: 'available',
    color: 'text-green-600',
    label: 'Tersedia',
  };
}

export function validatePembimbingSelection(
  pembimbing1Id: number | null,
  pembimbing2Id: number | null,
): { valid: boolean; error?: string } {
  if (!pembimbing1Id) {
    return { valid: false, error: 'Pembimbing 1 harus dipilih' };
  }

  if (pembimbing2Id && pembimbing1Id === pembimbing2Id) {
    return {
      valid: false,
      error: 'Pembimbing 1 dan Pembimbing 2 harus berbeda',
    };
  }

  return { valid: true };
}

export function validatePengujiSelection(
  penguji1Id: number | null,
  penguji2Id: number | null,
  penguji3Id: number | null,
): { valid: boolean; error?: string } {
  if (!penguji1Id) {
    return { valid: false, error: 'Minimal 1 penguji harus dipilih' };
  }

  const pengujiIds = [penguji1Id, penguji2Id, penguji3Id].filter(
    (id) => id !== null,
  );
  const uniqueIds = new Set(pengujiIds);

  if (uniqueIds.size !== pengujiIds.length) {
    return { valid: false, error: 'Semua penguji harus berbeda' };
  }

  return { valid: true };
}
