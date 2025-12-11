/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import prisma from '../../config/database';
import { HasilSidang, PeranDosen } from '@prisma/client';
import { PERAN_PENGUJI } from './types';

export class CrudService {
  async getMahasiswaGagalSidang(): Promise<{
    nama: string;
    nim: string;
    prodi: string;
    kelas: string;
    status: string;
    alasan: string;
  }[]> {
    const periodeAktif = await prisma.periodeTa.findFirst({ where: { status: 'AKTIF' } });

    const mahasiswa = await prisma.mahasiswa.findMany({
      where: { gagal_sidang: true, periode_gagal_id: periodeAktif?.id },
      include: {
        user: true,
        tugasAkhir: { include: { pendaftaranSidang: { orderBy: { created_at: 'desc' }, take: 1 } } },
      },
    });

    return mahasiswa.map((m) => {
      const pendaftaran = m.tugasAkhir?.pendaftaranSidang[0];
      let status = 'Belum Daftar';
      let alasan = 'Mahasiswa belum mendaftar sidang';

      // Cek jika status gagal adalah KHUSUS (dihapus dari jadwal)
      if (m.status_gagal === 'KHUSUS') {
        status = 'Khusus';
        alasan = m.alasan_gagal || 'Dihapus dari jadwal';
      } else if (pendaftaran?.rejected_by) {
        status = 'Ditolak';
        alasan = pendaftaran.rejection_reason ?? 'Tidak ada alasan';
      } else if (Boolean(pendaftaran?.is_submitted) && pendaftaran.status_validasi === 'pending') {
        status = 'Menunggu Validasi';
        alasan = 'Pendaftaran masih menunggu validasi';
      }

      return { nama: m.user.name, nim: m.nim, prodi: m.prodi, kelas: m.kelas, status, alasan };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private determineStatus(m: any, pendaftaran: any): { status_display: string; validator_info: string; rejection_reason: string } {
    let status_display = 'belum_daftar';
    let validator_info = '';
    let rejection_reason = '';

    if (Boolean(m.siap_sidang) && !m.sidang_terjadwal) {
      status_display = 'siap_sidang';
    } else if (pendaftaran?.rejected_by) {
      status_display = 'ditolak';
      rejection_reason = pendaftaran.rejection_reason ?? '';
    } else if (Boolean(pendaftaran?.is_submitted) && pendaftaran.status_validasi === 'pending') {
      status_display = 'menunggu_validasi';
      const validators = [];
      if (!pendaftaran.divalidasi_pembimbing_1) validators.push('P1');
      if (!pendaftaran.divalidasi_pembimbing_2) validators.push('P2');
      if (!pendaftaran.divalidasi_prodi) validators.push('Prodi');
      if (!pendaftaran.divalidasi_jurusan) validators.push('Jurusan');
      validator_info = validators.length > 0 ? `Menunggu: ${validators.join(', ')}` : '';
    }

    return { status_display, validator_info, rejection_reason };
  }

  async getMahasiswaSiapSidang(): Promise<{
    id: number;
    status_hasil: string;
    status_display: string;
    validator_info: string;
    rejection_reason: string;
    tugasAkhir: unknown;
  }[]> {
    const periodeAktif = await prisma.periodeTa.findFirst({ where: { status: 'AKTIF' } });

    const mahasiswa = await prisma.mahasiswa.findMany({
      where: {
        sidang_terjadwal: false,
        OR: [
          { gagal_sidang: false },
          ...(periodeAktif?.id !== undefined ? [{ periode_gagal_id: { not: periodeAktif.id } }] : []),
        ],
      },
      include: {
        user: true,
        tugasAkhir: {
          include: {
            peranDosenTa: {
              where: { peran: { in: [PeranDosen.pembimbing1, PeranDosen.pembimbing2] } },
              include: { dosen: { include: { user: true } } },
            },
            sidang: { where: { is_active: true } },
            pendaftaranSidang: { orderBy: { created_at: 'desc' }, take: 1 },
          },
        },
      },
    });

    return mahasiswa
      .filter((m) => m.tugasAkhir !== null)
      .map((m) => {
        const tugasAkhir = m.tugasAkhir;
        if (!tugasAkhir) throw new Error('TugasAkhir tidak ditemukan');
        
        const pendaftaran = tugasAkhir.pendaftaranSidang[0];
        const sidangAktif = tugasAkhir.sidang.find((s) => s.is_active);

        const { status_display, validator_info, rejection_reason } = this.determineStatus(m, pendaftaran);

        return {
          id: sidangAktif?.id ?? 0,
          status_hasil: sidangAktif?.status_hasil ?? 'belum_ada_sidang',
          status_display,
          validator_info,
          rejection_reason,
          tugasAkhir: { ...tugasAkhir, mahasiswa: m },
        };
      });
  }

  async getJadwalSidang(): Promise<unknown[]> {
    const periodeAktif = await prisma.periodeTa.findFirst({ where: { status: 'AKTIF' } });

    const jadwal = await prisma.jadwalSidang.findMany({
      where: { periode_ta_id: periodeAktif?.id },
      include: {
        ruangan: true,
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                mahasiswa: { include: { user: true } },
                peranDosenTa: {
                  where: { peran: { in: [PeranDosen.penguji1, PeranDosen.penguji2, PeranDosen.penguji3, PeranDosen.pembimbing1] } },
                  include: { dosen: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
    });

    return [...jadwal].sort((a, b) => {
      const dateA = new Date(a.tanggal);
      dateA.setUTCHours(0, 0, 0, 0);
      const dateB = new Date(b.tanggal);
      dateB.setUTCHours(0, 0, 0, 0);

      const timeA = dateA.getTime();
      const timeB = dateB.getTime();
      if (timeA !== timeB) return timeA - timeB;

      const [hA = 0, mA = 0] = a.waktu_mulai.split(':').map(Number);
      const [hB = 0, mB = 0] = b.waktu_mulai.split(':').map(Number);
      return hA * 60 + mA - (hB * 60 + mB);
    });
  }

  async deleteAllJadwal(): Promise<{ count: number }> {
    const periodeAktif = await prisma.periodeTa.findFirst({ where: { status: 'AKTIF' } });

    // Reset status penjadwalan untuk periode aktif
    if (periodeAktif) {
      await prisma.penjadwalanSidang.updateMany({
        where: { 
          periode_ta_id: periodeAktif.id,
          status: 'SELESAI'
        },
        data: { 
          status: 'BELUM_DIJADWALKAN' as any,
          tanggal_generate: null 
        },
      });
    }

    return await prisma.$transaction(async (tx) => {
      const jadwalToDelete = await tx.jadwalSidang.findMany({
        where: { periode_ta_id: periodeAktif?.id },
        include: { sidang: true },
      });

      const sidangIds = jadwalToDelete.map((j) => j.sidang_id);
      const tugasAkhirIds = jadwalToDelete.map((j) => j.sidang.tugas_akhir_id);

      await tx.peranDosenTa.deleteMany({
        where: { tugas_akhir_id: { in: tugasAkhirIds }, peran: { in: [...PERAN_PENGUJI] } },
      });

      await tx.sidang.updateMany({
        where: { id: { in: sidangIds } },
        data: { status_hasil: HasilSidang.menunggu_penjadwalan },
      });

      await tx.mahasiswa.updateMany({
        where: { tugasAkhir: { id: { in: tugasAkhirIds } } },
        data: { sidang_terjadwal: false },
      });

      return await tx.jadwalSidang.deleteMany({ where: { periode_ta_id: periodeAktif?.id } });
    });
  }

  async deleteJadwal(id: number, alasan?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const jadwal = await tx.jadwalSidang.findUnique({
        where: { id },
        include: { sidang: { include: { tugasAkhir: { include: { mahasiswa: true } } } } },
      });
      if (!jadwal) throw new Error('Jadwal tidak ditemukan');

      const periodeAktif = await tx.periodeTa.findFirst({ where: { status: 'AKTIF' } });

      await tx.peranDosenTa.deleteMany({
        where: { tugas_akhir_id: jadwal.sidang.tugas_akhir_id, peran: { in: [...PERAN_PENGUJI] } },
      });

      await tx.sidang.update({
        where: { id: jadwal.sidang_id },
        data: { status_hasil: HasilSidang.menunggu_penjadwalan },
      });

      // Set mahasiswa gagal sidang dengan status KHUSUS
      await tx.mahasiswa.update({
        where: { id: jadwal.sidang.tugasAkhir.mahasiswa.id },
        data: {
          sidang_terjadwal: false,
          gagal_sidang: true,
          periode_gagal_id: periodeAktif?.id,
          alasan_gagal: alasan || 'Dihapus dari jadwal',
          status_gagal: 'KHUSUS',
        },
      });

      await tx.jadwalSidang.delete({ where: { id } });
    });
  }

  async getEditOptions(): Promise<{
    mahasiswa: { id: number; name: string; nim: string }[];
    dosen: { id: number; name: string }[];
    ruangan: { id: number; name: string }[];
  }> {
    const [mahasiswa, dosen, ruangan] = await Promise.all([
      prisma.mahasiswa.findMany({ where: { siap_sidang: true }, include: { user: true } }),
      prisma.dosen.findMany({ include: { user: true } }),
      prisma.ruangan.findMany(),
    ]);

    return {
      mahasiswa: mahasiswa.map((m) => ({ id: m.id, name: m.user.name, nim: m.nim })),
      dosen: dosen.map((d) => ({ id: d.id, name: d.user.name })),
      ruangan: ruangan.map((r) => ({ id: r.id, name: r.nama_ruangan })),
    };
  }

  async moveSchedule(fromDate: string, toDate: string): Promise<{ count: number }> {
    const dateFrom = new Date(fromDate);
    dateFrom.setUTCHours(0, 0, 0, 0);
    const dateTo = new Date(toDate);
    dateTo.setUTCHours(0, 0, 0, 0);

    const daysDiff = Math.floor((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 0) {
      const error = new Error('Tanggal tujuan harus lebih besar dari tanggal asal') as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    const jadwalToMove = await prisma.jadwalSidang.findMany({ where: { tanggal: { gte: dateFrom } } });

    if (jadwalToMove.length === 0) {
      const error = new Error('Tidak ada jadwal yang ditemukan dari tanggal tersebut') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      for (const jadwal of jadwalToMove) {
        const oldDate = new Date(jadwal.tanggal);
        oldDate.setUTCHours(0, 0, 0, 0);
        const daysFromStart = Math.floor((oldDate.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));

        const newDate = new Date(dateTo);
        newDate.setDate(newDate.getDate() + daysFromStart);
        newDate.setUTCHours(0, 0, 0, 0);

        await tx.jadwalSidang.update({ where: { id: jadwal.id }, data: { tanggal: newDate } });
      }
    });

    return { count: jadwalToMove.length };
  }

  async swapSchedule(jadwal1Id: number, jadwal2Id: number): Promise<{ jadwal1Id: number; jadwal2Id: number }> {
    return await prisma.$transaction(async (tx) => {
      const [jadwal1, jadwal2] = await Promise.all([
        tx.jadwalSidang.findUnique({ where: { id: jadwal1Id } }),
        tx.jadwalSidang.findUnique({ where: { id: jadwal2Id } }),
      ]);

      if (!jadwal1 || !jadwal2) {
        const error = new Error('Jadwal tidak ditemukan') as Error & { statusCode: number };
        error.statusCode = 404;
        throw error;
      }

      const temp = {
        tanggal: jadwal1.tanggal,
        waktu_mulai: jadwal1.waktu_mulai,
        waktu_selesai: jadwal1.waktu_selesai,
        ruangan_id: jadwal1.ruangan_id,
      };

      await tx.jadwalSidang.update({
        where: { id: jadwal1Id },
        data: {
          tanggal: jadwal2.tanggal,
          waktu_mulai: jadwal2.waktu_mulai,
          waktu_selesai: jadwal2.waktu_selesai,
          ruangan_id: jadwal2.ruangan_id,
        },
      });

      await tx.jadwalSidang.update({
        where: { id: jadwal2Id },
        data: {
          tanggal: temp.tanggal,
          waktu_mulai: temp.waktu_mulai,
          waktu_selesai: temp.waktu_selesai,
          ruangan_id: temp.ruangan_id,
        },
      });

      return { jadwal1Id, jadwal2Id };
    });
  }
}
