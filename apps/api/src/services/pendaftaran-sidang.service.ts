import { getPrismaClient } from '../config/database';
import type { PendaftaranSidang } from '../prisma-client';
;
import { getRelativePath } from '../utils/upload.config';
import { PengaturanService } from './pengaturan.service';

export class PendaftaranSidangService {
  private prisma: ReturnType<typeof getPrismaClient>;
  private pengaturanService: PengaturanService;

  constructor() {
    this.prisma = getPrismaClient();
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

    if (
      existingRegistration &&
      existingRegistration.status_validasi !== 'rejected'
    ) {
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

  async getRegistrationHistory(mahasiswaId: number): Promise<any[]> {
    const history = await this.prisma.pendaftaranSidangHistory.findMany({
      where: { mahasiswa_id: mahasiswaId },
      orderBy: { created_at: 'desc' },
    });

    const historyWithUsers = await Promise.all(
      history.map(async (item) => {
        let validatorInfo = null;
        if (item.validated_by) {
          const validator = await this.prisma.user.findUnique({
            where: { id: item.validated_by },
            include: { roles: true },
          });
          if (validator) {
            validatorInfo = {
              name: validator.name,
              roles: validator.roles.map((r) => r.name),
            };
          }
        }
        return { ...item, validator: validatorInfo };
      }),
    );

    return historyWithUsers;
  }

  async getAllRegistrationHistory(userId: number): Promise<any[]> {
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

    let mahasiswaIds: number[] = [];

    if (isJurusan) {
      const allMahasiswa = await this.prisma.mahasiswa.findMany({
        select: { id: true },
      });
      mahasiswaIds = allMahasiswa.map((m) => m.id);
    } else if (isProdiD3) {
      const mahasiswa = await this.prisma.mahasiswa.findMany({
        where: { prodi: 'D3' },
        select: { id: true },
      });
      mahasiswaIds = mahasiswa.map((m) => m.id);
    } else if (isProdiD4) {
      const mahasiswa = await this.prisma.mahasiswa.findMany({
        where: { prodi: 'D4' },
        select: { id: true },
      });
      mahasiswaIds = mahasiswa.map((m) => m.id);
    } else if (user.dosen) {
      const tugasAkhir = await this.prisma.tugasAkhir.findMany({
        where: {
          peranDosenTa: {
            some: {
              dosen_id: user.dosen.id,
              peran: { in: ['pembimbing1', 'pembimbing2'] },
            },
          },
        },
        select: { mahasiswa_id: true },
      });
      mahasiswaIds = tugasAkhir.map((ta) => ta.mahasiswa_id);
    }

    if (mahasiswaIds.length === 0) {
      return [];
    }

    const history = await this.prisma.pendaftaranSidangHistory.findMany({
      where: { mahasiswa_id: { in: mahasiswaIds } },
      orderBy: { created_at: 'desc' },
    });

    const historyWithDetails = await Promise.all(
      history.map(async (item) => {
        const mahasiswa = await this.prisma.mahasiswa.findUnique({
          where: { id: item.mahasiswa_id },
          include: { user: { select: { name: true } } },
        });

        let validatorInfo = null;
        if (item.validated_by) {
          const validator = await this.prisma.user.findUnique({
            where: { id: item.validated_by },
            include: { roles: true },
          });
          if (validator) {
            validatorInfo = {
              name: validator.name,
              roles: validator.roles.map((r) => r.name),
            };
          }
        }

        return {
          ...item,
          mahasiswa: mahasiswa
            ? {
                name: mahasiswa.user.name,
                nim: mahasiswa.nim,
                prodi: mahasiswa.prodi,
              }
            : null,
          validator: validatorInfo,
        };
      }),
    );

    return historyWithDetails;
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

    const newStatus = validasiAktif === 'false' ? 'approved' : 'pending';

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

    const updated = await this.prisma.pendaftaranSidang.update({
      where: { id: pendaftaran.id },
      data: {
        is_submitted: true,
        status_validasi: newStatus,
      },
    });

    await this.prisma.pendaftaranSidangHistory.create({
      data: {
        pendaftaran_sidang_id: pendaftaran.id,
        mahasiswa_id: mahasiswaId,
        action: 'submit',
        status_before: pendaftaran.status_validasi,
        status_after: newStatus,
      },
    });

    return updated;
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
    const validasiPembimbing1 = (pengaturan.validasi_pembimbing_1 as any) === true;
    const validasiPembimbing2 = (pengaturan.validasi_pembimbing_2 as any) === true;
    const validasiProdi = (pengaturan.validasi_prodi as any) === true;
    const validasiJurusan = (pengaturan.validasi_jurusan as any) === true;

    console.log('=== VALIDATION DEBUG ===');
    console.log('Pengaturan:', {
      validasi_pembimbing_1: pengaturan.validasi_pembimbing_1,
      validasi_pembimbing_2: pengaturan.validasi_pembimbing_2,
      validasi_prodi: pengaturan.validasi_prodi,
      validasi_jurusan: pengaturan.validasi_jurusan,
    });
    console.log('Parsed:', {
      validasiPembimbing1,
      validasiPembimbing2,
      validasiProdi,
      validasiJurusan,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, dosen: true },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const userRoles = user.roles.map((r) => r.name);
    console.log('User roles:', userRoles);
    console.log('User dosen:', user.dosen);

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

    console.log('User checks:', {
      isPembimbing1,
      isPembimbing2,
      mahasiswaProdi,
      isProdiD3,
      isProdiD4,
      isProdi,
      isJurusan,
    });

    const updateData: any = {
      validated_at: new Date(),
      validated_by: userId,
    };

    if (action === 'reject') {
      updateData.status_validasi = 'rejected';
      updateData.rejected_by = userId;
      updateData.rejection_reason = catatan || 'Tidak ada alasan';
      await this.prisma.mahasiswa.update({
        where: { id: pendaftaran.tugasAkhir.mahasiswa_id },
        data: { siap_sidang: false },
      });
    } else {
      let hasAccess = false;

      console.log('Checking access...');

      if (validasiPembimbing1 && isPembimbing1) {
        console.log('✓ Access granted: Pembimbing 1');
        updateData.divalidasi_pembimbing_1 = true;
        hasAccess = true;
      }

      if (validasiPembimbing2 && isPembimbing2) {
        console.log('✓ Access granted: Pembimbing 2');
        updateData.divalidasi_pembimbing_2 = true;
        hasAccess = true;
      }

      if (validasiProdi && isProdi) {
        console.log('✓ Access granted: Prodi');
        if (!isProdiD3 && !isProdiD4) {
          throw new Error(
            'Anda hanya bisa memvalidasi mahasiswa dari prodi yang sama',
          );
        }
        updateData.divalidasi_prodi = true;
        hasAccess = true;
      }

      if (validasiJurusan && isJurusan) {
        console.log('✓ Access granted: Jurusan');
        updateData.divalidasi_jurusan = true;
        hasAccess = true;
      }

      console.log('Final hasAccess:', hasAccess);

      if (!hasAccess) {
        console.log('✗ Access DENIED');
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

    const updated = await this.prisma.pendaftaranSidang.update({
      where: { id: pendaftaranId },
      data: updateData,
    });

    const validatorRoles = [];
    if (isJurusan) validatorRoles.push('jurusan');
    if (isProdiD3) validatorRoles.push('prodi_d3');
    if (isProdiD4) validatorRoles.push('prodi_d4');
    if (isPembimbing1) validatorRoles.push('pembimbing1');
    if (isPembimbing2) validatorRoles.push('pembimbing2');
    const validatorRole = validatorRoles.join(',');

    await this.prisma.pendaftaranSidangHistory.create({
      data: {
        pendaftaran_sidang_id: pendaftaranId,
        mahasiswa_id: pendaftaran.tugasAkhir.mahasiswa_id,
        action: action === 'approve' ? 'approve' : 'reject',
        status_before: pendaftaran.status_validasi,
        status_after: updateData.status_validasi || pendaftaran.status_validasi,
        validated_by: userId,
        validator_role: validatorRole || null,
        rejection_reason: action === 'reject' ? catatan : null,
      },
    });

    return updated;
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

    const whereClause: any = {
      is_submitted: true,
      status_validasi: { in: ['pending', 'approved'] },
    };

    if (!isJurusan && isProdiD3) {
      whereClause.tugasAkhir = {
        mahasiswa: { prodi: 'D3' },
      };
    } else if (!isJurusan && isProdiD4) {
      whereClause.tugasAkhir = {
        mahasiswa: { prodi: 'D4' },
      };
    } else if (!isJurusan && !isProdiD3 && !isProdiD4 && user.dosen) {
      whereClause.tugasAkhir = {
        peranDosenTa: {
          some: {
            dosen_id: user.dosen.id,
            peran: { in: ['pembimbing1', 'pembimbing2'] },
          },
        },
      };
    }

    const list = await this.prisma.pendaftaranSidang.findMany({
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

    const listWithValidator = await Promise.all(
      list.map(async (item) => {
        let validatorInfo = null;
        if (item.validated_by) {
          const validator = await this.prisma.user.findUnique({
            where: { id: item.validated_by },
            include: { roles: true },
          });
          if (validator) {
            validatorInfo = {
              name: validator.name,
              roles: validator.roles.map((r) => r.name),
            };
          }
        }
        return { ...item, validator: validatorInfo };
      }),
    );

    return listWithValidator as any;
  }

  async cancelValidation(
    pendaftaranId: number,
    userId: number,
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

    if (pendaftaran.status_validasi !== 'approved') {
      throw new Error(
        'Hanya bisa membatalkan pendaftaran yang sudah disetujui',
      );
    }

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

    const isPembimbing1 =
      user.dosen &&
      pendaftaran.tugasAkhir.peranDosenTa.some(
        (p) => p.peran === 'pembimbing1' && p.dosen.user_id === userId,
      );
    const isPembimbing2 =
      user.dosen &&
      pendaftaran.tugasAkhir.peranDosenTa.some(
        (p) => p.peran === 'pembimbing2' && p.dosen.user_id === userId,
      );

    const updateData: any = {
      status_validasi: 'pending',
    };

    let hasCancelled = false;

    if (isJurusan && pendaftaran.divalidasi_jurusan) {
      updateData.divalidasi_jurusan = false;
      hasCancelled = true;
    }

    if ((isProdiD3 || isProdiD4) && pendaftaran.divalidasi_prodi) {
      updateData.divalidasi_prodi = false;
      hasCancelled = true;
    }

    if (isPembimbing1 && pendaftaran.divalidasi_pembimbing_1) {
      updateData.divalidasi_pembimbing_1 = false;
      hasCancelled = true;
    }

    if (isPembimbing2 && pendaftaran.divalidasi_pembimbing_2) {
      updateData.divalidasi_pembimbing_2 = false;
      hasCancelled = true;
    }

    if (!hasCancelled) {
      throw new Error('Anda belum memvalidasi pendaftaran ini');
    }

    await this.prisma.mahasiswa.update({
      where: { id: pendaftaran.tugasAkhir.mahasiswa_id },
      data: { siap_sidang: false },
    });

    return this.prisma.pendaftaranSidang.update({
      where: { id: pendaftaranId },
      data: updateData,
    });
  }
}
