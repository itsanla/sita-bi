// apps/web/app/admin/penjadwalan-sidang/types.ts

export interface Sidang {
  id: number;
  mahasiswa: {
    id: number;
    nama: string;
    nim: string;
  };
  judul: string;
}

export interface Ruangan {
  id: number;
  nama: string;
}

export interface Dosen {
  id: number;
  nama: string;
  nidn: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  messages: string[];
}

export interface JadwalSidangFormValues {
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan_id: number;
  sidang_id: number;
  pembimbing_1_id: number;
  pembimbing_2_id: number;
  penguji_1_id: number;
  penguji_2_id: number;
  penguji_3_id: number;
}
