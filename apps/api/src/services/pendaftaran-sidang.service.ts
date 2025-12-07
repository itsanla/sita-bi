import type { PendaftaranSidang, Prisma } from '@repo/db';
import { PrismaClient, TipeDokumenSidang } from '@repo/db';
import { getRelativePath } from '../utils/upload.config';

// Interface untuk Local file
interface LocalFile extends Express.Multer.File {
  path: string;
}

// Interface untuk return type getPendingRegistrations
interface PendingRegistration {
  id: number;
  tugas_akhir_id: number;
  status_verifikasi: string;
  status_pembimbing_1: string;
  status_pembimbing_2: string;
  catatan_pembimbing_1?: string | null;
  catatan_pembimbing_2?: string | null;
  created_at: Date;
  updated_at: Date;
  tugasAkhir: {
    id: number;
    judul: string;
    mahasiswa_id: number;
    status: string;
    mahasiswa: {
      id: number;
      nim: string;
      user: {
        id: number;
        name: string;
        email: string;
      };
    };
  };
}

export class PendaftaranSidangService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkEligibility(mahasiswaId: number): Promise<{
    isEligible: boolean;
    reason: string[];
    details: {
      tugasAkhirApproved: boolean;
      bimbinganCount: number;
      minBimbingan: number;
    };
  }> {
    const minBimbinganSetting = await this.prisma.pengaturanSistem.findUnique({
      where: { key: 'min_bimbingan_valid' },
    });
    const minBimbingan = minBimbinganSetting
      ? parseInt(minBimbinganSetting.value, 10)
      : 9;

    const tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
      include: {
        peranDosenTa: true,
      },
    });

    const reasons: string[] = [];
    let isEligible = true;

    if (tugasAkhir === null) {
      return {
        isEligible: false,
        reason: ['Tugas Akhir tidak ditemukan'],
        details: {
          tugasAkhirApproved: false,
          bimbinganCount: 0,
          minBimbingan,
        },
      };
    }

    if (tugasAkhir.status !== 'DISETUJUI') {
      isEligible = false;
      reasons.push(
        'Dokumen Tugas Akhir belum disetujui pembimbing (Status TA harus DISETUJUI)',
      );
    }

    const pembimbingIds = tugasAkhir.peranDosenTa
      .filter((p) => p.peran === 'pembimbing1' || p.peran === 'pembimbing2')
      .map((p) => p.dosen_id);

    const bimbinganCount = await this.prisma.bimbinganTA.count({
      where: {
        tugas_akhir_id: tugasAkhir.id,
        is_konfirmasi: true,
        dosen_id: { in: pembimbingIds },
      },
    });

    if (bimbinganCount < minBimbingan) {
      isEligible = false;
      reasons.push(
        `Bimbingan terkonfirmasi baru ${bimbinganCount}/${minBimbingan} sesi (Minimal ${minBimbingan})`,
      );
    }

    return {
      isEligible,
      reason: reasons,
      details: {
        tugasAkhirApproved: tugasAkhir.status === 'DISETUJUI',
        bimbinganCount,
        minBimbingan,
      },
    };
  }

  async registerForSidang(
    mahasiswaId: number,
    files:
      | Express.Multer.File[]
      | Record<string, Express.Multer.File[]>
      | undefined,
  ): Promise<PendaftaranSidang> {
    // Validate eligibility
    const eligibility = await this.checkEligibility(mahasiswaId);
    if (!eligibility.isEligible) {
      throw new Error(
        `Tidak memenuhi syarat sidang: ${eligibility.reason.join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      try {
        const tugasAkhir = await tx.tugasAkhir.findFirst({
          where: { mahasiswa_id: mahasiswaId, status: 'DISETUJUI' },
        });

        if (tugasAkhir === null) {
          throw new Error(
            'Active and approved final project not found for this student.',
          );
        }

        const existingRegistration = await tx.pendaftaranSidang.findFirst({
          where: {
            tugas_akhir_id: tugasAkhir.id,
            status_verifikasi: { in: ['menunggu_verifikasi', 'disetujui'] },
          },
        });

        if (existingRegistration !== null) {
          throw new Error(
            'A registration for this final project already exists or is being processed.',
          );
        }

        const pendaftaran = await tx.pendaftaranSidang.create({
          data: {
            tugas_akhir_id: tugasAkhir.id,
            status_verifikasi: 'menunggu_verifikasi',
            status_pembimbing_1: 'menunggu',
            status_pembimbing_2: 'menunggu',
          },
        });

        // Process uploaded files
        if (files && typeof files === 'object' && !Array.isArray(files)) {
          for (const fieldname in files) {
            const fileArray = files[fieldname];
            if (fileArray !== undefined) {
              for (const file of fileArray) {
                // The file object from multer has a 'path' property which is the local file path.
                const uploadedFilePath = (file as LocalFile).path;

                if (!uploadedFilePath) {
                  throw new Error(
                    `Failed to upload ${file.originalname} to local storage.`,
                  );
                }

                // Generate relative path untuk database
                const relativePath = getRelativePath(uploadedFilePath);

                // Create file record (tidak disimpan ke variable karena tidak digunakan)
                await tx.pendaftaranSidangFile.create({
                  data: {
                    pendaftaran_sidang_id: pendaftaran.id,
                    file_path: relativePath, // Save the relative path
                    original_name: file.originalname,
                    tipe_dokumen: this.mapFilenameToTipe(file.fieldname),
                  },
                });
              }
            }
          }
        }

        return pendaftaran;
      } catch (error) {
        console.error('Error in registerForSidang transaction:', error);
        throw error;
      }
    });
  }

  async getPendingRegistrations(
    dosenId: number,
  ): Promise<PendingRegistration[]> {
    return this.prisma.pendaftaranSidang.findMany({
      where: {
        OR: [
          {
            status_pembimbing_1: 'menunggu',
            tugasAkhir: {
              peranDosenTa: {
                some: { dosen_id: dosenId, peran: 'pembimbing1' },
              },
            },
          },
          {
            status_pembimbing_2: 'menunggu',
            tugasAkhir: {
              peranDosenTa: {
                some: { dosen_id: dosenId, peran: 'pembimbing2' },
              },
            },
          },
        ],
      },
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: { include: { user: true } },
          },
        },
      },
    }) as Promise<PendingRegistration[]>;
  }

  async approveRegistration(
    pendaftaranId: number,
    dosenId: number,
  ): Promise<PendaftaranSidang> {
    return this.prisma.$transaction(async (tx) => {
      const pendaftaran = await tx.pendaftaranSidang.findUnique({
        where: { id: pendaftaranId },
        include: { tugasAkhir: { include: { peranDosenTa: true } } },
      });

      if (pendaftaran === null) {
        throw new Error('Registration not found.');
      }

      const peran = pendaftaran.tugasAkhir.peranDosenTa.find(
        (p) => p.dosen_id === dosenId,
      );
      if (
        peran === undefined ||
        (peran.peran !== 'pembimbing1' && peran.peran !== 'pembimbing2')
      ) {
        throw new Error('You are not a supervisor for this registration.');
      }

      const updateData: Prisma.PendaftaranSidangUpdateInput = {};
      if (peran.peran === 'pembimbing1') {
        updateData.status_pembimbing_1 = 'disetujui';
      }
      if (peran.peran === 'pembimbing2') {
        updateData.status_pembimbing_2 = 'disetujui';
      }

      const updatedPendaftaran = await tx.pendaftaranSidang.update({
        where: { id: pendaftaranId },
        data: updateData,
      });

      // Check if both supervisors have approved
      if (
        updatedPendaftaran.status_pembimbing_1 === 'disetujui' &&
        updatedPendaftaran.status_pembimbing_2 === 'disetujui'
      ) {
        // Create a new Sidang record
        await tx.sidang.create({
          data: {
            pendaftaran_sidang_id: updatedPendaftaran.id,
            tugas_akhir_id: updatedPendaftaran.tugas_akhir_id,
            jenis_sidang: 'AKHIR',
            status_hasil: 'menunggu_penjadwalan', // Initial status for a newly created sidang
          },
        });

        // Update the main verification status
        return tx.pendaftaranSidang.update({
          where: { id: pendaftaranId },
          data: { status_verifikasi: 'disetujui' },
        });
      }

      return updatedPendaftaran;
    });
  }

  async rejectRegistration(
    pendaftaranId: number,
    dosenId: number,
    catatan: string,
  ): Promise<PendaftaranSidang> {
    return this.prisma.$transaction(async (tx) => {
      const pendaftaran = await tx.pendaftaranSidang.findUnique({
        where: { id: pendaftaranId },
        include: { tugasAkhir: { include: { peranDosenTa: true } } },
      });

      if (pendaftaran === null) {
        throw new Error('Registration not found.');
      }

      const peran = pendaftaran.tugasAkhir.peranDosenTa.find(
        (p) => p.dosen_id === dosenId,
      );
      if (
        peran === undefined ||
        (peran.peran !== 'pembimbing1' && peran.peran !== 'pembimbing2')
      ) {
        throw new Error('You are not a supervisor for this registration.');
      }

      const updateData: Prisma.PendaftaranSidangUpdateInput = {
        status_verifikasi: 'ditolak', // Update main status
      };

      if (peran.peran === 'pembimbing1') {
        updateData.status_pembimbing_1 = 'ditolak';
        updateData.catatan_pembimbing_1 = catatan;
      }
      if (peran.peran === 'pembimbing2') {
        updateData.status_pembimbing_2 = 'ditolak';
        updateData.catatan_pembimbing_2 = catatan;
      }

      return tx.pendaftaranSidang.update({
        where: { id: pendaftaranId },
        data: updateData,
      });
    });
  }

  async findMyRegistration(
    mahasiswaId: number,
  ): Promise<PendaftaranSidang | null> {
    const tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
      orderBy: { created_at: 'desc' },
    });

    if (tugasAkhir === null) {
      return null;
    }

    return this.prisma.pendaftaranSidang.findFirst({
      where: { tugas_akhir_id: tugasAkhir.id },
      orderBy: { created_at: 'desc' },
    });
  }

  private mapFilenameToTipe(fieldname: string): TipeDokumenSidang {
    switch (fieldname) {
      case 'file_ta':
        return TipeDokumenSidang.NASKAH_TA;
      case 'file_toeic':
        return TipeDokumenSidang.TOEIC;
      case 'file_rapor':
        return TipeDokumenSidang.RAPOR;
      case 'file_ijazah':
        return TipeDokumenSidang.IJAZAH_SLTA;
      case 'file_bebas_jurusan':
        return TipeDokumenSidang.BEBAS_JURUSAN;
      default:
        throw new Error(`Unknown file field name: ${fieldname}`);
    }
  }
}
