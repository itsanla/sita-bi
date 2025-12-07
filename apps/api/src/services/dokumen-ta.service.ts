import { PrismaClient } from '@repo/db';
import { NotFoundError, UnauthorizedError } from '../errors/AppError';

export class DokumenTAService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async uploadDokumen(
    tugasAkhirId: number,
    filePath: string,
  ): Promise<unknown> {
    const tugasAkhir = await this.prisma.tugasAkhir.findUnique({
      where: { id: tugasAkhirId },
    });

    if (tugasAkhir === null) {
      throw new NotFoundError('Tugas Akhir tidak ditemukan');
    }

    const latestVersion = await this.prisma.dokumenTa.findFirst({
      where: { tugas_akhir_id: tugasAkhirId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestVersion?.version ?? 0) + 1;

    return this.prisma.dokumenTa.create({
      data: {
        tugas_akhir_id: tugasAkhirId,
        file_path: filePath,
        tipe_dokumen: 'bimbingan',
        version: newVersion,
        status_validasi: 'menunggu',
      },
    });
  }

  async validasiDokumen(
    dokumenId: number,
    dosenUserId: number,
  ): Promise<unknown> {
    const { getAturanValidasi, isDrafValid } =
      await import('../utils/aturan-validasi');

    const dosen = await this.prisma.dosen.findUnique({
      where: { user_id: dosenUserId },
    });

    if (dosen === null) {
      throw new NotFoundError('Dosen tidak ditemukan');
    }

    const dokumen = await this.prisma.dokumenTa.findUnique({
      where: { id: dokumenId },
      include: {
        tugasAkhir: {
          include: {
            peranDosenTa: true,
          },
        },
      },
    });

    if (dokumen === null) {
      throw new NotFoundError('Dokumen tidak ditemukan');
    }

    const peranDosen = dokumen.tugasAkhir.peranDosenTa.find(
      (p) => p.dosen_id === dosen.id,
    );

    if (
      peranDosen === undefined ||
      (peranDosen.peran !== 'pembimbing1' && peranDosen.peran !== 'pembimbing2')
    ) {
      throw new UnauthorizedError(
        'Anda bukan pembimbing untuk tugas akhir ini',
      );
    }

    // Check if this specific pembimbing already validated
    if (peranDosen.peran === 'pembimbing1' && dokumen.divalidasi_oleh_p1 !== null) {
      throw new UnauthorizedError('Anda sudah memvalidasi draf ini');
    }
    if (peranDosen.peran === 'pembimbing2' && dokumen.divalidasi_oleh_p2 !== null) {
      throw new UnauthorizedError('Anda sudah memvalidasi draf ini');
    }

    // Get aturan validasi
    const aturan = await getAturanValidasi();
    const modeValidasi = aturan.mode_validasi_draf;

    // Check if allowed to validate based on mode
    if (
      modeValidasi === 'PEMBIMBING_1_SAJA' &&
      peranDosen.peran !== 'pembimbing1'
    ) {
      throw new UnauthorizedError(
        'Hanya Pembimbing 1 yang dapat memvalidasi draf sesuai aturan',
      );
    }

    const updateData: {
      divalidasi_oleh_p1?: number;
      divalidasi_oleh_p2?: number;
    } = {};

    if (peranDosen.peran === 'pembimbing1') {
      updateData.divalidasi_oleh_p1 = dosen.id;
    } else if (peranDosen.peran === 'pembimbing2') {
      updateData.divalidasi_oleh_p2 = dosen.id;
    }

    const updated = await this.prisma.dokumenTa.update({
      where: { id: dokumenId },
      data: updateData,
    });

    // Check if should mark as approved based on mode
    const shouldApprove = isDrafValid(
      modeValidasi,
      updated.divalidasi_oleh_p1,
      updated.divalidasi_oleh_p2,
    );

    if (shouldApprove) {
      await this.prisma.dokumenTa.update({
        where: { id: dokumenId },
        data: { status_validasi: 'disetujui' },
      });
    }

    return updated;
  }

  async batalkanValidasiDokumen(
    dokumenId: number,
    dosenUserId: number,
  ): Promise<unknown> {
    const dosen = await this.prisma.dosen.findUnique({
      where: { user_id: dosenUserId },
    });

    if (dosen === null) {
      throw new NotFoundError('Dosen tidak ditemukan');
    }

    const dokumen = await this.prisma.dokumenTa.findUnique({
      where: { id: dokumenId },
      include: {
        tugasAkhir: {
          include: {
            peranDosenTa: true,
          },
        },
      },
    });

    if (dokumen === null) {
      throw new NotFoundError('Dokumen tidak ditemukan');
    }

    const peranDosen = dokumen.tugasAkhir.peranDosenTa.find(
      (p) => p.dosen_id === dosen.id,
    );

    if (
      peranDosen === undefined ||
      (peranDosen.peran !== 'pembimbing1' && peranDosen.peran !== 'pembimbing2')
    ) {
      throw new UnauthorizedError(
        'Anda bukan pembimbing untuk tugas akhir ini',
      );
    }

    const updateData: {
      divalidasi_oleh_p1?: null;
      divalidasi_oleh_p2?: null;
    } = {};

    if (peranDosen.peran === 'pembimbing1') {
      if (dokumen.divalidasi_oleh_p1 !== dosen.id) {
        throw new UnauthorizedError('Anda belum memvalidasi draf ini');
      }
      updateData.divalidasi_oleh_p1 = null;
    } else if (peranDosen.peran === 'pembimbing2') {
      if (dokumen.divalidasi_oleh_p2 !== dosen.id) {
        throw new UnauthorizedError('Anda belum memvalidasi draf ini');
      }
      updateData.divalidasi_oleh_p2 = null;
    }

    const updated = await this.prisma.dokumenTa.update({
      where: { id: dokumenId },
      data: { ...updateData, status_validasi: 'menunggu' },
    });

    return updated;
  }
}
