export type Role =
  | 'mahasiswa'
  | 'dosen'
  | 'admin'
  | 'jurusan'
  | 'prodi_d3'
  | 'prodi_d4';
export type Prodi = 'D3' | 'D4';

export interface RBACContext {
  role: Role;
  prodi?: Prodi | null;
  dosenId?: number;
  mahasiswaId?: number;
  assignedMahasiswaIds?: number[];
}

export interface RBACPermissions {
  canViewAllMahasiswa: boolean;
  canViewAllDosen: boolean;
  canAssignPembimbing: boolean;
  canAssignPenguji: boolean;
  canManageUsers: boolean;
  canApproveJudul: boolean;
  canAccessReports: boolean;
  canManagePenjadwalan: boolean;
  scopeProdi?: Prodi | null;
}
