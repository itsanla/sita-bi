import { getPrismaClient } from '../config/database';
import { ModeValidasi } from '../prisma-client';

const prisma = getPrismaClient();

export async function getAturanValidasi(): Promise<{
  id: number;
  mode_validasi_judul: ModeValidasi;
  mode_validasi_draf: ModeValidasi;
}> {
  let aturan = await prisma.aturanValidasi.findFirst();

  aturan ??= await prisma.aturanValidasi.create({
    data: {
      mode_validasi_judul: ModeValidasi.KEDUA_PEMBIMBING,
      mode_validasi_draf: ModeValidasi.KEDUA_PEMBIMBING,
    },
  });

  return aturan;
}

export function isJudulValid(
  modeValidasi: ModeValidasi,
  divalidasiP1: boolean,
  divalidasiP2: boolean,
): boolean {
  // Grandfathering: Jika sudah ada validasi, tetap dianggap valid
  const hasAnyValidation = divalidasiP1 || divalidasiP2;

  if (!hasAnyValidation) {
    // Belum ada validasi sama sekali, gunakan aturan baru
    return false;
  }

  // Jika sudah ada validasi, cek apakah memenuhi aturan saat ini
  switch (modeValidasi) {
    case ModeValidasi.SALAH_SATU:
      return divalidasiP1 || divalidasiP2;
    case ModeValidasi.KEDUA_PEMBIMBING:
      // Jika aturan berubah ke KEDUA_PEMBIMBING tapi sudah ada 1 validasi,
      // tetap valid (grandfathering)
      return divalidasiP1 || divalidasiP2;
    case ModeValidasi.PEMBIMBING_1_SAJA:
      // Jika aturan berubah ke PEMBIMBING_1_SAJA tapi P2 sudah validasi,
      // tetap valid (grandfathering)
      return divalidasiP1 || divalidasiP2;
    default:
      return false;
  }
}

export function isDrafValid(
  modeValidasi: ModeValidasi,
  divalidasiP1: number | null,
  divalidasiP2: number | null,
): boolean {
  // Grandfathering: Jika sudah ada validasi, tetap dianggap valid
  const hasAnyValidation = divalidasiP1 !== null || divalidasiP2 !== null;

  if (!hasAnyValidation) {
    // Belum ada validasi sama sekali
    return false;
  }

  // Jika sudah ada validasi, cek apakah memenuhi aturan saat ini
  switch (modeValidasi) {
    case ModeValidasi.SALAH_SATU:
      return divalidasiP1 !== null || divalidasiP2 !== null;
    case ModeValidasi.KEDUA_PEMBIMBING:
      // Jika aturan berubah ke KEDUA_PEMBIMBING tapi sudah ada 1 validasi,
      // tetap valid (grandfathering)
      return divalidasiP1 !== null || divalidasiP2 !== null;
    case ModeValidasi.PEMBIMBING_1_SAJA:
      // Jika aturan berubah ke PEMBIMBING_1_SAJA tapi P2 sudah validasi,
      // tetap valid (grandfathering)
      return divalidasiP1 !== null || divalidasiP2 !== null;
    default:
      return false;
  }
}
