import type { PengaturanJadwal, TimeSlot } from './types';

export class SlotGeneratorService {
  private isHariLibur(tanggal: Date, pengaturan: PengaturanJadwal): boolean {
    const hariMap = [
      'minggu',
      'senin',
      'selasa',
      'rabu',
      'kamis',
      'jumat',
      'sabtu',
    ];
    const hari = hariMap[tanggal.getDay()];

    if (pengaturan.hari_libur_tetap.includes(hari)) return true;

    const tanggalStr = tanggal.toISOString().split('T')[0];
    return pengaturan.tanggal_libur_khusus.some(
      (l) => l.tanggal === tanggalStr,
    );
  }

  generateTimeSlots(
    tanggal: Date,
    pengaturan: PengaturanJadwal,
    ruanganIds: number[],
  ): TimeSlot[] {
    if (this.isHariLibur(tanggal, pengaturan)) return [];

    const slots: TimeSlot[] = [];
    const hariMap = [
      'minggu',
      'senin',
      'selasa',
      'rabu',
      'kamis',
      'jumat',
      'sabtu',
    ];
    const hariIni = hariMap[tanggal.getDay()];

    const jadwalKhusus = (pengaturan.jadwal_hari_khusus ?? []).find(
      (j) => j.hari === hariIni,
    );

    let jamMulaiSidang = pengaturan.jam_mulai_sidang;
    let jamSelesaiSidang = pengaturan.jam_selesai_sidang;
    let durasiSidangMenit = pengaturan.durasi_sidang_menit;
    let jedaSidangMenit = pengaturan.jeda_sidang_menit;
    let waktuIstirahatList = pengaturan.waktu_istirahat ?? [];

    if (jadwalKhusus) {
      jamMulaiSidang = jadwalKhusus.jam_mulai;
      jamSelesaiSidang = jadwalKhusus.jam_selesai;
      durasiSidangMenit =
        jadwalKhusus.durasi_sidang_menit ?? pengaturan.durasi_sidang_menit;
      jedaSidangMenit =
        jadwalKhusus.jeda_sidang_menit ?? pengaturan.jeda_sidang_menit;
      waktuIstirahatList = jadwalKhusus.waktu_istirahat ?? [];
    }

    const jamMulaiParts = jamMulaiSidang.split(':').map(Number);
    const jamSelesaiParts = jamSelesaiSidang.split(':').map(Number);
    const jamMulai = jamMulaiParts[0] ?? 0;
    const menitMulai = jamMulaiParts[1] ?? 0;
    const jamSelesai = jamSelesaiParts[0] ?? 0;
    const menitSelesai = jamSelesaiParts[1] ?? 0;

    const startMinutes = jamMulai * 60 + menitMulai;
    const endMinutes = jamSelesai * 60 + menitSelesai;
    const durasiTotal = durasiSidangMenit + jedaSidangMenit;

    const waktuIstirahatMap = new Map<number, number>();
    waktuIstirahatList.forEach((istirahat) => {
      const waktuParts = istirahat.waktu.split(':').map(Number);
      const jam = waktuParts[0] ?? 0;
      const menit = waktuParts[1] ?? 0;
      const waktuMenit = jam * 60 + menit;
      waktuIstirahatMap.set(waktuMenit, istirahat.durasi_menit);
    });

    for (const ruanganId of ruanganIds) {
      let currentMinutes = startMinutes;
      while (currentMinutes + durasiSidangMenit <= endMinutes) {
        const waktuMulai = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
        const waktuSelesaiMenit = currentMinutes + durasiSidangMenit;
        const waktuSelesai = `${String(Math.floor(waktuSelesaiMenit / 60)).padStart(2, '0')}:${String(waktuSelesaiMenit % 60).padStart(2, '0')}`;

        slots.push({
          tanggal,
          waktu_mulai: waktuMulai,
          waktu_selesai: waktuSelesai,
          ruangan_id: ruanganId,
        });

        if (waktuIstirahatMap.has(waktuSelesaiMenit)) {
          const durasiIstirahat = waktuIstirahatMap.get(waktuSelesaiMenit);
          if (durasiIstirahat !== undefined) {
            currentMinutes = waktuSelesaiMenit + durasiIstirahat;
          }
        } else {
          currentMinutes += durasiTotal;
        }
      }
    }

    return slots;
  }
}
