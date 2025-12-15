import prisma from '../config/database';
import type { StatusPeriode } from '@repo/db';
import { parseWIBToUTC, getCurrentWIB, isDateInPast } from '../utils/timezone';
import { getSocketIO } from '../socket';

interface PeriodeTa {
  id: number;
  tahun: number;
  nama: string;
  status: StatusPeriode;
  tanggal_buka: Date | null;
  tanggal_tutup: Date | null;
}

export class PeriodeService {
  private static readonly PERIODE_NOT_FOUND = 'Periode tidak ditemukan';
  private static readonly PERIODE_ALREADY_EXISTS =
    'Periode untuk tahun ini sudah ada';
  private static readonly PERIODE_ALREADY_ACTIVE =
    'Sudah ada periode yang aktif';
  private static readonly INVALID_DATE =
    'Tanggal pembukaan tidak boleh di masa lalu';
  private static readonly ONLY_ACTIVE_CAN_CLOSE =
    'Hanya periode aktif yang bisa ditutup';
  private static readonly CANNOT_DELETE_ACTIVE =
    'Tidak dapat menghapus periode yang sedang aktif';
  private static readonly PERIODE_ALREADY_ACTIVE_STATUS = 'Periode sudah aktif';
  private static readonly ONLY_PERSIAPAN_CAN_OPEN =
    'Hanya periode dengan status PERSIAPAN yang dapat dibuka';
  private static readonly CANNOT_CANCEL_ACTIVE =
    'Tidak dapat membatalkan jadwal periode yang sudah aktif';
  private static readonly PERIODE_OVERLAP =
    'Jadwal periode bertabrakan dengan periode lain yang aktif atau dijadwalkan';
  private static readonly HAS_ACTIVE_TA =
    'Tidak dapat menutup periode karena masih ada Tugas Akhir yang belum selesai';

  private static activePeriodeCache: PeriodeTa | null = null;
  private static cacheTime = 0;
  private static CACHE_TTL = 60000;

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

