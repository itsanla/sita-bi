type ModeValidasi = 'SALAH_SATU' | 'KEDUA_PEMBIMBING' | 'PEMBIMBING_1_SAJA';

export function getValidasiJudulMessage(mode: ModeValidasi): string {
  switch (mode) {
    case 'SALAH_SATU':
      return 'Judul harus divalidasi oleh salah satu pembimbing';
    case 'KEDUA_PEMBIMBING':
      return 'Judul harus divalidasi oleh kedua pembimbing';
    case 'PEMBIMBING_1_SAJA':
      return 'Judul harus divalidasi oleh Pembimbing 1';
    default:
      return 'Judul harus divalidasi oleh pembimbing';
  }
}

export function getValidasiDrafMessage(mode: ModeValidasi): string {
  switch (mode) {
    case 'SALAH_SATU':
      return 'Draf harus divalidasi oleh salah satu pembimbing';
    case 'KEDUA_PEMBIMBING':
      return 'Draf harus divalidasi oleh kedua pembimbing';
    case 'PEMBIMBING_1_SAJA':
      return 'Draf harus divalidasi oleh Pembimbing 1';
    default:
      return 'Draf harus divalidasi oleh pembimbing';
  }
}

export function isJudulValid(
  mode: ModeValidasi,
  divalidasiP1: boolean,
  divalidasiP2: boolean,
): boolean {
  switch (mode) {
    case 'SALAH_SATU':
      return divalidasiP1 || divalidasiP2;
    case 'KEDUA_PEMBIMBING':
      return divalidasiP1 && divalidasiP2;
    case 'PEMBIMBING_1_SAJA':
      return divalidasiP1;
    default:
      return false;
  }
}

export function isDrafValid(
  mode: ModeValidasi,
  divalidasiP1: number | null,
  divalidasiP2: number | null,
): boolean {
  switch (mode) {
    case 'SALAH_SATU':
      return divalidasiP1 !== null || divalidasiP2 !== null;
    case 'KEDUA_PEMBIMBING':
      return divalidasiP1 !== null && divalidasiP2 !== null;
    case 'PEMBIMBING_1_SAJA':
      return divalidasiP1 !== null;
    default:
      return false;
  }
}
