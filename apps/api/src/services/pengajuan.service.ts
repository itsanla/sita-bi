import { PrismaClient } from '@repo/db';
import { PengaturanService } from './pengaturan.service';
import { NotificationHelperService } from './notification-helper.service';

const JUDUL_DEFAULT = 'Judul Tugas Akhir (Belum Ditentukan)';
const STATUS_MENUNGGU_KONFIRMASI = 'MENUNGGU_KONFIRMASI';
const ERROR_PENGAJUAN_TIDAK_DITEMUKAN = 'Pengajuan tidak ditemukan';
const ERROR_PELEPASAN_TIDAK_DITEMUKAN = 'Pengajuan pelepasan tidak ditemukan';
const STATUS_MENUNGGU_PERSETUJUAN_DOSEN = 'MENUNGGU_PERSETUJUAN_DOSEN';
const STATUS_MENUNGGU_PERSETUJUAN_MAHASISWA = 'MENUNGGU_PERSETUJUAN_MAHASISWA';
const PERAN_PEMBIMBING = ['pembimbing1', 'pembimbing2'] as const;
type PeranDosen = typeof PERAN_PEMBIMBING[number];
const ERROR_PENGAJUAN_SUDAH_DIPROSES = 'Pengajuan sudah diproses';

export class PengajuanService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Method untuk mahasiswa mengajukan ke dosen
  async ajukanKeDosen(
    mahasiswaId: number,
    dosenId: number,
    peran: 'pembimbing1' | 'pembimbing2',
  ): Promise<unknown> {
    // Cek tugas akhir mahasiswa
    let tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
      include: { peranDosenTa: true },
    });

    // Buat tugas akhir jika belum ada
    tugasAkhir ??= await this.prisma.tugasAkhir.create({
      data: {
        mahasiswa_id: mahasiswaId,
        judul: JUDUL_DEFAULT,
        status: 'DRAFT',
      },
      include: { peranDosenTa: true },
    });

    // Cek apakah peran sudah terisi
    const existingPeran = tugasAkhir.peranDosenTa.find(
      (p) => p.peran === peran,
    );
    if (existingPeran) {
      throw new Error(`Anda sudah memiliki ${peran}`);
    }

    // Cek apakah sudah ada pengajuan aktif
    const existingPengajuan = await this.prisma.pengajuanBimbingan.findFirst({
      where: {
        mahasiswa_id: mahasiswaId,
        dosen_id: dosenId,
        peran_yang_diajukan: peran,
        status: {
          in: [
            STATUS_MENUNGGU_PERSETUJUAN_DOSEN,
            STATUS_MENUNGGU_PERSETUJUAN_MAHASISWA,
          ],
        },
      },
    });

    if (existingPengajuan) {
      throw new Error(`Pengajuan ke dosen ini untuk ${peran} sudah ada`);
    }

    // Hapus pengajuan lama yang sudah selesai (untuk handle kasus setelah pelepasan)
    await this.prisma.pengajuanBimbingan.deleteMany({
      where: {
        mahasiswa_id: mahasiswaId,
        dosen_id: dosenId,
        peran_yang_diajukan: peran,
        status: {
          notIn: [
            STATUS_MENUNGGU_PERSETUJUAN_DOSEN,
            STATUS_MENUNGGU_PERSETUJUAN_MAHASISWA,
          ],
        },
      },
    });

    // Cek jumlah pengajuan aktif untuk peran ini (maksimal 3)
    const activePengajuan = await this.prisma.pengajuanBimbingan.count({
      where: {
        mahasiswa_id: mahasiswaId,
        peran_yang_diajukan: peran,
        diinisiasi_oleh: 'mahasiswa',
        status: STATUS_MENUNGGU_PERSETUJUAN_DOSEN,
      },
    });

    if (activePengajuan >= 3) {
      throw new Error(`Anda sudah memiliki 3 pengajuan aktif untuk ${peran}`);
    }

    // Buat pengajuan baru
    const pengajuan = await this.prisma.pengajuanBimbingan.create({
      data: {
        mahasiswa_id: mahasiswaId,
        dosen_id: dosenId,
        peran_yang_diajukan: peran,
        diinisiasi_oleh: 'mahasiswa',
        status: STATUS_MENUNGGU_PERSETUJUAN_DOSEN,
      },
      include: {
        mahasiswa: { include: { user: true } },
        dosen: { include: { user: true } },
      },
    });

    // Kirim notifikasi WhatsApp ke dosen
    await NotificationHelperService.sendPengajuanPembimbingNotification(
      pengajuan.dosen.user.phone_number,
      pengajuan.mahasiswa.user.name,
      peran,
    );

    return pengajuan;
  }

  // Method untuk dosen menawarkan ke mahasiswa
  async tawariMahasiswa(
    dosenId: number,
    mahasiswaId: number,
    peran: 'pembimbing1' | 'pembimbing2',
  ): Promise<unknown> {
    // Cek kuota dosen dari pengaturan sistem
    const pengaturanService = new PengaturanService();
    const maxPembimbingAktif = await pengaturanService.getPengaturanByKey(
      'max_pembimbing_aktif',
    );
    const kuotaBimbingan =
      maxPembimbingAktif !== null ? parseInt(maxPembimbingAktif, 10) : 4;

    const jumlahBimbingan = await this.prisma.peranDosenTa.count({
      where: {
        dosen_id: dosenId,
        peran: { in: [...PERAN_PEMBIMBING] },
      },
    });

    if (jumlahBimbingan >= kuotaBimbingan) {
      throw new Error('Kuota bimbingan Anda sudah penuh');
    }

    // Cek tugas akhir mahasiswa
    let tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
      include: { peranDosenTa: true },
    });

    // Buat tugas akhir jika belum ada
    tugasAkhir ??= await this.prisma.tugasAkhir.create({
      data: {
        mahasiswa_id: mahasiswaId,
        judul: JUDUL_DEFAULT,
        status: 'DRAFT',
      },
      include: { peranDosenTa: true },
    });

    // Cek apakah peran sudah terisi
    const existingPeran = tugasAkhir.peranDosenTa.find(
      (p) => p.peran === peran,
    );
    if (existingPeran) {
      throw new Error(`Mahasiswa sudah memiliki ${peran}`);
    }

    // Hapus pengajuan lama jika ada (untuk handle kasus setelah pelepasan)
    await this.prisma.pengajuanBimbingan.deleteMany({
      where: {
        mahasiswa_id: mahasiswaId,
        dosen_id: dosenId,
        peran_yang_diajukan: peran,
      },
    });

    // Cek jumlah tawaran aktif dosen (maksimal 5)
    const activeTawaran = await this.prisma.pengajuanBimbingan.count({
      where: {
        dosen_id: dosenId,
        diinisiasi_oleh: 'dosen',
        status: STATUS_MENUNGGU_PERSETUJUAN_MAHASISWA,
      },
    });

    if (activeTawaran >= 5) {
      throw new Error('Anda sudah memiliki 5 tawaran aktif');
    }

    // Buat tawaran baru
    const tawaran = await this.prisma.pengajuanBimbingan.create({
      data: {
        mahasiswa_id: mahasiswaId,
        dosen_id: dosenId,
        peran_yang_diajukan: peran,
        diinisiasi_oleh: 'dosen',
        status: STATUS_MENUNGGU_PERSETUJUAN_MAHASISWA,
      },
      include: {
        mahasiswa: { include: { user: true } },
        dosen: { include: { user: true } },
      },
    });

    // Kirim notifikasi WhatsApp ke mahasiswa
    await NotificationHelperService.sendTawaranPembimbingNotification(
      tawaran.mahasiswa.user.phone_number,
      tawaran.dosen.user.name,
      peran,
    );

    return tawaran;
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

      if (!pengajuan) throw new Error(ERROR_PENGAJUAN_TIDAK_DITEMUKAN);

      // Validasi user yang berhak menerima
      const isValidUser =
        (pengajuan.diinisiasi_oleh === 'mahasiswa' &&
          pengajuan.dosen.user.id === userId) ||
        (pengajuan.diinisiasi_oleh === 'dosen' &&
          pengajuan.mahasiswa.user.id === userId);

      if (!isValidUser)
        throw new Error('Anda tidak berhak menerima pengajuan ini');

      if (
        ![
          STATUS_MENUNGGU_PERSETUJUAN_DOSEN,
          STATUS_MENUNGGU_PERSETUJUAN_MAHASISWA,
        ].includes(pengajuan.status)
      ) {
        throw new Error(ERROR_PENGAJUAN_SUDAH_DIPROSES);
      }

      // Cek kuota dosen dari pengaturan sistem
      const pengaturanService = new PengaturanService();
      const maxPembimbingAktif = await pengaturanService.getPengaturanByKey(
        'max_pembimbing_aktif',
      );
      const kuotaBimbingan =
        maxPembimbingAktif !== null ? parseInt(maxPembimbingAktif, 10) : 4;

      const jumlahBimbingan = await tx.peranDosenTa.count({
        where: {
          dosen_id: pengajuan.dosen_id,
          peran: { in: [...PERAN_PEMBIMBING] },
        },
      });

      if (jumlahBimbingan >= kuotaBimbingan) {
        throw new Error('Kuota bimbingan dosen sudah penuh');
      }

      // Cek tugas akhir
      let tugasAkhir = await tx.tugasAkhir.findFirst({
        where: { mahasiswa_id: pengajuan.mahasiswa_id },
        include: { peranDosenTa: true },
      });

      tugasAkhir ??= await tx.tugasAkhir.create({
        data: {
          mahasiswa_id: pengajuan.mahasiswa_id,
          judul: JUDUL_DEFAULT,
          status: 'DRAFT',
        },
        include: { peranDosenTa: true },
      });

      // Cek apakah peran sudah terisi
      const existingPeran = tugasAkhir.peranDosenTa.find(
        (p) => p.peran === pengajuan.peran_yang_diajukan,
      );
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
          peran: { in: [...PERAN_PEMBIMBING] },
        },
      });

      if (totalPembimbing === 2) {
        await tx.tugasAkhir.update({
          where: { id: tugasAkhir.id },
          data: { status: 'BIMBINGAN' },
        });

        // Auto-create sesi bimbingan sesuai pengaturan
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

      // Kirim notifikasi WhatsApp
      const isDosenAccepting = pengajuan.diinisiasi_oleh === 'mahasiswa';
      const recipientPhone = isDosenAccepting
        ? pengajuan.mahasiswa.user.phone_number
        : pengajuan.dosen.user.phone_number;
      const acceptorName = isDosenAccepting
        ? pengajuan.dosen.user.name
        : pengajuan.mahasiswa.user.name;

      await NotificationHelperService.sendPengajuanDisetujuiNotification(
        recipientPhone,
        acceptorName,
        pengajuan.peran_yang_diajukan as 'pembimbing1' | 'pembimbing2',
        isDosenAccepting,
      );

      // Batalkan pengajuan lain untuk peran yang sama
      await tx.pengajuanBimbingan.updateMany({
        where: {
          mahasiswa_id: pengajuan.mahasiswa_id,
          peran_yang_diajukan: pengajuan.peran_yang_diajukan,
          id: { not: pengajuanId },
          status: {
            in: [
              STATUS_MENUNGGU_PERSETUJUAN_DOSEN,
              STATUS_MENUNGGU_PERSETUJUAN_MAHASISWA,
            ],
          },
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

    if (!pengajuan) {
      throw new Error(ERROR_PENGAJUAN_TIDAK_DITEMUKAN);
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
        STATUS_MENUNGGU_PERSETUJUAN_DOSEN,
        STATUS_MENUNGGU_PERSETUJUAN_MAHASISWA,
      ].includes(pengajuan.status)
    ) {
      throw new Error(ERROR_PENGAJUAN_SUDAH_DIPROSES);
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

    // Kirim notifikasi WhatsApp
    const isDosenRejecting = pengajuan.diinisiasi_oleh === 'mahasiswa';
    const recipientPhone = isDosenRejecting
      ? pengajuan.mahasiswa.user.phone_number
      : pengajuan.dosen.user.phone_number;
    const rejectorName = isDosenRejecting
      ? pengajuan.dosen.user.name
      : pengajuan.mahasiswa.user.name;

    await NotificationHelperService.sendPengajuanDitolakNotification(
      recipientPhone,
      rejectorName,
      pengajuan.peran_yang_diajukan as 'pembimbing1' | 'pembimbing2',
      isDosenRejecting,
    );

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

    if (!pengajuan) {
      throw new Error(ERROR_PENGAJUAN_TIDAK_DITEMUKAN);
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
        STATUS_MENUNGGU_PERSETUJUAN_DOSEN,
        STATUS_MENUNGGU_PERSETUJUAN_MAHASISWA,
      ].includes(pengajuan.status)
    ) {
      throw new Error(ERROR_PENGAJUAN_SUDAH_DIPROSES);
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

    // Kirim notifikasi WhatsApp
    const isStudentCanceling = pengajuan.diinisiasi_oleh === 'mahasiswa';
    const recipientPhone = isStudentCanceling
      ? pengajuan.dosen.user.phone_number
      : pengajuan.mahasiswa.user.phone_number;
    const cancelerName = isStudentCanceling
      ? pengajuan.mahasiswa.user.name
      : pengajuan.dosen.user.name;

    await NotificationHelperService.sendPengajuanDibatalkanNotification(
      recipientPhone,
      cancelerName,
      pengajuan.peran_yang_diajukan as 'pembimbing1' | 'pembimbing2',
      isStudentCanceling,
    );

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

    // Get tugas akhir untuk mendapatkan pembimbing aktif dan pengajuan pelepasan
    const tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
      include: {
        peranDosenTa: {
          where: {
            peran: { in: [...PERAN_PEMBIMBING] },
          },
          include: {
            dosen: { include: { user: true } },
            pengajuanPelepasanBimbingan: {
              where: { status: STATUS_MENUNGGU_KONFIRMASI },
              include: {
                diajukanOleh: true,
              },
            },
          },
        },
      },
    });

    const pembimbingAktif = tugasAkhir?.peranDosenTa ?? [];
    const pelepasan = pembimbingAktif.flatMap(
      (p) => p.pengajuanPelepasanBimbingan,
    );

    return { pengajuan, pembimbingAktif, pelepasan };
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

    // Get mahasiswa bimbingan aktif
    const mahasiswaBimbingan = await this.prisma.peranDosenTa.findMany({
      where: {
        dosen_id: dosenId,
        peran: { in: [...PERAN_PEMBIMBING] },
      },
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: { include: { user: true } },
          },
        },
        pengajuanPelepasanBimbingan: {
          where: { status: STATUS_MENUNGGU_KONFIRMASI },
          include: {
            diajukanOleh: true,
          },
        },
      },
    });

    return { pengajuan, mahasiswaBimbingan };
  }

  // Method untuk mendapatkan list dosen tersedia
  async getAvailableDosen(): Promise<unknown> {
    const pengaturanService = new PengaturanService();
    const maxPembimbingAktif = await pengaturanService.getPengaturanByKey(
      'max_pembimbing_aktif',
    );
    const kuotaBimbingan =
      maxPembimbingAktif !== null ? parseInt(maxPembimbingAktif, 10) : 4;

    const dosenList = await this.prisma.dosen.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        peranDosenTa: {
          where: {
            peran: { in: [...PERAN_PEMBIMBING] },
          },
        },
      },
    });

    return dosenList.map((d) => {
      const jumlahBimbingan = d.peranDosenTa.length;
      const available = jumlahBimbingan < kuotaBimbingan;

      return {
        id: d.id,
        user: d.user,
        nip: d.nip,
        prodi: d.prodi,
        kuota_bimbingan: kuotaBimbingan,
        jumlah_bimbingan: jumlahBimbingan,
        available,
      };
    });
  }

  // Method untuk mendapatkan list mahasiswa tersedia (untuk dosen)
  async getAvailableMahasiswa(periodeId?: number): Promise<unknown> {
    interface WhereClause {
      tugasAkhir?: {
        periode_ta_id: number;
      };
    }

    const whereClause: WhereClause = {};
    if (periodeId !== undefined && periodeId > 0) {
      whereClause.tugasAkhir = {
        periode_ta_id: periodeId,
      };
    }

    const mahasiswaList = await this.prisma.mahasiswa.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        tugasAkhir: {
          where:
            periodeId !== undefined && periodeId > 0
              ? { periode_ta_id: periodeId }
              : {},
          include: {
            peranDosenTa: {
              where: {
                peran: { in: [...PERAN_PEMBIMBING] },
              },
            },
          },
        },
      },
    });

    return mahasiswaList.map((m) => {
      const tugasAkhir = m.tugasAkhir;
      const hasPembimbing1 = Boolean(
        tugasAkhir?.peranDosenTa.some((p) => p.peran === 'pembimbing1'),
      );
      const hasPembimbing2 = Boolean(
        tugasAkhir?.peranDosenTa.some((p) => p.peran === 'pembimbing2'),
      );

      return {
        id: m.id,
        user: m.user,
        nim: m.nim,
        prodi: m.prodi,
        kelas: m.kelas,
        ipk: m.ipk,
        judul_ta: tugasAkhir?.judul ?? 'Belum menentukan judul',
        has_pembimbing1: hasPembimbing1,
        has_pembimbing2: hasPembimbing2,
        available_for_p1: !hasPembimbing1,
        available_for_p2: !hasPembimbing2,
      };
    });
  }

  // Method untuk mengajukan pelepasan bimbingan
  async ajukanPelepasanBimbingan(
    peranDosenTaId: number,
    userId: number,
  ): Promise<unknown> {
    const peranDosen = await this.prisma.peranDosenTa.findUnique({
      where: { id: peranDosenTaId },
      include: {
        dosen: { include: { user: true } },
        tugasAkhir: { include: { mahasiswa: { include: { user: true } } } },
      },
    });

    if (!peranDosen) throw new Error('Pembimbing tidak ditemukan');

    // Validasi user yang mengajukan (mahasiswa atau dosen terkait)
    const isMahasiswa = peranDosen.tugasAkhir.mahasiswa.user_id === userId;
    const isDosen = peranDosen.dosen.user_id === userId;

    if (!isMahasiswa && !isDosen) {
      throw new Error('Anda tidak berhak mengajukan pelepasan bimbingan ini');
    }

    // Cek apakah sudah ada pengajuan pelepasan aktif
    const existingPengajuan =
      await this.prisma.pengajuanPelepasanBimbingan.findFirst({
        where: {
          peran_dosen_ta_id: peranDosenTaId,
          status: STATUS_MENUNGGU_KONFIRMASI,
        },
      });

    if (existingPengajuan) {
      throw new Error('Sudah ada pengajuan pelepasan yang menunggu konfirmasi');
    }

    // Buat pengajuan pelepasan
    const pengajuanPelepasan =
      await this.prisma.pengajuanPelepasanBimbingan.create({
        data: {
          peran_dosen_ta_id: peranDosenTaId,
          diajukan_oleh_user_id: userId,
          status: STATUS_MENUNGGU_KONFIRMASI,
        },
        include: {
          peranDosenTa: {
            include: {
              dosen: { include: { user: true } },
              tugasAkhir: {
                include: { mahasiswa: { include: { user: true } } },
              },
            },
          },
          diajukanOleh: true,
        },
      });

    // Kirim notifikasi WhatsApp
    const isDosenYangMengajukan = isDosen;
    const recipientPhone = isDosenYangMengajukan
      ? peranDosen.tugasAkhir.mahasiswa.user.phone_number
      : peranDosen.dosen.user.phone_number;
    const requesterName = isDosenYangMengajukan
      ? peranDosen.dosen.user.name
      : peranDosen.tugasAkhir.mahasiswa.user.name;

    await NotificationHelperService.sendPelepasanBimbinganNotification(
      recipientPhone,
      requesterName,
      peranDosen.peran as 'pembimbing1' | 'pembimbing2',
      isDosenYangMengajukan,
    );

    return pengajuanPelepasan;
  }

  // Method untuk konfirmasi pelepasan bimbingan
  async konfirmasiPelepasanBimbingan(
    pengajuanId: number,
    userId: number,
  ): Promise<unknown> {
    return this.prisma.$transaction(async (tx) => {
      const pengajuan = await tx.pengajuanPelepasanBimbingan.findUnique({
        where: { id: pengajuanId },
        include: {
          peranDosenTa: {
            include: {
              dosen: { include: { user: true } },
              tugasAkhir: {
                include: { mahasiswa: { include: { user: true } } },
              },
            },
          },
          diajukanOleh: true,
        },
      });

      if (!pengajuan) throw new Error(ERROR_PELEPASAN_TIDAK_DITEMUKAN);
      if (pengajuan.status !== STATUS_MENUNGGU_KONFIRMASI) {
        throw new Error(ERROR_PENGAJUAN_SUDAH_DIPROSES);
      }

      // Validasi user yang mengkonfirmasi (harus pihak yang tidak mengajukan)
      const isMahasiswa =
        pengajuan.peranDosenTa.tugasAkhir.mahasiswa.user_id === userId;
      const isDosen = pengajuan.peranDosenTa.dosen.user_id === userId;

      if (!isMahasiswa && !isDosen) {
        throw new Error('Anda tidak berhak mengkonfirmasi pelepasan ini');
      }

      if (pengajuan.diajukan_oleh_user_id === userId) {
        throw new Error(
          'Anda tidak bisa mengkonfirmasi pengajuan Anda sendiri',
        );
      }

      // Update status pengajuan
      await tx.pengajuanPelepasanBimbingan.update({
        where: { id: pengajuanId },
        data: { status: 'DISETUJUI' },
      });

      // Hapus pengajuan bimbingan yang terkait
      await tx.pengajuanBimbingan.deleteMany({
        where: {
          mahasiswa_id: pengajuan.peranDosenTa.tugas_akhir_id,
          dosen_id: pengajuan.peranDosenTa.dosen_id,
          peran_yang_diajukan: pengajuan.peranDosenTa.peran,
        },
      });

      // Reset data bimbingan terkait dosen ini
      const tugasAkhirId = pengajuan.peranDosenTa.tugas_akhir_id;
      const dosenId = pengajuan.peranDosenTa.dosen_id;

      // Hapus semua bimbingan dengan dosen ini
      await tx.bimbinganTA.deleteMany({
        where: {
          tugas_akhir_id: tugasAkhirId,
          dosen_id: dosenId,
        },
      });

      // Reset validasi judul jika dosen adalah pembimbing yang memvalidasi
      const updateData: {
        judul_divalidasi_p1?: boolean;
        judul_divalidasi_p2?: boolean;
      } = {};
      if (pengajuan.peranDosenTa.peran === 'pembimbing1') {
        updateData.judul_divalidasi_p1 = false;
      } else if (pengajuan.peranDosenTa.peran === 'pembimbing2') {
        updateData.judul_divalidasi_p2 = false;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.tugasAkhir.update({
          where: { id: tugasAkhirId },
          data: updateData,
        });
      }

      // Reset validasi dokumen TA
      if (pengajuan.peranDosenTa.peran === 'pembimbing1') {
        await tx.dokumenTa.updateMany({
          where: {
            tugas_akhir_id: tugasAkhirId,
            divalidasi_oleh_p1: dosenId,
          },
          data: { divalidasi_oleh_p1: null },
        });
      } else if (pengajuan.peranDosenTa.peran === 'pembimbing2') {
        await tx.dokumenTa.updateMany({
          where: {
            tugas_akhir_id: tugasAkhirId,
            divalidasi_oleh_p2: dosenId,
          },
          data: { divalidasi_oleh_p2: null },
        });
      }

      // Hapus peran dosen
      await tx.peranDosenTa.delete({
        where: { id: pengajuan.peran_dosen_ta_id },
      });

      // Update status TA jika perlu
      const remainingPembimbing = await tx.peranDosenTa.count({
        where: {
          tugas_akhir_id: pengajuan.peranDosenTa.tugas_akhir_id,
          peran: { in: [...PERAN_PEMBIMBING] },
        },
      });

      if (remainingPembimbing < 2) {
        await tx.tugasAkhir.update({
          where: { id: pengajuan.peranDosenTa.tugas_akhir_id },
          data: { status: 'DRAFT' },
        });
      }

      // Kirim notifikasi WhatsApp untuk konfirmasi pelepasan
      const isDosenYangKonfirmasi = isDosen;
      const recipientPhone = isDosenYangKonfirmasi
        ? pengajuan.peranDosenTa.tugasAkhir.mahasiswa.user.phone_number
        : pengajuan.peranDosenTa.dosen.user.phone_number;
      const confirmerName = isDosenYangKonfirmasi
        ? pengajuan.peranDosenTa.dosen.user.name
        : pengajuan.peranDosenTa.tugasAkhir.mahasiswa.user.name;

      await NotificationHelperService.sendPelepasanDikonfirmasiNotification(
        recipientPhone,
        confirmerName,
        pengajuan.peranDosenTa.peran as 'pembimbing1' | 'pembimbing2',
      );

      return pengajuan;
    });
  }

  // Method untuk menolak pelepasan bimbingan
  async tolakPelepasanBimbingan(
    pengajuanId: number,
    userId: number,
  ): Promise<unknown> {
    const pengajuan = await this.prisma.pengajuanPelepasanBimbingan.findUnique({
      where: { id: pengajuanId },
      include: {
        peranDosenTa: {
          include: {
            dosen: { include: { user: true } },
            tugasAkhir: { include: { mahasiswa: { include: { user: true } } } },
          },
        },
      },
    });

    if (!pengajuan) throw new Error(ERROR_PELEPASAN_TIDAK_DITEMUKAN);
    if (pengajuan.status !== STATUS_MENUNGGU_KONFIRMASI) {
      throw new Error(ERROR_PENGAJUAN_SUDAH_DIPROSES);
    }

    // Validasi user yang menolak
    const isMahasiswa =
      pengajuan.peranDosenTa.tugasAkhir.mahasiswa.user_id === userId;
    const isDosen = pengajuan.peranDosenTa.dosen.user_id === userId;

    if (!isMahasiswa && !isDosen) {
      throw new Error('Anda tidak berhak menolak pelepasan ini');
    }

    if (pengajuan.diajukan_oleh_user_id === userId) {
      throw new Error('Anda tidak bisa menolak pengajuan Anda sendiri');
    }

    const updatedPengajuan =
      await this.prisma.pengajuanPelepasanBimbingan.update({
        where: { id: pengajuanId },
        data: { status: 'DITOLAK' },
        include: {
          peranDosenTa: {
            include: {
              dosen: { include: { user: true } },
              tugasAkhir: {
                include: { mahasiswa: { include: { user: true } } },
              },
            },
          },
        },
      });

    // Kirim notifikasi WhatsApp untuk penolakan pelepasan
    const isDosenYangMenolak = isDosen;
    const recipientPhone = isDosenYangMenolak
      ? pengajuan.peranDosenTa.tugasAkhir.mahasiswa.user.phone_number
      : pengajuan.peranDosenTa.dosen.user.phone_number;
    const rejectorName = isDosenYangMenolak
      ? pengajuan.peranDosenTa.dosen.user.name
      : pengajuan.peranDosenTa.tugasAkhir.mahasiswa.user.name;

    await NotificationHelperService.sendPelepasanDitolakNotification(
      recipientPhone,
      rejectorName,
      pengajuan.peranDosenTa.peran as 'pembimbing1' | 'pembimbing2',
    );

    return updatedPengajuan;
  }

  // Method untuk membatalkan pelepasan bimbingan (oleh yang mengajukan)
  async batalkanPelepasanBimbingan(
    pengajuanId: number,
    userId: number,
  ): Promise<unknown> {
    const pengajuan = await this.prisma.pengajuanPelepasanBimbingan.findUnique({
      where: { id: pengajuanId },
      include: {
        peranDosenTa: {
          include: {
            dosen: { include: { user: true } },
            tugasAkhir: { include: { mahasiswa: { include: { user: true } } } },
          },
        },
      },
    });

    if (!pengajuan) throw new Error(ERROR_PELEPASAN_TIDAK_DITEMUKAN);
    if (pengajuan.status !== STATUS_MENUNGGU_KONFIRMASI) {
      throw new Error(ERROR_PENGAJUAN_SUDAH_DIPROSES);
    }

    // Validasi user yang membatalkan (harus yang mengajukan)
    if (pengajuan.diajukan_oleh_user_id !== userId) {
      throw new Error('Anda tidak berhak membatalkan pengajuan ini');
    }

    return this.prisma.pengajuanPelepasanBimbingan.update({
      where: { id: pengajuanId },
      data: { status: 'DITOLAK' },
      include: {
        peranDosenTa: {
          include: {
            dosen: { include: { user: true } },
            tugasAkhir: { include: { mahasiswa: { include: { user: true } } } },
          },
        },
      },
    });
  }
}