  async bukaPeriode(
    tahun: number,
    userId: number,
    tanggalBuka?: string,
  ): Promise<PeriodeTa> {
    const existing = await prisma.periodeTa.findUnique({
      where: { tahun },
    });

    if (existing !== null) {
      throw new Error(PeriodeService.PERIODE_ALREADY_EXISTS);
    }

    const isScheduled = tanggalBuka !== undefined && tanggalBuka.length > 0;
    let tanggalBukaDate: Date;

    if (isScheduled) {
      tanggalBukaDate = parseWIBToUTC(tanggalBuka);
      if (isDateInPast(tanggalBukaDate)) {
        throw new Error(PeriodeService.INVALID_DATE);
      }

      const overlap = await prisma.periodeTa.findFirst({
        where: {
          OR: [
            { status: 'AKTIF' },
            {
              status: 'PERSIAPAN',
              tanggal_buka: { lte: tanggalBukaDate },
            },
          ],
        },
      });

      if (overlap !== null) {
        throw new Error(PeriodeService.PERIODE_OVERLAP);
      }
    } else {
      const activeCount = await prisma.periodeTa.count({
        where: { status: 'AKTIF' },
      });

      if (activeCount > 0) {
        throw new Error(PeriodeService.PERIODE_ALREADY_ACTIVE);
      }
      tanggalBukaDate = getCurrentWIB();
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
        status: isScheduled ? 'PERSIAPAN' : 'AKTIF',
        tanggal_buka: tanggalBukaDate,
        dibuka_oleh: userId,
        pengaturan_snapshot: JSON.stringify(snapshot),
      },
    });

    this.invalidateCache();
    this.emitPeriodeUpdate();
    return periode;
  }

  async tutupPeriode(
    periodeId: number,
    userId: number,
    catatan?: string,
  ): Promise<PeriodeTa> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
      include: {
        tugasAkhir: {
          where: {
            status: { notIn: ['SELESAI', 'DITOLAK'] },
          },
          select: { id: true },
        },
      },
    });

    if (periode === null) {
      throw new Error(PeriodeService.PERIODE_NOT_FOUND);
    }

    if (periode.status !== 'AKTIF') {
      throw new Error(PeriodeService.ONLY_ACTIVE_CAN_CLOSE);
    }

    if (periode.tugasAkhir.length > 0) {
      throw new Error(PeriodeService.HAS_ACTIVE_TA);
    }

    const updated = await prisma.periodeTa.update({
      where: { id: periodeId },
      data: {
        status: 'SELESAI',
        tanggal_tutup: getCurrentWIB(),
        ditutup_oleh: userId,
        catatan_penutupan: catatan ?? null,
      },
    });

    this.invalidateCache();
    this.emitPeriodeUpdate();
    return updated;
  }

  invalidateCache(): void {
    PeriodeService.activePeriodeCache = null;
    PeriodeService.cacheTime = 0;
  }

  emitPeriodeUpdate(): void {
    const io = getSocketIO();
    if (io) {
      io.emit('periode:updated');
    }
  }

  async setJadwalBuka(
    periodeId: number,
    tanggalBuka: string,
  ): Promise<PeriodeTa> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
    });

    if (periode === null) {
      throw new Error(PeriodeService.PERIODE_NOT_FOUND);
    }

    if (periode.status === 'AKTIF') {
      throw new Error('Tidak dapat mengubah jadwal periode yang sudah aktif');
    }

    const tanggalBukaDate = parseWIBToUTC(tanggalBuka);

    if (isDateInPast(tanggalBukaDate)) {
      throw new Error(PeriodeService.INVALID_DATE);
    }

    const overlap = await prisma.periodeTa.findFirst({
      where: {
        id: { not: periodeId },
        OR: [
          { status: 'AKTIF' },
          {
            status: 'PERSIAPAN',
            tanggal_buka: { lte: tanggalBukaDate },
          },
        ],
      },
    });

    if (overlap !== null) {
      throw new Error(PeriodeService.PERIODE_OVERLAP);
    }

    const updated = await prisma.periodeTa.update({
      where: { id: periodeId },
      data: {
        tanggal_buka: tanggalBukaDate,
        status: 'PERSIAPAN',
      },
    });

    this.invalidateCache();
    this.emitPeriodeUpdate();
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
      periode?.pengaturan_snapshot !== undefined &&
      periode.pengaturan_snapshot.length > 0
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
      include: {
        tugasAkhir: { select: { id: true } },
        sidang: { select: { id: true } },
      },
    });

    if (periode === null) {
      throw new Error(PeriodeService.PERIODE_NOT_FOUND);
    }

    if (periode.status === 'AKTIF') {
      throw new Error(PeriodeService.CANNOT_DELETE_ACTIVE);
    }

    if (periode.tugasAkhir.length > 0 || periode.sidang.length > 0) {
      throw new Error(
        'Tidak dapat menghapus periode yang memiliki data terkait',
      );
    }

    await prisma.periodeTa.delete({
      where: { id: periodeId },
    });

    this.invalidateCache();
    this.emitPeriodeUpdate();
  }

  async bukaSekarang(periodeId: number): Promise<PeriodeTa> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
    });

    if (periode === null) {
      throw new Error(PeriodeService.PERIODE_NOT_FOUND);
    }

    if (periode.status === 'AKTIF') {
      throw new Error(PeriodeService.PERIODE_ALREADY_ACTIVE_STATUS);
    }

    if (periode.status !== 'PERSIAPAN') {
      throw new Error(PeriodeService.ONLY_PERSIAPAN_CAN_OPEN);
    }

    const activeCount = await prisma.periodeTa.count({
      where: { status: 'AKTIF' },
    });

    if (activeCount > 0) {
      throw new Error(PeriodeService.PERIODE_ALREADY_ACTIVE);
    }

    const updated = await prisma.periodeTa.update({
      where: { id: periodeId },
      data: {
        status: 'AKTIF',
        tanggal_buka: getCurrentWIB(),
      },
    });

    this.invalidateCache();
    this.emitPeriodeUpdate();
    return updated;
  }

  async getRiwayatPeriode(): Promise<
    {
      id: number;
      action: string;
      details: string | null;
      user: { name: string } | null;
      created_at: Date;
    }[]
  > {
    const logs = await prisma.log.findMany({
      where: { module: 'periode' },
      include: { user: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return logs;
  }

  async autoEnrollUserToPeriode(userId: number): Promise<void> {
    const activePeriode = await this.getActivePeriode();
    if (!activePeriode) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        mahasiswa: {
          include: {
            tugasAkhir: {
              include: {
                sidang: {
                  where: { status_hasil: { in: ['lulus', 'lulus_revisi'] } },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return;

    const userRole = user.roles?.[0]?.name;
    if (!userRole || !['mahasiswa', 'dosen'].includes(userRole)) return;

    // Cek apakah mahasiswa sudah lulus
    if (userRole === 'mahasiswa' && user.mahasiswa) {
      const hasGraduated = user.mahasiswa.tugasAkhir?.sidang?.some((s) =>
        ['lulus', 'lulus_revisi'].includes(s.status_hasil),
      );
      if (hasGraduated) return;
    }

    // Auto-enroll ke periode aktif
    try {
      await prisma.userPeriodeParticipation.upsert({
        where: {
          user_id_periode_ta_id: {
            user_id: userId,
            periode_ta_id: activePeriode.id,
          },
        },
        update: {},
        create: {
          user_id: userId,
          periode_ta_id: activePeriode.id,
          role: userRole,
        },
      });
    } catch (error) {
      // Fallback jika tabel belum ada
      console.log('Auto-enroll failed, using fallback');
    }
  }

  async getMahasiswaPeriodes(userId: number): Promise<PeriodeTa[]> {
    // Auto-enroll user ke periode aktif
    await this.autoEnrollUserToPeriode(userId);

    try {
      const participations = await prisma.userPeriodeParticipation.findMany({
        where: { user_id: userId },
        include: {
          periodeTa: {
            select: {
              id: true,
              tahun: true,
              nama: true,
              status: true,
              tanggal_buka: true,
              tanggal_tutup: true,
            },
          },
        },
        orderBy: { periodeTa: { tahun: 'desc' } },
      });

      return participations.map((p) => p.periodeTa);
    } catch (error) {
      // Fallback ke metode lama jika tabel baru belum ada
      const activePeriode = await this.getActivePeriode();
      return activePeriode ? [activePeriode] : [];
    }
  }

  async getDosenPeriodes(userId: number): Promise<PeriodeTa[]> {
    // Auto-enroll dosen ke periode aktif
    await this.autoEnrollUserToPeriode(userId);

    try {
      const participations = await prisma.userPeriodeParticipation.findMany({
        where: { user_id: userId },
        include: {
          periodeTa: {
            select: {
              id: true,
              tahun: true,
              nama: true,
              status: true,
              tanggal_buka: true,
              tanggal_tutup: true,
            },
          },
        },
        orderBy: { periodeTa: { tahun: 'desc' } },
      });

      return participations.map((p) => p.periodeTa);
    } catch (error) {
      // Fallback ke metode lama jika tabel baru belum ada
      const activePeriode = await this.getActivePeriode();
      return activePeriode ? [activePeriode] : [];
    }
  }

  async getPeriodeById(periodeId: number): Promise<PeriodeTa | null> {
    return prisma.periodeTa.findUnique({
      where: { id: periodeId },
      select: {
        id: true,
        tahun: true,
        nama: true,
        status: true,
        tanggal_buka: true,
        tanggal_tutup: true,
      },
    });
  }

  async batalkanJadwal(periodeId: number): Promise<PeriodeTa> {
    const periode = await prisma.periodeTa.findUnique({
      where: { id: periodeId },
    });

    if (periode === null) {
      throw new Error(PeriodeService.PERIODE_NOT_FOUND);
    }

    if (periode.status === 'AKTIF') {
      throw new Error(PeriodeService.CANNOT_CANCEL_ACTIVE);
    }

    if (periode.status !== 'PERSIAPAN') {
      throw new Error(
        'Hanya periode dengan status PERSIAPAN yang dapat dibatalkan',
      );
    }

    await prisma.periodeTa.delete({
      where: { id: periodeId },
    });

    this.invalidateCache();
    this.emitPeriodeUpdate();
    return periode;
  }
}
