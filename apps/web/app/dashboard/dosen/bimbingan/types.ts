// apps/web/app/dashboard/dosen/bimbingan/types.ts

export interface Mahasiswa {
  user: {
    name: string;
    email: string;
  };
}

export interface Catatan {
  id: number;
  catatan: string;
  author: { name: string };
  created_at: string;
}

export interface BimbinganSession {
  id: number;
  status_bimbingan: string;
  tanggal_bimbingan: string;
  jam_bimbingan: string;
  catatan: Catatan[];
}

export interface TugasAkhir {
  id: number;
  judul: string;
  status: string;
  mahasiswa: Mahasiswa;
  bimbinganTa: BimbinganSession[];
}
