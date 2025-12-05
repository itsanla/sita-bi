export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Akses ditolak: Anda tidak memiliki izin',
  FORBIDDEN: 'Akses ditolak: Izin tidak mencukupi',
  NOT_FOUND: 'Data tidak ditemukan',
  INVALID_INPUT: 'Input tidak valid',
  DOSEN_NOT_FOUND: 'Profil dosen tidak ditemukan',
  MAHASISWA_NOT_FOUND: 'Profil mahasiswa tidak ditemukan',
  CAPACITY_EXCEEDED: 'Kapasitas pembimbing sudah penuh',
  OVERLAP_DETECTED:
    'Dosen tidak boleh menjadi pembimbing dan penguji di TA yang sama',
  VALIDATION_FAILED: 'Validasi gagal',
  PRODI_SCOPE_DENIED: 'Akses ditolak: Hanya untuk prodi',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'Data berhasil dibuat',
  UPDATED: 'Data berhasil diperbarui',
  DELETED: 'Data berhasil dihapus',
  ASSIGNED: 'Penugasan berhasil',
} as const;
