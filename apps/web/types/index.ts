// apps/web/types/index.ts

export interface User {
  id: number;
  name: string;
  nama?: string; // Alias for name
  email: string;
  phone_number: string;
  photo?: string | null;
  roles: { id: number; name: string }[];
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
  } | null;
}

export interface ApiResponse<T = null> {
  status: 'sukses' | 'gagal';
  message: string;
  data: T;
}
