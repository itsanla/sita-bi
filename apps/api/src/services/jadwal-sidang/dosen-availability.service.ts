import prisma from '../../config/database';
import type { PengaturanJadwal, TimeSlot } from './types';

export class DosenAvailabilityService {
  async getDosenAvailable(
    slot: TimeSlot,
    excludeDosenIds: number[],
    pengaturan: PengaturanJadwal,
    allowSoftBusy = false,
  ): Promise<number[]> {
    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });

    const [jamMulai = 0, menitMulai = 0] = slot.waktu_mulai.split(':').map(Number);
    const [jamSelesai = 0, menitSelesai = 0] = slot.waktu_selesai.split(':').map(Number);
    const slotStart = jamMulai * 60 + menitMulai;
    const slotEnd = jamSelesai * 60 + menitSelesai;
    const jedaMinutes = pengaturan.jeda_sidang_menit;

    const dosenBusy = await prisma.jadwalSidang.findMany({
      where: { tanggal: slot.tanggal },
      include: {
        sidang: {
          include: {
            tugasAkhir: {
              include: { peranDosenTa: true },
            },
          },
        },
      },
    });

    const busyDosenIds = new Set<number>();
    const softBusyDosenIds = new Set<number>();

    dosenBusy.forEach((jadwal) => {
      const [jMulai = 0, mMulai = 0] = jadwal.waktu_mulai.split(':').map(Number);
      const [jSelesai = 0, mSelesai = 0] = jadwal.waktu_selesai.split(':').map(Number);
      const existingStart = jMulai * 60 + mMulai;
      const existingEnd = jSelesai * 60 + mSelesai;

      const hasExactOverlap =
        (slotStart >= existingStart && slotStart < existingEnd) ||
        (slotEnd > existingStart && slotEnd <= existingEnd) ||
        (slotStart <= existingStart && slotEnd >= existingEnd);

      const hasSoftOverlap =
        (slotStart >= existingStart - jedaMinutes && slotStart < existingEnd + jedaMinutes) ||
        (slotEnd > existingStart - jedaMinutes && slotEnd <= existingEnd + jedaMinutes) ||
        (slotStart <= existingStart && slotEnd >= existingEnd);

      jadwal.sidang.tugasAkhir.peranDosenTa.forEach((peran) => {
        if (['penguji1', 'penguji2', 'penguji3', 'pembimbing1'].includes(peran.peran)) {
          if (hasExactOverlap) {
            busyDosenIds.add(peran.dosen_id);
          } else if (hasSoftOverlap) {
            softBusyDosenIds.add(peran.dosen_id);
          }
        }
      });
    });

    const dosenLoadRaw = await prisma.peranDosenTa.findMany({
      where: {
        peran: { in: ['penguji1', 'penguji2', 'penguji3'] },
        tugasAkhir: {
          periode_ta_id: periodeAktif?.id,
          sidang: { some: { status_hasil: 'dijadwalkan' } },
        },
      },
      select: { dosen_id: true },
    });

    const dosenLoadMap = new Map<number, number>();
    dosenLoadRaw.forEach((peran) => {
      const current = dosenLoadMap.get(peran.dosen_id) ?? 0;
      dosenLoadMap.set(peran.dosen_id, current + 1);
    });

    const fullQuotaDosenIds = new Set<number>();
    dosenLoadMap.forEach((count, dosenId) => {
      if (count >= pengaturan.max_mahasiswa_uji_per_dosen) {
        fullQuotaDosenIds.add(dosenId);
      }
    });

    const allDosen = await prisma.dosen.findMany({ select: { id: true } });

    const availableDosen = allDosen
      .map((d) => d.id)
      .filter(
        (id) =>
          !excludeDosenIds.includes(id) &&
          !busyDosenIds.has(id) &&
          !fullQuotaDosenIds.has(id) &&
          (allowSoftBusy || !softBusyDosenIds.has(id)),
      );

    return availableDosen.sort((a, b) => {
      return (dosenLoadMap.get(a) ?? 0) - (dosenLoadMap.get(b) ?? 0);
    });
  }
}
