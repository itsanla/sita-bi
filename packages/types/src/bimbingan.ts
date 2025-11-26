// Shared types for bimbingan feature
export interface BimbinganUser {
  id: number;
  name: string;
  email?: string;
}

export interface BimbinganDosen {
  id: number;
  user: BimbinganUser;
  nip?: string;
}

export interface BimbinganLampiran {
  id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  created_at: string;
  uploader?: BimbinganUser;
}

export interface BimbinganCatatan {
  id: number;
  catatan: string;
  created_at: string;
  author: BimbinganUser;
  author_type: string;
}

export interface BimbinganHistoryPerubahan {
  id: number;
  status: string;
  alasan_perubahan: string | null;
  tanggal_baru: string | null;
  jam_baru: string | null;
  created_at: string;
}

export interface BimbinganSession {
  id: number;
  dosen: BimbinganDosen;
  peran: string;
  tanggal_bimbingan: string | null;
  jam_bimbingan: string | null;
  status_bimbingan: string;
  is_konfirmasi: boolean;
  created_at: string;
  catatan: BimbinganCatatan[];
  lampiran: BimbinganLampiran[];
  historyPerubahan: BimbinganHistoryPerubahan[];
}

export interface BimbinganTugasAkhir {
  id: number;
  judul: string;
  status: string;
  mahasiswa: {
    id: number;
    user: BimbinganUser;
    nim?: string;
  };
  peranDosenTa: Array<{
    peran: string;
    dosen: BimbinganDosen;
  }>;
  bimbinganTa: BimbinganSession[];
}

export interface CreateCatatanDto {
  bimbingan_ta_id: number;
  catatan: string;
}

export interface SetJadwalDto {
  tanggal_bimbingan: string;
  jam_bimbingan: string;
}

export interface BimbinganListResponse {
  data: BimbinganTugasAkhir[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
