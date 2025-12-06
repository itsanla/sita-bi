import prisma from '../config/database';
import type { StatusPeriode } from '@repo/db';

interface PeriodeTa {
  id: number;
  tahun: number;
  nama: string;
  status: StatusPeriode;
  tanggal_buka: Date | null;
  tanggal_tutup: Date | null;
}

export class PeriodeService {
  private static activePeriodeCache: PeriodeTa | null = null;
  private static cacheTime = 0;
  private static CACHE_TTL = 60000; // 1 menit

  async getActivePeriode(): Promise<PeriodeTa | null> {
    const now = Date.now();
    if (
      PeriodeService.activePeriodeCache !== null &&
      now - PeriodeService.cacheTime < PeriodeService.CACHE_TTL
    ) {
      return PeriodeService.activePeriodeCache;
    }

    const periode = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
      select: {
        id: true,
        tahun: true,
        nama: true,
        status: true,
        tanggal_buka: true,
        tanggal_tutup: true,
      },
    });

    PeriodeService.activePeriodeCache = periode;
    PeriodeService.cacheTime = now;
    return periode;
  }

  async getAllPeriode(): Promise<PeriodeTa[]> {
    return prisma.periodeTa.findMany({
      select: {
        id: true,
        tahun: true,
        nama: true,
        status: true,
        tanggal_buka: true,
        tanggal_tutup: true,
      },
      orderBy: { tahun: 'desc' },
    });
  }

  async bukaPeriode(tahun: number, userId: number, tanggalBuka?: string): Promise<PeriodeTa> {
    const existing = await prisma.periodeTa.findUnique({
      where: { tahun },
    });

    if (existing !== null) {
      throw new Error('Periode untuk tahun ini sudah ada');
    }

    if (!tanggalBuka) {
      const activeCount = await prisma.periodeTa.count({
        where: { status: 'AKTIF' },
      });

      if (activeCount > 0) {
        throw new Error('Sudah ada periode yang aktif');
      }
    }

    const pengaturan = await prisma.pengaturanSistem.findMany();
    const snapshot: Record<string, string> = {};
    for (const p of pengaturan) {
      snapshot[p.key] = p.value;
    }

    const periode = await prisma.periodeTa.create({
      data: {
        tahun,
        nama: `Periode TA ${tahun}`,
        status: tanggalBuka ? 'PERSIAPAN' : 'AKTIF',
        tanggal_buka: tanggalBuka ? new Date(tanggalBuka) : new Date(),
        dibuka_oleh: userId,
        pengaturan_snapshot: JSON.stringify(snapshot),
      },
    });

    this.invalidateCache();
    return periode;
  }

  async tutupPeriode(
    periodeId: number,
    userId: number,
    catatan?: string,
  ): Promise<PeriodeTa> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
    });

    if (periode === null) {
      throw new Error('Periode tidak ditemukan');
    }

    if (periode.status !== 'AKTIF') {
      throw new Error('Hanya periode aktif yang bisa ditutup');
    }

    const updated = await prisma.periodeTa.update({
      where: { id: periodeId },
      data: {
        status: 'SELESAI',
        tanggal_tutup: new Date(),
        ditutup_oleh: userId,
        catatan_penutupan: catatan,
      },
    });

    this.invalidateCache();
    return updated;
  }

  invalidateCache(): void {
    PeriodeService.activePeriodeCache = null;
    PeriodeService.cacheTime = 0;
  }

  async setJadwalBuka(periodeId: number, tanggalBuka: string): Promise<PeriodeTa> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
    });

    if (periode === null) {
      throw new Error('Periode tidak ditemukan');
    }

    const updated = await prisma.periodeTa.update({
      where: { id: periodeId },
      data: {
        tanggal_buka: new Date(tanggalBuka),
      },
    });

    this.invalidateCache();
    return updated;
  }

  async getPeriodeStatus(): Promise<{
    isActive: boolean;
    periode: PeriodeTa | null;
    tanggalBuka: Date | null;
  }> {
    const periodeAktif = await this.getActivePeriode();
    
    if (periodeAktif) {
      return {
        isActive: true,
        periode: periodeAktif,
        tanggalBuka: periodeAktif.tanggal_buka,
      };
    }

    const periodePersiapan = await prisma.periodeTa.findFirst({
      where: { status: 'PERSIAPAN' },
      select: {
        id: true,
        tahun: true,
        nama: true,
        status: true,
        tanggal_buka: true,
        tanggal_tutup: true,
      },
      orderBy: { tanggal_buka: 'asc' },
    });

    return {
      isActive: false,
      periode: periodePersiapan,
      tanggalBuka: periodePersiapan?.tanggal_buka ?? null,
    };
  }

  async getPengaturanByPeriode(
    key: string,
    periodeId: number,
  ): Promise<string | null> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
      select: { pengaturan_snapshot: true },
    });

    if (
      periode?.pengaturan_snapshot !== null &&
      periode?.pengaturan_snapshot !== undefined
    ) {
      const snapshot = JSON.parse(periode.pengaturan_snapshot) as Record<
        string,
        string
      >;
      if (snapshot[key] !== undefined) {
        return snapshot[key];
      }
    }

    const global = await prisma.pengaturanSistem.findUnique({
      where: { key },
    });

    return global?.value ?? null;
  }

  async hapusPeriode(periodeId: number): Promise<void> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
    });

    if (periode === null) {
      throw new Error('Periode tidak ditemukan');
    }

    if (periode.status === 'AKTIF') {
      throw new Error('Tidak dapat menghapus periode yang sedang aktif');
    }

    await prisma.periodeTa.delete({
      where: { id: periodeId },
    });

    this.invalidateCache();
  }

  async bukaSekarang(periodeId: number): Promise<PeriodeTa> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
    });

    if (periode === null) {
      throw new Error('Periode tidak ditemukan');
    }

    if (periode.status === 'AKTIF') {
      throw new Error('Periode sudah aktif');
    }

    const activeCount = await prisma.periodeTa.count({
      where: { status: 'AKTIF' },
    });

    if (activeCount > 0) {
      throw new Error('Sudah ada periode yang aktif');
    }

    const updated = await prisma.periodeTa.update({
      where: { id: periodeId },
      data: {
        status: 'AKTIF',
        tanggal_buka: new Date(),
      },
    });

    this.invalidateCache();
    return updated;
  }

  async batalkanJadwal(periodeId: number): Promise<PeriodeTa> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
    });

    if (periode === null) {
      throw new Error('Periode tidak ditemukan');
    }

    if (periode.status === 'AKTIF') {
      throw new Error('Tidak dapat membatalkan jadwal periode yang sudah aktif');
    }

    await prisma.periodeTa.delete({
      where: { id: periodeId },
    });

    this.invalidateCache();
    return periode;
  }
}
