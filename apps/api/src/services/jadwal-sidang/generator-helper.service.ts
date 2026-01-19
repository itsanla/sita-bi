import prisma from '../../config/database';
import { HasilSidang, PeranDosen } from '@prisma/client';
import type { TimeSlot } from './types';

export class GeneratorHelperService {
  async prepareMahasiswaSiap(mahasiswaSiapData: any[]): Promise<any[]> {
    const mahasiswaSiap: any[] = [];
    for (const mhs of mahasiswaSiapData) {
      if (!mhs.tugasAkhir) continue;

      let sidang = mhs.tugasAkhir.sidang[0];
      if (!sidang || sidang.status_hasil !== HasilSidang.menunggu_penjadwalan) {
        sidang = await prisma.sidang.create({
          data: {
            tugas_akhir_id: mhs.tugasAkhir.id,
            jenis_sidang: 'AKHIR',
            status_hasil: HasilSidang.menunggu_penjadwalan,
            is_active: true,
          },
        });
      }

      mahasiswaSiap.push({
        id: sidang.id,
        tugas_akhir_id: sidang.tugas_akhir_id,
        tugasAkhir: {
          id: mhs.tugasAkhir.id,
          mahasiswa: mhs,
          peranDosenTa: mhs.tugasAkhir.peranDosenTa,
        },
      });
    }
    return mahasiswaSiap;
  }

  async validatePembimbingLoad(
    mahasiswaSiap: any[],
    maxPembimbingAktif: number,
  ): Promise<void> {
    const pembimbingCount = new Map<number, number>();

    mahasiswaSiap.forEach((sidang) => {
      sidang.tugasAkhir.peranDosenTa.forEach((peran: any) => {
        if (peran.peran === 'pembimbing1') {
          const count = pembimbingCount.get(peran.dosen_id) ?? 0;
          pembimbingCount.set(peran.dosen_id, count + 1);
        }
      });
    });

    const overloadPembimbing: string[] = [];
    for (const dosenId of Array.from(pembimbingCount.keys())) {
      const count = pembimbingCount.get(dosenId) ?? 0;
      if (count > maxPembimbingAktif) {
        const dosen = await prisma.dosen.findUnique({
          where: { id: dosenId },
          include: { user: true },
        });
        overloadPembimbing.push(
          `${dosen?.user.name} (${count} mahasiswa, max: ${maxPembimbingAktif})`,
        );
      }
    }

    if (overloadPembimbing.length > 0) {
      throw new Error(
        JSON.stringify({
          status: 'PEMBIMBING_OVERLOAD',
          masalah: `Ada ${overloadPembimbing.length} dosen yang membimbing melebihi batas maksimal.`,
          detail: overloadPembimbing,
          saran: `Kurangi jumlah mahasiswa yang dibimbing oleh dosen tersebut, atau naikkan "Maksimal Pembimbing Aktif" di menu Aturan Umum.`,
        }),
      );
    }
  }

  async createJadwalTransaction(
    sidang: any,
    slot: TimeSlot,
    pengujiIds: number[],
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      await tx.peranDosenTa.deleteMany({
        where: {
          tugas_akhir_id: sidang.tugas_akhir_id,
          peran: {
            in: [PeranDosen.penguji1, PeranDosen.penguji2, PeranDosen.penguji3],
          },
        },
      });

      const periodeAktif = await tx.periodeTa.findFirst({
        where: { status: 'AKTIF' },
      });

      const jadwal = await tx.jadwalSidang.create({
        data: {
          sidang_id: sidang.id,
          periode_ta_id: periodeAktif?.id,
          tanggal: slot.tanggal,
          waktu_mulai: slot.waktu_mulai,
          waktu_selesai: slot.waktu_selesai,
          ruangan_id: slot.ruangan_id,
        },
        include: { ruangan: true },
      });

      await tx.peranDosenTa.createMany({
        data: [
          {
            tugas_akhir_id: sidang.tugas_akhir_id,
            dosen_id: pengujiIds[0],
            peran: PeranDosen.penguji1,
          },
          {
            tugas_akhir_id: sidang.tugas_akhir_id,
            dosen_id: pengujiIds[1],
            peran: PeranDosen.penguji2,
          },
          {
            tugas_akhir_id: sidang.tugas_akhir_id,
            dosen_id: pengujiIds[2],
            peran: PeranDosen.penguji3,
          },
        ],
      });

      await tx.sidang.update({
        where: { id: sidang.id },
        data: { status_hasil: HasilSidang.dijadwalkan },
      });
      await tx.mahasiswa.update({
        where: { id: sidang.tugasAkhir.mahasiswa.id },
        data: { sidang_terjadwal: true },
      });

      const [anggota1, anggota2, sekretaris] = await Promise.all([
        tx.dosen.findUnique({
          where: { id: pengujiIds[0] },
          include: { user: true },
        }),
        tx.dosen.findUnique({
          where: { id: pengujiIds[1] },
          include: { user: true },
        }),
        tx.dosen.findUnique({
          where: { id: pengujiIds[2] },
          include: { user: true },
        }),
      ]);

      return { anggota1, anggota2, sekretaris, jadwal };
    });
  }

  formatResult(sidang: any, pengujiData: any, slot: TimeSlot): any {
    const pembimbing1 = sidang.tugasAkhir.peranDosenTa.find(
      (p: any) => p.peran === 'pembimbing1',
    );
    const hariMap = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];
    const hari = hariMap[slot.tanggal.getDay()];
    const tanggalStr = slot.tanggal.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return {
      mahasiswa: sidang.tugasAkhir.mahasiswa.user.name,
      nim: sidang.tugasAkhir.mahasiswa.nim,
      ketua: pembimbing1?.dosen?.user?.name ?? '-',
      sekretaris: pengujiData.sekretaris?.user.name ?? '-',
      anggota1: pengujiData.anggota1?.user.name ?? '-',
      anggota2: pengujiData.anggota2?.user.name ?? '-',
      hari_tanggal: `${hari}, ${tanggalStr}`,
      pukul: `${slot.waktu_mulai} - ${slot.waktu_selesai}`,
      ruangan: pengujiData.jadwal.ruangan.nama_ruangan,
    };
  }

  async finalizeScheduling(): Promise<void> {
    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });
    if (periodeAktif) {
      await prisma.mahasiswa.updateMany({
        where: {
          tugasAkhir: { periode_ta_id: periodeAktif.id },
          sidang_terjadwal: false,
          gagal_sidang: false,
        },
        data: { gagal_sidang: true, periode_gagal_id: periodeAktif.id },
      });
    }

    try {
      const penjadwalan = await prisma.penjadwalanSidang.findFirst({
        where: {
          OR: [{ status: 'DIJADWALKAN' }, { status: 'BELUM_DIJADWALKAN' }],
        },
        orderBy: { created_at: 'desc' },
      });

      if (penjadwalan) {
        await prisma.penjadwalanSidang.update({
          where: { id: penjadwalan.id },
          data: { status: 'SELESAI', tanggal_generate: new Date() },
        });
      } else {
        await prisma.penjadwalanSidang.create({
          data: {
            status: 'SELESAI',
            tanggal_generate: new Date(),
            dibuat_oleh: 1,
          },
        });
      }
    } catch {
      // Ignore error
    }
  }
}
