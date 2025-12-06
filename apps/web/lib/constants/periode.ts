export const PERIODE_STATUS = {
  AKTIF: 'AKTIF',
  SELESAI: 'SELESAI',
  PERSIAPAN: 'PERSIAPAN',
} as const;

export type PeriodeStatus =
  (typeof PERIODE_STATUS)[keyof typeof PERIODE_STATUS];

export const PERIODE_MESSAGES = {
  ERROR_DEFAULT: 'Gagal memproses periode',
  ERROR_LOAD: 'Gagal memuat data periode',
  ERROR_INVALID_YEAR: 'Tahun tidak valid',
  ERROR_PAST_DATE: 'Tanggal pembukaan tidak boleh di masa lalu',
  SUCCESS_OPEN: (tahun: number) => `Periode TA ${tahun} berhasil dibuka`,
  SUCCESS_SCHEDULE: 'Jadwal pembukaan berhasil disimpan',
  SUCCESS_CLOSE: (tahun: number) => `Periode TA ${tahun} berhasil ditutup`,
  SUCCESS_DELETE: (tahun: number) => `Periode TA ${tahun} berhasil dihapus`,
  SUCCESS_CANCEL: 'Jadwal pembukaan dibatalkan',
  CONFIRM_OPEN_NOW: (tahun: number) => `Buka Periode TA ${tahun} sekarang?`,
  CONFIRM_SCHEDULE: (tahun: number) =>
    `Simpan jadwal pembukaan Periode TA ${tahun}?`,
  CONFIRM_CLOSE: (tahun: number) => `Tutup Periode TA ${tahun}?`,
  CONFIRM_DELETE: (tahun: number) =>
    `Hapus Periode TA ${tahun}? Tindakan ini tidak dapat dibatalkan.`,
  CONFIRM_CANCEL: (tahun: number) =>
    `Batalkan jadwal pembukaan Periode TA ${tahun}?`,
} as const;

export const PERIODE_UPDATED_EVENT = 'periode-updated';
