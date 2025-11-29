import { PrismaClient } from '@repo/db';
// import { PenugasanService } from './penugasan.service'; // Unused

export class PengajuanService {
  private prisma: PrismaClient;
  // private penugasanService: PenugasanService; // Unused

  constructor() {
    this.prisma = new PrismaClient();
    // this.penugasanService = new PenugasanService(); // Unused
  }

  // Method untuk mahasiswa mengajukan ke dosen
  async ajukanKeDosen(mahasiswaId: number, dosenId: number, peran: 'pembimbing1' | 'pembimbing2'): Promise<unknown> {
    // Cek tugas akhir mahasiswa
    let tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
      include: { peranDosenTa: true },
    });

    // Buat tugas akhir jika belum ada
    if (!tugasAkhir) {
      tugasAkhir = await this.prisma.tugasAkhir.create({
        data: {
          mahasiswa_id: mahasiswaId,
          judul: 'Judul Tugas Akhir (Belum Ditentukan)',
          status: 'DRAFT',
        },
        include: { peranDosenTa: true },
      });
    }

    // Cek apakah peran sudah terisi
    const existingPeran = tugasAkhir.peranDosenTa.find(p => p.peran === peran);
    if (existingPeran) {
      throw new Error(`Anda sudah memiliki ${peran}`);
    }

    // Cek apakah sudah mengajukan ke dosen ini untuk peran ini
    const existingPengajuan = await this.prisma.pengajuanBimbingan.findFirst({
      where: {
        mahasiswa_id: mahasiswaId,
        dosen_id: dosenId,
        peran_yang_diajukan: peran,
        status: { in: ['MENUNGGU_PERSETUJUAN_DOSEN', 'MENUNGGU_PERSETUJUAN_MAHASISWA'] },
      },
    });

    if (existingPengajuan) {
      throw new Error(`Pengajuan ke dosen ini untuk ${peran} sudah ada`);
    }

    // Cek jumlah pengajuan aktif untuk peran ini (maksimal 3)
    const activePengajuan = await this.prisma.pengajuanBimbingan.count({
      where: {
        mahasiswa_id: mahasiswaId,
        peran_yang_diajukan: peran,
        diinisiasi_oleh: 'mahasiswa',
        status: 'MENUNGGU_PERSETUJUAN_DOSEN',
      },
    });

    if (activePengajuan >= 3) {
      throw new Error(`Anda sudah memiliki 3 pengajuan aktif untuk ${peran}`);
    }

    // Buat pengajuan baru
    return this.prisma.pengajuanBimbingan.create({
      data: {
        mahasiswa_id: mahasiswaId,
        dosen_id: dosenId,
        peran_yang_diajukan: peran,
        diinisiasi_oleh: 'mahasiswa',
        status: 'MENUNGGU_PERSETUJUAN_DOSEN',
      },
      include: {
        mahasiswa: { include: { user: true } },
        dosen: { include: { user: true } },
      },
    });
  }

  // Method untuk dosen menawarkan ke mahasiswa
  async tawariMahasiswa(
    dosenId: number,
    mahasiswaId: number,
    peran: 'pembimbing1' | 'pembimbing2',
  ): Promise<unknown> {
    // Cek kuota dosen
    const dosen = await this.prisma.dosen.findUnique({ where: { id: dosenId } });
    if (!dosen) throw new Error('Dosen tidak ditemukan');

    const jumlahBimbingan = await this.prisma.peranDosenTa.count({
      where: {
        dosen_id: dosenId,
        peran: { in: ['pembimbing1', 'pembimbing2'] },
      },
    });

    if (jumlahBimbingan >= dosen.kuota_bimbingan) {
      throw new Error('Kuota bimbingan Anda sudah penuh');
    }

    // Cek tugas akhir mahasiswa
    let tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
      include: { peranDosenTa: true },
    });

    // Buat tugas akhir jika belum ada
    if (!tugasAkhir) {
      tugasAkhir = await this.prisma.tugasAkhir.create({
        data: {
          mahasiswa_id: mahasiswaId,
          judul: 'Judul Tugas Akhir (Belum Ditentukan)',
          status: 'DRAFT',
        },
        include: { peranDosenTa: true },
      });
    }

    // Cek apakah peran sudah terisi
    const existingPeran = tugasAkhir.peranDosenTa.find(p => p.peran === peran);
    if (existingPeran) {
      throw new Error(`Mahasiswa sudah memiliki ${peran}`);
    }

    // Cek apakah sudah ada pengajuan
    const existingPengajuan = await this.prisma.pengajuanBimbingan.findFirst({
      where: {
        mahasiswa_id: mahasiswaId,
        dosen_id: dosenId,
        peran_yang_diajukan: peran,
        status: { in: ['MENUNGGU_PERSETUJUAN_DOSEN', 'MENUNGGU_PERSETUJUAN_MAHASISWA'] },
      },
    });

    if (existingPengajuan) {
      throw new Error(`Pengajuan dengan mahasiswa ini untuk ${peran} sudah ada`);
    }

    // Cek jumlah tawaran aktif dosen (maksimal 5)
    const activeTawaran = await this.prisma.pengajuanBimbingan.count({
      where: {
        dosen_id: dosenId,
        diinisiasi_oleh: 'dosen',
        status: 'MENUNGGU_PERSETUJUAN_MAHASISWA',
      },
    });

    if (activeTawaran >= 5) {
      throw new Error('Anda sudah memiliki 5 tawaran aktif');
    }

    // Buat tawaran baru
    return this.prisma.pengajuanBimbingan.create({
      data: {
        mahasiswa_id: mahasiswaId,
        dosen_id: dosenId,
        peran_yang_diajukan: peran,
        diinisiasi_oleh: 'dosen',
        status: 'MENUNGGU_PERSETUJUAN_MAHASISWA',
      },
      include: {
        mahasiswa: { include: { user: true } },
        dosen: { include: { user: true } },
      },
    });
  }

  // Method untuk menerima pengajuan
  async terimaPengajuan(pengajuanId: number, userId: number): Promise<unknown> {
    return this.prisma.$transaction(async (tx) => {
      const pengajuan = await tx.pengajuanBimbingan.findUnique({
        where: { id: pengajuanId },
        include: {
          mahasiswa: { include: { user: true } },
          dosen: { include: { user: true } },
        },
      });

      if (!pengajuan) throw new Error('Pengajuan tidak ditemukan');

      // Validasi user yang berhak menerima
      const isValidUser =
        (pengajuan.diinisiasi_oleh === 'mahasiswa' && pengajuan.dosen.user.id === userId) ||
        (pengajuan.diinisiasi_oleh === 'dosen' && pengajuan.mahasiswa.user.id === userId);

      if (!isValidUser) throw new Error('Anda tidak berhak menerima pengajuan ini');

      if (!['MENUNGGU_PERSETUJUAN_DOSEN', 'MENUNGGU_PERSETUJUAN_MAHASISWA'].includes(pengajuan.status)) {
        throw new Error('Pengajuan ini sudah diproses');
      }

      // Cek kuota dosen
      const jumlahBimbingan = await tx.peranDosenTa.count({
        where: {
          dosen_id: pengajuan.dosen_id,
          peran: { in: ['pembimbing1', 'pembimbing2'] },
        },
      });

      const dosen = await tx.dosen.findUnique({ where: { id: pengajuan.dosen_id } });
      if (jumlahBimbingan >= (dosen?.kuota_bimbingan || 4)) {
        throw new Error('Kuota bimbingan dosen sudah penuh');
      }

      // Cek tugas akhir
      let tugasAkhir = await tx.tugasAkhir.findFirst({
        where: { mahasiswa_id: pengajuan.mahasiswa_id },
        include: { peranDosenTa: true },
      });

      if (!tugasAkhir) {
        tugasAkhir = await tx.tugasAkhir.create({
          data: {
            mahasiswa_id: pengajuan.mahasiswa_id,
            judul: 'Judul Tugas Akhir (Belum Ditentukan)',
            status: 'DRAFT',
          },
          include: { peranDosenTa: true },
        });
      }

      // Cek apakah peran sudah terisi
      const existingPeran = tugasAkhir.peranDosenTa.find(p => p.peran === pengajuan.peran_yang_diajukan);
      if (existingPeran) {
        throw new Error(`${pengajuan.peran_yang_diajukan} sudah terisi`);
      }

      // Assign dosen
      await tx.peranDosenTa.create({
        data: {
          tugas_akhir_id: tugasAkhir.id,
          dosen_id: pengajuan.dosen_id,
          peran: pengajuan.peran_yang_diajukan as any,
        },
      });

      // Update status TA jika sudah lengkap 2 pembimbing
      const totalPembimbing = await tx.peranDosenTa.count({
        where: {
          tugas_akhir_id: tugasAkhir.id,
          peran: { in: ['pembimbing1', 'pembimbing2'] },
        },
      });

      if (totalPembimbing === 2) {
        await tx.tugasAkhir.update({
          where: { id: tugasAkhir.id },
          data: { status: 'BIMBINGAN' },
        });

        // Auto-create 9 sesi bimbingan
        try {
          const { BimbinganService } = await import('./bimbingan.service');
          const bimbinganService = new BimbinganService();
          await bimbinganService.initializeEmptySessions(tugasAkhir.id);
        } catch (error) {
          console.error('Failed to initialize empty sessions:', error);
        }
      }

      // Update status pengajuan
      const updatedPengajuan = await tx.pengajuanBimbingan.update({
        where: { id: pengajuanId },
        data: { status: 'DISETUJUI' },
        include: {
          mahasiswa: { include: { user: true } },
          dosen: { include: { user: true } },
        },
      });

      // Batalkan pengajuan lain untuk peran yang sama
      await tx.pengajuanBimbingan.updateMany({
        where: {
          mahasiswa_id: pengajuan.mahasiswa_id,
          peran_yang_diajukan: pengajuan.peran_yang_diajukan,
          id: { not: pengajuanId },
          status: { in: ['MENUNGGU_PERSETUJUAN_DOSEN', 'MENUNGGU_PERSETUJUAN_MAHASISWA'] },
        },
        data: { status: 'DIBATALKAN_MAHASISWA' },
      });

      return updatedPengajuan;
    });
  }

  // Method untuk menolak pengajuan
  async tolakPengajuan(pengajuanId: number, userId: number): Promise<unknown> {
    // Cari pengajuan
    const pengajuan = await this.prisma.pengajuanBimbingan.findUnique({
      where: { id: pengajuanId },
      include: {
        mahasiswa: { include: { user: true } },
        dosen: { include: { user: true } },
      },
    });

    if (pengajuan === null) {
      throw new Error('Pengajuan tidak ditemukan');
    }

    // Validasi user yang berhak menolak
    const isValidUser =
      (pengajuan.diinisiasi_oleh === 'mahasiswa' &&
        pengajuan.dosen.user.id === userId) ||
      (pengajuan.diinisiasi_oleh === 'dosen' &&
        pengajuan.mahasiswa.user.id === userId);

    if (!isValidUser) {
      throw new Error('Anda tidak berhak menolak pengajuan ini');
    }

    // Cek status pengajuan
    if (
      ![
        'MENUNGGU_PERSETUJUAN_DOSEN',
        'MENUNGGU_PERSETUJUAN_MAHASISWA',
      ].includes(pengajuan.status)
    ) {
      throw new Error('Pengajuan ini sudah diproses');
    }

    // Update status menjadi ditolak
    const updatedPengajuan = await this.prisma.pengajuanBimbingan.update({
      where: { id: pengajuanId },
      data: { status: 'DITOLAK' },
      include: {
        mahasiswa: { include: { user: true } },
        dosen: { include: { user: true } },
      },
    });

    return updatedPengajuan;
  }

  // Method untuk membatalkan pengajuan
  async batalkanPengajuan(
    pengajuanId: number,
    userId: number,
  ): Promise<unknown> {
    // Cari pengajuan
    const pengajuan = await this.prisma.pengajuanBimbingan.findUnique({
      where: { id: pengajuanId },
      include: {
        mahasiswa: { include: { user: true } },
        dosen: { include: { user: true } },
      },
    });

    if (pengajuan === null) {
      throw new Error('Pengajuan tidak ditemukan');
    }

    // Validasi user yang berhak membatalkan (hanya yang menginisiasi)
    const isValidUser =
      (pengajuan.diinisiasi_oleh === 'mahasiswa' &&
        pengajuan.mahasiswa.user.id === userId) ||
      (pengajuan.diinisiasi_oleh === 'dosen' &&
        pengajuan.dosen.user.id === userId);

    if (!isValidUser) {
      throw new Error('Anda tidak berhak membatalkan pengajuan ini');
    }

    // Cek status pengajuan
    if (
      ![
        'MENUNGGU_PERSETUJUAN_DOSEN',
        'MENUNGGU_PERSETUJUAN_MAHASISWA',
      ].includes(pengajuan.status)
    ) {
      throw new Error('Pengajuan ini sudah diproses');
    }

    // Update status menjadi dibatalkan
    const updatedPengajuan = await this.prisma.pengajuanBimbingan.update({
      where: { id: pengajuanId },
      data: { status: 'DIBATALKAN_MAHASISWA' }, // Gunakan status yang ada di enum
      include: {
        mahasiswa: { include: { user: true } },
        dosen: { include: { user: true } },
      },
    });

    return updatedPengajuan;
  }

  // Method untuk mendapatkan pengajuan mahasiswa
  async getPengajuanMahasiswa(mahasiswaId: number): Promise<unknown> {
    const pengajuan = await this.prisma.pengajuanBimbingan.findMany({
      where: { mahasiswa_id: mahasiswaId },
      include: {
        dosen: { include: { user: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return pengajuan;
  }

  // Method untuk mendapatkan pengajuan dosen
  async getPengajuanDosen(dosenId: number): Promise<unknown> {
    const pengajuan = await this.prisma.pengajuanBimbingan.findMany({
      where: { dosen_id: dosenId },
      include: {
        mahasiswa: { include: { user: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return pengajuan;
  }

  // Method untuk mendapatkan list dosen tersedia
  async getAvailableDosen(): Promise<unknown> {
    const dosenList = await this.prisma.dosen.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        peranDosenTa: {
          where: {
            peran: { in: ['pembimbing1', 'pembimbing2'] },
          },
        },
      },
    });

    return dosenList.map((d) => {
      const jumlahBimbingan = d.peranDosenTa.length;
      const available = jumlahBimbingan < d.kuota_bimbingan;

      return {
        id: d.id,
        user: d.user,
        nip: d.nip,
        prodi: d.prodi,
        kuota_bimbingan: d.kuota_bimbingan,
        jumlah_bimbingan: jumlahBimbingan,
        available,
      };
    });
  }

  // Method untuk mendapatkan list mahasiswa tersedia (untuk dosen)
  async getAvailableMahasiswa(): Promise<unknown> {
    const mahasiswaList = await this.prisma.mahasiswa.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        tugasAkhir: {
          include: {
            peranDosenTa: {
              where: {
                peran: { in: ['pembimbing1', 'pembimbing2'] },
              },
            },
          },
        },
      },
    });

    return mahasiswaList.map((m) => {
      const tugasAkhir = m.tugasAkhir;
      const hasPembimbing1 = tugasAkhir?.peranDosenTa.some(p => p.peran === 'pembimbing1') || false;
      const hasPembimbing2 = tugasAkhir?.peranDosenTa.some(p => p.peran === 'pembimbing2') || false;

      return {
        id: m.id,
        user: m.user,
        nim: m.nim,
        prodi: m.prodi,
        kelas: m.kelas,
        has_pembimbing1: hasPembimbing1,
        has_pembimbing2: hasPembimbing2,
        available_for_p1: !hasPembimbing1,
        available_for_p2: !hasPembimbing2,
      };
    });
  }
}
