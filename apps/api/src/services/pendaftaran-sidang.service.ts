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

    const validasiAktif = await this.pengaturanService.getPengaturanByKey(
      'validasi_pendaftaran_sidang_aktif',
    );

    if (validasiAktif === 'false') {
      await this.prisma.mahasiswa.update({
        where: { id: mahasiswaId },
        data: { siap_sidang: true },
      });
    } else {
      await this.prisma.mahasiswa.update({
        where: { id: mahasiswaId },
        data: { siap_sidang: false },
      });
    }

    return this.prisma.pendaftaranSidang.update({
      where: { id: pendaftaran.id },
      data: {
        is_submitted: true,
        status_validasi: validasiAktif === 'false' ? 'approved' : 'pending',
      },
    });
  }

  async cancelRegistration(mahasiswaId: number): Promise<PendaftaranSidang> {
    const tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
    });

    if (!tugasAkhir) {
      throw new Error('Tugas akhir tidak ditemukan');
    }

    const pendaftaran = await this.prisma.pendaftaranSidang.findFirst({
      where: { tugas_akhir_id: tugasAkhir.id },
      orderBy: { created_at: 'desc' },
    });

    if (!pendaftaran) {
      throw new Error('Pendaftaran tidak ditemukan');
    }

    await this.prisma.mahasiswa.update({
      where: { id: mahasiswaId },
      data: { siap_sidang: false },
    });

    return this.prisma.pendaftaranSidang.update({
      where: { id: pendaftaran.id },
      data: {
        is_submitted: false,
        status_validasi: 'pending',
        divalidasi_pembimbing_1: false,
        divalidasi_pembimbing_2: false,
        divalidasi_prodi: false,
        divalidasi_jurusan: false,
        validated_at: null,
        validated_by: null,
      },
    });
  }

  async deleteFile(fileId: number, mahasiswaId: number): Promise<void> {
    const file = await this.prisma.pendaftaranSidangFile.findUnique({
      where: { id: fileId },
      include: { pendaftaran: { include: { tugasAkhir: true } } },
    });

    if (!file) {
      throw new Error('File tidak ditemukan');
    }

    if (file.pendaftaran.tugasAkhir.mahasiswa_id !== mahasiswaId) {
      throw new Error('Tidak memiliki akses');
    }

    if (file.pendaftaran.is_submitted) {
      throw new Error(
        'Tidak dapat menghapus file setelah pendaftaran disubmit',
      );
    }

    await this.prisma.pendaftaranSidangFile.delete({
      where: { id: fileId },
    });
  }

  async validateRegistration(
    pendaftaranId: number,
    userId: number,
    action: 'approve' | 'reject',
    catatan?: string,
  ): Promise<PendaftaranSidang> {
    const pendaftaran = await this.prisma.pendaftaranSidang.findUnique({
      where: { id: pendaftaranId },
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: true,
            peranDosenTa: { include: { dosen: true } },
          },
        },
      },
    });

    if (!pendaftaran) {
      throw new Error('Pendaftaran tidak ditemukan');
    }

    if (!pendaftaran.is_submitted) {
      throw new Error('Pendaftaran belum disubmit');
    }

    const pengaturan = await this.pengaturanService.getPengaturan();
    const validasiPembimbing1 = pengaturan.validasi_pembimbing_1 === 'true';
    const validasiPembimbing2 = pengaturan.validasi_pembimbing_2 === 'true';
    const validasiProdi = pengaturan.validasi_prodi === 'true';
    const validasiJurusan = pengaturan.validasi_jurusan === 'true';

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, dosen: true },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const userRoles = user.roles.map((r) => r.name);
    const isPembimbing1 = pendaftaran.tugasAkhir.peranDosenTa.some(
      (p) => p.peran === 'pembimbing1' && p.dosen.user_id === userId,
    );
    const isPembimbing2 = pendaftaran.tugasAkhir.peranDosenTa.some(
      (p) => p.peran === 'pembimbing2' && p.dosen.user_id === userId,
    );
    const mahasiswaProdi = pendaftaran.tugasAkhir.mahasiswa.prodi;
    const isProdiD3 = userRoles.includes('prodi_d3') && mahasiswaProdi === 'D3';
    const isProdiD4 = userRoles.includes('prodi_d4') && mahasiswaProdi === 'D4';
    const isProdi = isProdiD3 || isProdiD4;
    const isJurusan = userRoles.includes('jurusan');

    let updateData: any = {
      validated_at: new Date(),
      validated_by: userId,
    };

    if (action === 'reject') {
      updateData.status_validasi = 'rejected';
      await this.prisma.mahasiswa.update({
        where: { id: pendaftaran.tugasAkhir.mahasiswa_id },
        data: { siap_sidang: false },
      });
    } else {
      let hasAccess = false;

      if (validasiPembimbing1 && isPembimbing1) {
        updateData.divalidasi_pembimbing_1 = true;
        hasAccess = true;
      }

      if (validasiPembimbing2 && isPembimbing2) {
        updateData.divalidasi_pembimbing_2 = true;
        hasAccess = true;
      }

      if (validasiProdi && isProdi) {
        if (!isProdiD3 && !isProdiD4) {
          throw new Error(
            'Anda hanya bisa memvalidasi mahasiswa dari prodi yang sama',
          );
        }
        updateData.divalidasi_prodi = true;
        hasAccess = true;
      }

      if (validasiJurusan && isJurusan) {
        updateData.divalidasi_jurusan = true;
        hasAccess = true;
      }

      if (!hasAccess) {
        throw new Error('Anda tidak memiliki akses untuk validasi ini');
      }

      const allValidated =
        (!validasiPembimbing1 ||
          pendaftaran.divalidasi_pembimbing_1 ||
          updateData.divalidasi_pembimbing_1) &&
        (!validasiPembimbing2 ||
          pendaftaran.divalidasi_pembimbing_2 ||
          updateData.divalidasi_pembimbing_2) &&
        (!validasiProdi ||
          pendaftaran.divalidasi_prodi ||
          updateData.divalidasi_prodi) &&
        (!validasiJurusan ||
          pendaftaran.divalidasi_jurusan ||
          updateData.divalidasi_jurusan);

      if (allValidated) {
        updateData.status_validasi = 'approved';
        await this.prisma.mahasiswa.update({
          where: { id: pendaftaran.tugasAkhir.mahasiswa_id },
          data: { siap_sidang: true },
        });
      }
    }

    return this.prisma.pendaftaranSidang.update({
      where: { id: pendaftaranId },
      data: updateData,
    });
  }

  async getListForValidation(userId: number): Promise<PendaftaranSidang[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, dosen: true },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const userRoles = user.roles.map((r) => r.name);
    const isJurusan = userRoles.includes('jurusan');
    const isProdiD3 = userRoles.includes('prodi_d3');
    const isProdiD4 = userRoles.includes('prodi_d4');

    let whereClause: any = {
      is_submitted: true,
    };

    if (isJurusan) {
      // Jurusan bisa lihat semua
    } else if (isProdiD3) {
      whereClause.tugasAkhir = {
        mahasiswa: { prodi: 'D3' },
      };
    } else if (isProdiD4) {
      whereClause.tugasAkhir = {
        mahasiswa: { prodi: 'D4' },
      };
    } else if (user.dosen) {
      // Pembimbing hanya lihat mahasiswa bimbingannya
      whereClause.tugasAkhir = {
        peranDosenTa: {
          some: {
            dosen_id: user.dosen.id,
            peran: { in: ['pembimbing1', 'pembimbing2'] },
          },
        },
      };
    }

    return this.prisma.pendaftaranSidang.findMany({
      where: whereClause,
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
        files: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
