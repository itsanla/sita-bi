import type { PendaftaranSidang } from '@repo/db';
import { PrismaClient } from '@repo/db';
import { getRelativePath } from '../utils/upload.config';
import { PengaturanService } from './pengaturan.service';

export class PendaftaranSidangService {
  private prisma: PrismaClient;
  private pengaturanService: PengaturanService;

  constructor() {
    this.prisma = new PrismaClient();
    this.pengaturanService = new PengaturanService();
  }

  async getOrCreateRegistration(
    mahasiswaId: number,
  ): Promise<PendaftaranSidang> {
    const tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
    });

    if (!tugasAkhir) {
      throw new Error('Tugas akhir tidak ditemukan');
    }

    const existingRegistration = await this.prisma.pendaftaranSidang.findFirst({
      where: { tugas_akhir_id: tugasAkhir.id },
      orderBy: { created_at: 'desc' },
    });

    if (existingRegistration) {
      return existingRegistration;
    }

    return this.prisma.pendaftaranSidang.create({
      data: {
        tugas_akhir_id: tugasAkhir.id,
      },
    });
  }

  async uploadSingleFile(
    pendaftaranId: number,
    mahasiswaId: number,
    filePath: string,
    originalName: string,
    tipeDokumen: string,
  ) {
    const pendaftaran = await this.prisma.pendaftaranSidang.findUnique({
      where: { id: pendaftaranId },
      include: { tugasAkhir: true },
    });

    if (!pendaftaran) {
      throw new Error('Pendaftaran tidak ditemukan');
    }

    if (pendaftaran.tugasAkhir.mahasiswa_id !== mahasiswaId) {
      throw new Error('Tidak memiliki akses');
    }

    const relativePath = getRelativePath(filePath);

    await this.prisma.pendaftaranSidangFile.deleteMany({
      where: {
        pendaftaran_sidang_id: pendaftaranId,
        tipe_dokumen: tipeDokumen,
      },
    });

    return this.prisma.pendaftaranSidangFile.create({
      data: {
        pendaftaran_sidang_id: pendaftaranId,
        file_path: relativePath,
        original_name: originalName,
        tipe_dokumen: tipeDokumen,
      },
    });
  }

  async findMyRegistration(
    mahasiswaId: number,
  ): Promise<PendaftaranSidang | null> {
    const tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
      orderBy: { created_at: 'desc' },
    });

    if (!tugasAkhir) {
      return null;
    }

    return this.prisma.pendaftaranSidang.findFirst({
      where: { tugas_akhir_id: tugasAkhir.id },
      orderBy: { created_at: 'desc' },
      include: { files: true },
    });
  }

  async submitRegistration(mahasiswaId: number): Promise<PendaftaranSidang> {
    const tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
    });

    if (!tugasAkhir) {
      throw new Error('Tugas akhir tidak ditemukan');
    }

    const pendaftaran = await this.prisma.pendaftaranSidang.findFirst({
      where: { tugas_akhir_id: tugasAkhir.id },
      orderBy: { created_at: 'desc' },
      include: { files: true },
    });

    if (!pendaftaran) {
      throw new Error('Pendaftaran tidak ditemukan');
    }

    const pengaturan = await this.pengaturanService.getPengaturan();
    const syaratSidang = (pengaturan.syarat_pendaftaran_sidang as any[]) || [];

    if (pendaftaran.files.length < syaratSidang.length) {
      throw new Error('Upload semua dokumen terlebih dahulu');
    }

    await this.prisma.mahasiswa.update({
      where: { id: mahasiswaId },
      data: { siap_sidang: true },
    });

    return this.prisma.pendaftaranSidang.update({
      where: { id: pendaftaran.id },
      data: { is_submitted: true },
    });
  }
}
