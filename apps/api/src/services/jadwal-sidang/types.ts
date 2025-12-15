import { PeranDosen } from '@prisma/client';

export const PERAN_PENGUJI = [
  PeranDosen.penguji1,
  PeranDosen.penguji2,
  PeranDosen.penguji3,
] as const;

export interface PengaturanJadwal {
  max_mahasiswa_uji_per_dosen: number;
  durasi_sidang_menit: number;
  jeda_sidang_menit: number;
  jam_mulai_sidang: string;
  jam_selesai_sidang: string;
  hari_libur_tetap: string[];
  tanggal_libur_khusus: { tanggal: string; keterangan: string }[];
  ruangan_sidang: string[];
  waktu_istirahat?: { waktu: string; durasi_menit: number }[];
  jadwal_hari_khusus?: {
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    durasi_sidang_menit?: number;
    jeda_sidang_menit?: number;
    waktu_istirahat?: { waktu: string; durasi_menit: number }[];
  }[];
}

export interface TimeSlot {
  tanggal: Date;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan_id: number;
}
