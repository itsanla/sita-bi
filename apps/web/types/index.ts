// apps/web/types/index.ts

export type RoleName = 'mahasiswa' | 'dosen' | 'admin' | 'kajur' | 'kaprodi_d3' | 'kaprodi_d4';

export interface User {
  id: number;
  name: string;
  nama?: string; // Alias for name
  email: string;
  phone_number: string;
  photo?: string | null;
  roles: { id: number; name: RoleName }[];
  nim?: string; // From mahasiswa
  nidn?: string; // From dosen
  mahasiswa?: {
    id: number;
    nim: string;
    prodi: string;
    kelas: string;
  } | null;
  dosen?: {
    id: number;
    nidn: string;
    prodi?: string | null;
    kuota_bimbingan: number;
    assignedMahasiswa?: {
      id: number;
      nim: string;
      name: string;
      prodi: string;
    }[];
  } | null;
}

export interface ApiResponse<T = null> {
  status: 'sukses' | 'gagal';
  message: string;
  data: T;
}

export interface RBACPermissions {
  canAccessAllData: boolean;
  canAccessProdi: 'D3' | 'D4' | null;
  canAccessMahasiswaIds: number[];
  canManageUsers: boolean;
  canAssignDosen: boolean;
  canValidateJudul: boolean;
  canViewReports: boolean;
}
