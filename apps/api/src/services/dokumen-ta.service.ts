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

    if (
      updated.divalidasi_oleh_p1 !== null &&
      updated.divalidasi_oleh_p2 !== null
    ) {
      await this.prisma.dokumenTa.update({
        where: { id: dokumenId },
        data: { status_validasi: 'disetujui' },
      });
    }

    return updated;
  }
}
