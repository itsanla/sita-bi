import prisma from '../config/database';
import { HasilSidang, PeranDosen } from '@prisma/client';

interface PengaturanJadwal {
  max_mahasiswa_uji_per_dosen: number;
  durasi_sidang_menit: number;
  jeda_sidang_menit: number;
  jam_mulai_sidang: string;
  jam_selesai_sidang: string;
  hari_libur_tetap: string[];
  tanggal_libur_khusus: { tanggal: string; keterangan: string }[];
  ruangan_sidang: string[];
  waktu_istirahat?: { waktu: string; durasi_menit: number }[];
  jadwal_hari_khusus?: { hari: string; jam_mulai: string; jam_selesai: string; durasi_sidang_menit?: number; jeda_sidang_menit?: number; waktu_istirahat?: { waktu: string; durasi_menit: number }[] }[];
}

interface TimeSlot {
  tanggal: Date;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan_id: number;
}

export class JadwalSidangService {
  private async getPengaturan(): Promise<PengaturanJadwal> {
    console.log('[BACKEND] 📋 Getting pengaturan...');
    const settings = await prisma.pengaturanSistem.findMany();
    console.log('[BACKEND] 📊 Settings count:', settings.length);
    
    const config: any = {};
    settings.forEach((s) => {
      try {
        config[s.key] = JSON.parse(s.value);
      } catch {
        config[s.key] = s.value;
      }
    });

    let ruanganSidang = config.ruangan_sidang || [];
    console.log('[BACKEND] 🏢 Ruangan sidang raw:', ruanganSidang);
    
    if (typeof ruanganSidang === 'string') {
      ruanganSidang = ruanganSidang.split(',').map((r: string) => r.trim()).filter(Boolean);
      console.log('[BACKEND] 🏢 Ruangan sidang parsed:', ruanganSidang);
    }

    const pengaturan = {
      max_mahasiswa_uji_per_dosen: config.max_mahasiswa_uji_per_dosen || 4,
      durasi_sidang_menit: config.durasi_sidang_menit || 90,
      jeda_sidang_menit: config.jeda_sidang_menit || 15,
      jam_mulai_sidang: config.jam_mulai_sidang || '08:00',
      jam_selesai_sidang: config.jam_selesai_sidang || '15:00',
      hari_libur_tetap: config.hari_libur_tetap || ['sabtu', 'minggu'],
      tanggal_libur_khusus: config.tanggal_libur_khusus || [],
      ruangan_sidang: ruanganSidang,
      waktu_istirahat: config.waktu_istirahat || [],
      jadwal_hari_khusus: config.jadwal_hari_khusus || [],
    };
    
    console.log('[BACKEND] ✅ Pengaturan:', pengaturan);
    return pengaturan;
  }

  private async getRuanganIds(namaRuangan: string[]): Promise<number[]> {
    console.log('[BACKEND] 🔍 Finding ruangan by names:', namaRuangan);
    const ruangan = await prisma.ruangan.findMany({
      where: { nama_ruangan: { in: namaRuangan } },
    });
    console.log('[BACKEND] 🏢 Found ruangan:', ruangan.length, ruangan.map(r => ({ id: r.id, nama: r.nama_ruangan })));
    return ruangan.map((r) => r.id);
  }

  private isHariLibur(tanggal: Date, pengaturan: PengaturanJadwal): boolean {
    const hariMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const hari = hariMap[tanggal.getDay()];
    
    if (pengaturan.hari_libur_tetap.includes(hari)) return true;

    const tanggalStr = tanggal.toISOString().split('T')[0];
    return pengaturan.tanggal_libur_khusus.some((l) => l.tanggal === tanggalStr);
  }

  private generateTimeSlots(
    tanggal: Date,
    pengaturan: PengaturanJadwal,
    ruanganIds: number[]
  ): TimeSlot[] {
    if (this.isHariLibur(tanggal, pengaturan)) return [];

    const slots: TimeSlot[] = [];
    const hariMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const hariIni = hariMap[tanggal.getDay()];
    
    // Cek apakah ada jadwal khusus untuk hari ini
    const jadwalKhusus = (pengaturan.jadwal_hari_khusus || []).find(j => j.hari === hariIni);
    
    let jamMulaiSidang = pengaturan.jam_mulai_sidang;
    let jamSelesaiSidang = pengaturan.jam_selesai_sidang;
    let durasiSidangMenit = pengaturan.durasi_sidang_menit;
    let jedaSidangMenit = pengaturan.jeda_sidang_menit;
    let waktuIstirahatList = pengaturan.waktu_istirahat || [];
    
    if (jadwalKhusus) {
      jamMulaiSidang = jadwalKhusus.jam_mulai;
      jamSelesaiSidang = jadwalKhusus.jam_selesai;
      durasiSidangMenit = jadwalKhusus.durasi_sidang_menit ?? pengaturan.durasi_sidang_menit;
      jedaSidangMenit = jadwalKhusus.jeda_sidang_menit ?? pengaturan.jeda_sidang_menit;
      waktuIstirahatList = jadwalKhusus.waktu_istirahat || [];
      console.log(`[BACKEND] 📅 Menggunakan jadwal khusus untuk hari ${hariIni}:`, jadwalKhusus);
    }

    const [jamMulai, menitMulai] = jamMulaiSidang.split(':').map(Number);
    const [jamSelesai, menitSelesai] = jamSelesaiSidang.split(':').map(Number);

    const startMinutes = jamMulai * 60 + menitMulai;
    const endMinutes = jamSelesai * 60 + menitSelesai;
    const durasiTotal = durasiSidangMenit + jedaSidangMenit;

    // Parse waktu istirahat ke menit
    const waktuIstirahatMap = new Map<number, number>();
    waktuIstirahatList.forEach((istirahat) => {
      const [jam, menit] = istirahat.waktu.split(':').map(Number);
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

        // Cek apakah ada waktu istirahat setelah slot ini
        if (waktuIstirahatMap.has(waktuSelesaiMenit)) {
          const durasiIstirahat = waktuIstirahatMap.get(waktuSelesaiMenit)!;
          currentMinutes = waktuSelesaiMenit + durasiIstirahat;
          console.log(`[BACKEND] ☕ Waktu istirahat ${waktuSelesai} (+${durasiIstirahat} menit, skip jeda normal)`);
        } else {
          // Tambahkan jeda normal hanya jika tidak ada istirahat
          currentMinutes += durasiTotal;
        }
      }
    }

    return slots;
  }

  private async isSlotAvailable(slot: TimeSlot): Promise<boolean> {
    const existing = await prisma.jadwalSidang.findFirst({
      where: {
        tanggal: slot.tanggal,
        ruangan_id: slot.ruangan_id,
        NOT: [
          { waktu_selesai: { lte: slot.waktu_mulai } },
          { waktu_mulai: { gte: slot.waktu_selesai } },
        ],
      },
    });

    return !existing;
  }

  private async getDosenAvailable(
    slot: TimeSlot,
    excludeDosenIds: number[],
    pengaturan: PengaturanJadwal,
    allowSoftBusy: boolean = false
  ): Promise<number[]> {
    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });

    const [jamMulai, menitMulai] = slot.waktu_mulai.split(':').map(Number);
    const [jamSelesai, menitSelesai] = slot.waktu_selesai.split(':').map(Number);
    const slotStart = jamMulai * 60 + menitMulai;
    const slotEnd = jamSelesai * 60 + menitSelesai;
    const jedaMinutes = pengaturan.jeda_sidang_menit;

    const dosenBusy = await prisma.jadwalSidang.findMany({
      where: {
        tanggal: slot.tanggal,
      },
      include: {
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                peranDosenTa: true,
              },
            },
          },
        },
      },
    });

    const busyDosenIds = new Set<number>();
    const softBusyDosenIds = new Set<number>();
    
    dosenBusy.forEach((jadwal) => {
      const [jMulai, mMulai] = jadwal.waktu_mulai.split(':').map(Number);
      const [jSelesai, mSelesai] = jadwal.waktu_selesai.split(':').map(Number);
      const existingStart = jMulai * 60 + mMulai;
      const existingEnd = jSelesai * 60 + mSelesai;

      // HARD CONSTRAINT: Dosen tidak boleh di 2 tempat pada waktu EXACT yang sama
      const hasExactOverlap = (
        (slotStart >= existingStart && slotStart < existingEnd) ||
        (slotEnd > existingStart && slotEnd <= existingEnd) ||
        (slotStart <= existingStart && slotEnd >= existingEnd)
      );

      // SOFT CONSTRAINT: Minimal ada jeda antar sidang
      const hasSoftOverlap = (
        (slotStart >= existingStart - jedaMinutes && slotStart < existingEnd + jedaMinutes) ||
        (slotEnd > existingStart - jedaMinutes && slotEnd <= existingEnd + jedaMinutes) ||
        (slotStart <= existingStart && slotEnd >= existingEnd)
      );

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

    // LOAD BALANCING: Hitung TOTAL beban dosen sebagai penguji (semua peran dijumlahkan)
    const dosenLoadRaw = await prisma.peranDosenTa.findMany({
      where: {
        peran: { in: ['penguji1', 'penguji2', 'penguji3'] },
        tugasAkhir: {
          periode_ta_id: periodeAktif?.id,
          sidang: {
            some: {
              status_hasil: 'dijadwalkan',
            },
          },
        },
      },
      select: { dosen_id: true },
    });

    // Hitung total kemunculan per dosen (bukan per peran)
    const dosenLoadMap = new Map<number, number>();
    dosenLoadRaw.forEach((peran) => {
      const current = dosenLoadMap.get(peran.dosen_id) || 0;
      dosenLoadMap.set(peran.dosen_id, current + 1);
    });
    
    // QUOTA: Exclude dosen yang sudah mencapai max quota (total semua peran penguji)
    const fullQuotaDosenIds = new Set<number>();
    dosenLoadMap.forEach((count, dosenId) => {
      if (count >= pengaturan.max_mahasiswa_uji_per_dosen) {
        fullQuotaDosenIds.add(dosenId);
      }
    });

    const allDosen = await prisma.dosen.findMany({
      select: { id: true },
    });

    // Filter: HARD constraint (busy) harus diexclude
    // SOFT constraint (softBusy) hanya diexclude jika allowSoftBusy = false
    const availableDosen = allDosen
      .map((d) => d.id)
      .filter(
        (id) =>
          !excludeDosenIds.includes(id) &&
          !busyDosenIds.has(id) &&
          !fullQuotaDosenIds.has(id) &&
          (allowSoftBusy || !softBusyDosenIds.has(id))
      );

    // Sort: Prioritas dosen dengan beban paling rendah (load balancing)
    return availableDosen.sort((a, b) => {
      return (dosenLoadMap.get(a) || 0) - (dosenLoadMap.get(b) || 0);
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private async validateNoConflict(
    slot: TimeSlot,
    pengujiIds: number[],
    pembimbingIds: number[]
  ): Promise<boolean> {
    const allDosenIds = [...pengujiIds, ...pembimbingIds];
    
    // CRITICAL: Check conflicts in ALL rooms at the EXACT same time
    const conflicts = await prisma.jadwalSidang.findMany({
      where: {
        tanggal: slot.tanggal,
        waktu_mulai: slot.waktu_mulai,
        waktu_selesai: slot.waktu_selesai,
      },
      include: {
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                peranDosenTa: {
                  where: {
                    peran: { in: ['penguji1', 'penguji2', 'penguji3', 'pembimbing1'] },
                  },
                },
              },
            },
          },
        },
        ruangan: true,
      },
    });

    for (const conflict of conflicts) {
      const conflictDosenIds = conflict.sidang.tugasAkhir.peranDosenTa
        .filter(p => ['penguji1', 'penguji2', 'penguji3', 'pembimbing1'].includes(p.peran))
        .map(p => p.dosen_id);
      
      const conflictingDosen = allDosenIds.filter(id => conflictDosenIds.includes(id));
      
      if (conflictingDosen.length > 0) {
        console.log('[BACKEND] ❌ HARD CONFLICT: Dosen IDs', conflictingDosen, 'already scheduled at', slot.waktu_mulai, 'in room', conflict.ruangan.nama_ruangan);
        return false;
      }
    }

    return true;
  }

  async generateJadwalOtomatis(): Promise<any[]> {
    console.log('[BACKEND] 🚀 Starting generateJadwalOtomatis...');
    
    const pengaturan = await this.getPengaturan();
    
    // 🧠 SMART DIAGNOSTIC SYSTEM
    const diagnostic = await this.runSmartDiagnostic(pengaturan);
    if (!diagnostic.success) {
      throw new Error(JSON.stringify(diagnostic.error));
    }
    
    const ruanganIds = await this.getRuanganIds(pengaturan.ruangan_sidang);
    console.log('[BACKEND] 🏢 Ruangan IDs:', ruanganIds);

    // Cari mahasiswa siap sidang
    console.log('[BACKEND] 🔍 Finding mahasiswa siap sidang...');
    const mahasiswaSiapData = await prisma.mahasiswa.findMany({
      where: { siap_sidang: true },
      include: {
        user: true,
        tugasAkhir: {
          include: {
            peranDosenTa: {
              where: {
                peran: { in: [PeranDosen.pembimbing1, PeranDosen.pembimbing2] },
              },
              include: {
                dosen: {
                  include: { user: true },
                },
              },
            },
            sidang: {
              where: { is_active: true },
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    console.log('[BACKEND] 👥 Found mahasiswa siap:', mahasiswaSiapData.length);
    
    if (mahasiswaSiapData.length === 0) {
      console.error('[BACKEND] ❌ No mahasiswa siap sidang');
      throw new Error('Tidak ada mahasiswa yang siap sidang.');
    }

    // Filter yang belum dijadwalkan atau buat sidang baru
    console.log('[BACKEND] 🔄 Processing mahasiswa data...');
    const mahasiswaSiap: any[] = [];
    for (const mhs of mahasiswaSiapData) {
      if (!mhs.tugasAkhir) {
        console.warn('[BACKEND] ⚠️ Mahasiswa tanpa TA:', mhs.nim, mhs.user.name);
        continue;
      }

      let sidang = mhs.tugasAkhir.sidang[0];
      console.log('[BACKEND] 📝 Mahasiswa:', mhs.nim, 'Sidang:', sidang?.id, 'Status:', sidang?.status_hasil);
      
      // Jika belum ada sidang atau sudah dijadwalkan, buat sidang baru
      if (!sidang || sidang.status_hasil !== HasilSidang.menunggu_penjadwalan) {
        console.log('[BACKEND] ➕ Creating new sidang for:', mhs.nim);
        sidang = await prisma.sidang.create({
          data: {
            tugas_akhir_id: mhs.tugasAkhir.id,
            jenis_sidang: 'AKHIR',
            status_hasil: HasilSidang.menunggu_penjadwalan,
            is_active: true,
          },
        });
        console.log('[BACKEND] ✅ Sidang created:', sidang.id);
      }

      mahasiswaSiap.push({
        ...sidang,
        tugasAkhir: {
          ...mhs.tugasAkhir,
          mahasiswa: mhs,
        },
      });
    }

    console.log('[BACKEND] 📊 Total mahasiswa to schedule:', mahasiswaSiap.length);
      
    // VALIDASI: Cek apakah ada dosen yang membimbing > max_pembimbing_aktif
    const maxPembimbingAktif = parseInt(await this.getPengaturanByKey('max_pembimbing_aktif') || '4', 10);
    const pembimbingCount = new Map<number, number>();
    
    mahasiswaSiap.forEach((sidang) => {
      sidang.tugasAkhir.peranDosenTa.forEach((peran: any) => {
        if (peran.peran === 'pembimbing1') {
          const count = pembimbingCount.get(peran.dosen_id) || 0;
          pembimbingCount.set(peran.dosen_id, count + 1);
        }
      });
    });
    
    const overloadPembimbing: string[] = [];
    for (const [dosenId, count] of pembimbingCount.entries()) {
      if (count > maxPembimbingAktif) {
        const dosen = await prisma.dosen.findUnique({
          where: { id: dosenId },
          include: { user: true },
        });
        overloadPembimbing.push(`${dosen?.user.name} (${count} mahasiswa, max: ${maxPembimbingAktif})`);
      }
    }
    
    if (overloadPembimbing.length > 0) {
      console.error('[BACKEND] ❌ Dosen overload pembimbing:', overloadPembimbing);
      throw new Error(
        JSON.stringify({
          status: 'PEMBIMBING_OVERLOAD',
          masalah: `Ada ${overloadPembimbing.length} dosen yang membimbing melebihi batas maksimal.`,
          detail: overloadPembimbing,
          saran: `Kurangi jumlah mahasiswa yang dibimbing oleh dosen tersebut, atau naikkan "Maksimal Pembimbing Aktif" di menu Aturan Umum.`,
        })
      );
    }
    
    const results: any[] = [];
    const totalMahasiswa = mahasiswaSiap.length;
    const unscheduled = [...mahasiswaSiap];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    console.log('[BACKEND] 📅 Start date for scheduling:', startDate);
    console.log('[BACKEND] 🚀 Using BATCH PARALLEL scheduling');

    for (let dayOffset = 0; unscheduled.length > 0 && dayOffset < 365; dayOffset++) {
      const tanggal = new Date(startDate);
      tanggal.setDate(tanggal.getDate() + dayOffset);
      console.log(`[BACKEND] 📅 Day ${dayOffset + 1}: ${tanggal.toISOString().split('T')[0]} - Remaining: ${unscheduled.length}/${totalMahasiswa}`);

      const slots = this.generateTimeSlots(tanggal, pengaturan, ruanganIds);
      if (slots.length === 0) continue;

      for (const slot of slots) {
        if (unscheduled.length === 0) break;

        const isAvailable = await this.isSlotAvailable(slot);
        if (!isAvailable) continue;

        let scheduled = false;
        for (let i = 0; i < unscheduled.length && !scheduled; i++) {
          const sidang = unscheduled[i];
          const pembimbingIds = sidang.tugasAkhir.peranDosenTa.map((p: any) => p.dosen_id);

          let availableDosen = await this.getDosenAvailable(slot, pembimbingIds, pengaturan, false);
          if (availableDosen.length < 3) {
            availableDosen = await this.getDosenAvailable(slot, pembimbingIds, pengaturan, true);
          }

          if (availableDosen.length >= 3) {
            let isValid = false;
            let pengujiIds: number[] = [];
            const maxRetries = Math.min(10, availableDosen.length);

            for (let retry = 0; retry < maxRetries && !isValid; retry++) {
              const shuffled = this.shuffleArray(availableDosen);
              pengujiIds = shuffled.slice(0, 3);
              isValid = await this.validateNoConflict(slot, pengujiIds, pembimbingIds);
            }

            if (isValid) {
              const pengujiData = await prisma.$transaction(async (tx) => {
                await tx.peranDosenTa.deleteMany({
                  where: {
                    tugas_akhir_id: sidang.tugas_akhir_id,
                    peran: { in: [PeranDosen.penguji1, PeranDosen.penguji2, PeranDosen.penguji3] },
                  },
                });

                const jadwal = await tx.jadwalSidang.create({
                  data: {
                    sidang_id: sidang.id,
                    tanggal: slot.tanggal,
                    waktu_mulai: slot.waktu_mulai,
                    waktu_selesai: slot.waktu_selesai,
                    ruangan_id: slot.ruangan_id,
                  },
                  include: { ruangan: true },
                });

                await tx.peranDosenTa.createMany({
                  data: [
                    { tugas_akhir_id: sidang.tugas_akhir_id, dosen_id: pengujiIds[0], peran: PeranDosen.penguji1 },
                    { tugas_akhir_id: sidang.tugas_akhir_id, dosen_id: pengujiIds[1], peran: PeranDosen.penguji2 },
                    { tugas_akhir_id: sidang.tugas_akhir_id, dosen_id: pengujiIds[2], peran: PeranDosen.penguji3 },
                  ],
                });

                await tx.sidang.update({
                  where: { id: sidang.id },
                  data: { status_hasil: HasilSidang.dijadwalkan },
                });

                const [ketua, anggota1, anggota2] = await Promise.all([
                  tx.dosen.findUnique({ where: { id: pengujiIds[0] }, include: { user: true } }),
                  tx.dosen.findUnique({ where: { id: pengujiIds[1] }, include: { user: true } }),
                  tx.dosen.findUnique({ where: { id: pengujiIds[2] }, include: { user: true } }),
                ]);

                return { ketua, anggota1, anggota2, jadwal };
              });

              const pembimbing1 = sidang.tugasAkhir.peranDosenTa.find((p: any) => p.peran === 'pembimbing1');
              const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              const hari = hariMap[slot.tanggal.getDay()];
              const tanggalStr = slot.tanggal.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

              results.push({
                mahasiswa: sidang.tugasAkhir.mahasiswa.user.name,
                nim: sidang.tugasAkhir.mahasiswa.nim,
                ketua: pengujiData.ketua?.user.name || '-',
                sekretaris: pembimbing1?.dosen?.user?.name || '-',
                anggota1: pengujiData.anggota1?.user.name || '-',
                anggota2: pengujiData.anggota2?.user.name || '-',
                hari_tanggal: `${hari}, ${tanggalStr}`,
                pukul: `${slot.waktu_mulai} - ${slot.waktu_selesai}`,
                ruangan: pengujiData.jadwal.ruangan.nama_ruangan,
              });

              console.log(`[BACKEND] ✅ [${totalMahasiswa - unscheduled.length + 1}/${totalMahasiswa}] ${sidang.tugasAkhir.mahasiswa.nim} → ${slot.waktu_mulai} ${pengujiData.jadwal.ruangan.nama_ruangan}`);
              unscheduled.splice(i, 1);
              scheduled = true;
            }
          }
        }
      }
    }

    if (unscheduled.length > 0) {
      const firstUnscheduled = unscheduled[0];
      console.error('[BACKEND] ❌ Failed to schedule', unscheduled.length, 'mahasiswa');
      throw new Error(
        JSON.stringify({
          status: 'TIDAK_ADA_SLOT',
          masalah: `Tidak dapat menjadwalkan ${unscheduled.length} mahasiswa dalam 365 hari.`,
          saran: 'Tambah ruangan atau perbesar jam operasional.',
          detail: {
            mahasiswa: firstUnscheduled.tugasAkhir.mahasiswa.user.name,
            nim: firstUnscheduled.tugasAkhir.mahasiswa.nim,
            totalGagal: unscheduled.length,
          },
        })
      );
    }

    console.log('[BACKEND] 🎉 All mahasiswa scheduled successfully!');
    console.log('[BACKEND] 📊 Total results:', results.length);
    return results;
  }

  private async getPengaturanByKey(key: string): Promise<string> {
    const setting = await prisma.pengaturanSistem.findUnique({ where: { key } });
    return setting?.value || '';
  }

  private async runSmartDiagnostic(pengaturan: PengaturanJadwal) {
    console.log('[BACKEND] 🧠 Running Smart Diagnostic...');
    
    const mahasiswaCount = await prisma.mahasiswa.count({ where: { siap_sidang: true } });
    const totalDosen = await prisma.dosen.count();
    const ruanganCount = pengaturan.ruangan_sidang.length;
    const hariLiburCount = pengaturan.hari_libur_tetap.length;
    
    // Hitung jam operasional
    const [jamMulai, menitMulai] = pengaturan.jam_mulai_sidang.split(':').map(Number);
    const [jamSelesai, menitSelesai] = pengaturan.jam_selesai_sidang.split(':').map(Number);
    const totalMenit = (jamSelesai * 60 + menitSelesai) - (jamMulai * 60 + menitMulai);
    const durasiPerSidang = pengaturan.durasi_sidang_menit + pengaturan.jeda_sidang_menit;
    const slotPerHari = Math.floor(totalMenit / durasiPerSidang) * ruanganCount;
    const hariKerja = 7 - hariLiburCount;
    
    const problems: string[] = [];
    const suggestions: string[] = [];
    
    // Cek 1: Tidak ada mahasiswa
    if (mahasiswaCount === 0) {
      return {
        success: false,
        error: {
          status: 'TIDAK_ADA_MAHASISWA',
          masalah: 'Tidak ada mahasiswa yang siap sidang.',
          saran: 'Pastikan ada mahasiswa dengan status "siap_sidang = true" di sistem.',
          detail: { mahasiswaCount: 0 },
        },
      };
    }
    
    // Cek 2: Tidak ada ruangan
    if (ruanganCount === 0) {
      return {
        success: false,
        error: {
          status: 'TIDAK_ADA_RUANGAN',
          masalah: 'Tidak ada ruangan sidang yang tersedia.',
          saran: 'Tambahkan minimal 1 ruangan di menu Aturan Umum → Ruangan Sidang.',
          detail: { ruanganCount: 0 },
        },
      };
    }
    
    // Cek 3: Tidak ada dosen
    if (totalDosen === 0) {
      return {
        success: false,
        error: {
          status: 'TIDAK_ADA_DOSEN',
          masalah: 'Tidak ada dosen di sistem.',
          saran: 'Tambahkan dosen melalui menu manajemen pengguna.',
          detail: { totalDosen: 0 },
        },
      };
    }
    
    // Cek 4: Semua hari libur
    if (hariKerja === 0) {
      return {
        success: false,
        error: {
          status: 'SEMUA_HARI_LIBUR',
          masalah: 'Semua hari (Senin-Minggu) diatur sebagai hari libur.',
          saran: 'Uncheck beberapa hari di menu Aturan Umum → Hari Libur Tetap agar ada hari kerja untuk sidang.',
          detail: { hariLiburCount, hariKerja: 0 },
        },
      };
    }
    
    // Cek 5: Jam operasional terlalu pendek
    if (totalMenit < pengaturan.durasi_sidang_menit) {
      return {
        success: false,
        error: {
          status: 'JAM_OPERASIONAL_PENDEK',
          masalah: `Jam operasional (${totalMenit} menit) lebih pendek dari durasi sidang (${pengaturan.durasi_sidang_menit} menit).`,
          saran: `Perlebar jam operasional di menu Aturan Umum atau kurangi durasi sidang.`,
          detail: { totalMenit, durasiSidang: pengaturan.durasi_sidang_menit },
        },
      };
    }
    
    // Cek 6: Kapasitas dosen tidak cukup
    const maxPembimbingAktif = parseInt(await this.getPengaturanByKey('max_pembimbing_aktif') || '4', 10);
    const marginPersen = totalDosen > 0 ? (maxPembimbingAktif / totalDosen) : 0.2;
    const totalSlotDosen = totalDosen * pengaturan.max_mahasiswa_uji_per_dosen;
    const slotDibutuhkan = mahasiswaCount * 3;
    const slotDibutuhkanDenganMargin = Math.ceil(slotDibutuhkan * (1 + marginPersen));
    
    if (totalSlotDosen < slotDibutuhkanDenganMargin) {
      const kuotaMinimal = Math.ceil(slotDibutuhkanDenganMargin / totalDosen);
      
      const perhitungan = [
        `📊 Perhitungan Kapasitas:`,
        ``,
        `1. Slot Dibutuhkan (Tanpa Margin):`,
        `   ${mahasiswaCount} mahasiswa × 3 penguji = ${slotDibutuhkan} slot`,
        ``,
        `2. Margin Safety (Cadangan Fleksibilitas):`,
        `   Apa itu Margin?`,
        `   Margin adalah cadangan slot tambahan yang diperlukan karena ada`,
        `   pembatasan: pembimbing TIDAK BOLEH menjadi penguji untuk mahasiswa`,
        `   yang dibimbingnya sendiri.`,
        ``,
        `   Margin dipengaruhi oleh:`,
        `   - Maksimal Pembimbing Aktif (${maxPembimbingAktif} mahasiswa/dosen)`,
        `   - Total Dosen (${totalDosen} dosen)`,
        ``,
        `   Rumus Margin:`,
        `   Margin = Maksimal Pembimbing Aktif / Total Dosen`,
        `   Margin = ${maxPembimbingAktif} / ${totalDosen} = ${(marginPersen * 100).toFixed(1)}%`,
        ``,
        `   Artinya: Jika semua dosen membimbing ${maxPembimbingAktif} mahasiswa, maka untuk`,
        `   setiap mahasiswa hanya ada ${totalDosen - 1} dosen (bukan ${totalDosen}) yang bisa jadi`,
        `   penguji. Semakin banyak mahasiswa per pembimbing, semakin besar`,
        `   margin yang dibutuhkan.`,
        ``,
        `3. Slot Dibutuhkan (Dengan Margin):`,
        `   ${slotDibutuhkan} slot + ${(marginPersen * 100).toFixed(1)}% margin = ${slotDibutuhkanDenganMargin} slot`,
        ``,
        `4. Kapasitas Tersedia:`,
        `   ${totalDosen} dosen × ${pengaturan.max_mahasiswa_uji_per_dosen} quota = ${totalSlotDosen} slot`,
        ``,
        `5. Hasil:`,
        `   ${totalSlotDosen} slot < ${slotDibutuhkanDenganMargin} slot → TIDAK CUKUP! ❌`,
        ``,
        `6. Quota Minimal yang Dibutuhkan:`,
        `   ${slotDibutuhkanDenganMargin} slot / ${totalDosen} dosen = ${(slotDibutuhkanDenganMargin / totalDosen).toFixed(1)} → ${kuotaMinimal} quota/dosen`,
      ].join('\n');
      
      return {
        success: false,
        error: {
          status: 'KAPASITAS_DOSEN_TIDAK_CUKUP',
          masalah: `Kapasitas dosen tidak mencukupi untuk ${mahasiswaCount} mahasiswa.`,
          perhitungan,
          saran: `Naikkan "Maksimal Mahasiswa Uji per Dosen" dari ${pengaturan.max_mahasiswa_uji_per_dosen} menjadi minimal ${kuotaMinimal} di menu Aturan Umum.`,
          detail: {
            totalDosen,
            maxPembimbingAktif,
            marginPersen: `${(marginPersen * 100).toFixed(1)}%`,
            kuotaSekarang: pengaturan.max_mahasiswa_uji_per_dosen,
            kuotaMinimal,
            totalSlotDosen,
            mahasiswaCount,
            slotDibutuhkan,
            slotDibutuhkanDenganMargin,
          },
        },
      };
    }
    
    // Cek 7: Kapasitas waktu (estimasi hari yang dibutuhkan)
    const hariDibutuhkan = Math.ceil(mahasiswaCount / slotPerHari);
    
    if (slotPerHari === 0) {
      return {
        success: false,
        error: {
          status: 'TIDAK_ADA_SLOT_WAKTU',
          masalah: 'Tidak ada slot waktu yang tersedia per hari.',
          saran: 'Perlebar jam operasional atau tambah ruangan di menu Aturan Umum.',
          detail: { slotPerHari: 0, totalMenit, durasiPerSidang },
        },
      };
    }
    
    // Warning jika butuh waktu lama
    if (hariDibutuhkan > 60) {
      problems.push(`Estimasi butuh ${hariDibutuhkan} hari kerja untuk ${mahasiswaCount} mahasiswa.`);
      suggestions.push(`Tambah ruangan (sekarang: ${ruanganCount}) atau perlebar jam operasional untuk mempercepat.`);
    }
    
    console.log('[BACKEND] ✅ Diagnostic passed!');
    console.log('[BACKEND] 📊 Estimasi:', hariDibutuhkan, 'hari kerja untuk', mahasiswaCount, 'mahasiswa');
    console.log('[BACKEND] 📊 Slot per hari:', slotPerHari, '(', Math.floor(totalMenit / durasiPerSidang), 'slot/ruangan ×', ruanganCount, 'ruangan)');
    
    return {
      success: true,
      info: {
        mahasiswaCount,
        totalDosen,
        ruanganCount,
        hariKerja,
        slotPerHari,
        estimasiHari: hariDibutuhkan,
        warnings: problems.length > 0 ? { problems, suggestions } : null,
      },
    };
  }

  async getMahasiswaSiapSidang() {
    console.log('[BACKEND] 🔍 Getting mahasiswa siap sidang...');
    const mahasiswa = await prisma.mahasiswa.findMany({
      where: {
        siap_sidang: true,
      },
      include: {
        user: true,
        tugasAkhir: {
          include: {
            peranDosenTa: {
              where: {
                peran: { in: [PeranDosen.pembimbing1, PeranDosen.pembimbing2] },
              },
              include: { dosen: { include: { user: true } } },
            },
            sidang: true,
          },
        },
      },
    });

    console.log('[BACKEND] 👥 Found mahasiswa:', mahasiswa.length);
    
    const result = mahasiswa
      .filter((m) => m.tugasAkhir)
      .map((m) => {
        const sidangAktif = m.tugasAkhir!.sidang.find(
          (s) => s.is_active && s.status_hasil === HasilSidang.menunggu_penjadwalan
        );
        
        return {
          id: sidangAktif?.id || 0,
          status_hasil: sidangAktif?.status_hasil || 'belum_ada_sidang',
          tugasAkhir: {
            ...m.tugasAkhir,
            mahasiswa: m,
          },
        };
      });
    
    console.log('[BACKEND] 📊 Returning mahasiswa siap:', result.length);
    return result;
  }

  async getJadwalSidang() {
    const jadwal = await prisma.jadwalSidang.findMany({
      include: {
        ruangan: true,
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                mahasiswa: { include: { user: true } },
                peranDosenTa: {
                  where: {
                    peran: {
                      in: [
                        PeranDosen.penguji1,
                        PeranDosen.penguji2,
                        PeranDosen.penguji3,
                        PeranDosen.pembimbing1,
                      ],
                    },
                  },
                  include: { dosen: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
    });
    
    const sorted = jadwal.sort((a, b) => {
      const dateA = new Date(a.tanggal);
      dateA.setUTCHours(0, 0, 0, 0);
      const dateB = new Date(b.tanggal);
      dateB.setUTCHours(0, 0, 0, 0);
      
      const timeA = dateA.getTime();
      const timeB = dateB.getTime();
      if (timeA !== timeB) return timeA - timeB;
      
      const [hA, mA] = a.waktu_mulai.split(':').map(Number);
      const [hB, mB] = b.waktu_mulai.split(':').map(Number);
      return (hA * 60 + mA) - (hB * 60 + mB);
    });
    
    console.log('[BACKEND] 📊 Jadwal count:', sorted.length);
    if (sorted.length > 0) {
      console.log('[BACKEND] 📅 First:', sorted[0].tanggal, sorted[0].waktu_mulai);
      console.log('[BACKEND] 📅 Last:', sorted[sorted.length - 1].tanggal, sorted[sorted.length - 1].waktu_mulai);
    }
    
    return sorted;
  }

  async deleteAllJadwal() {
    console.log('[BACKEND] 🗑️ Deleting all jadwal sidang...');
    
    return await prisma.$transaction(async (tx) => {
      // Hapus semua penguji
      await tx.peranDosenTa.deleteMany({
        where: {
          peran: { in: [PeranDosen.penguji1, PeranDosen.penguji2, PeranDosen.penguji3] },
        },
      });

      // Reset status sidang ke menunggu_penjadwalan
      await tx.sidang.updateMany({
        where: { status_hasil: HasilSidang.dijadwalkan },
        data: { status_hasil: HasilSidang.menunggu_penjadwalan },
      });

      // Hapus semua jadwal
      const result = await tx.jadwalSidang.deleteMany({});
      
      console.log('[BACKEND] ✅ Deleted', result.count, 'jadwal');
      return result;
    });
  }

  async deleteJadwal(id: number) {
    return await prisma.$transaction(async (tx) => {
      const jadwal = await tx.jadwalSidang.findUnique({ where: { id }, include: { sidang: true } });
      if (!jadwal) throw new Error('Jadwal tidak ditemukan');

      await tx.peranDosenTa.deleteMany({
        where: {
          tugas_akhir_id: jadwal.sidang.tugas_akhir_id,
          peran: { in: [PeranDosen.penguji1, PeranDosen.penguji2, PeranDosen.penguji3] },
        },
      });

      await tx.sidang.update({
        where: { id: jadwal.sidang_id },
        data: { status_hasil: HasilSidang.menunggu_penjadwalan },
      });

      await tx.jadwalSidang.delete({ where: { id } });
    });
  }

  async updateJadwal(id: number, data: any) {
    console.log('[BACKEND UPDATE] 📝 Starting update jadwal ID:', id);
    console.log('[BACKEND UPDATE] 📦 Data received:', JSON.stringify(data));
    
    return await prisma.$transaction(async (tx) => {
      const jadwal = await tx.jadwalSidang.findUnique({
        where: { id },
        include: {
          sidang: {
            include: {
              tugasAkhir: {
                include: {
                  mahasiswa: { include: { user: true } },
                  peranDosenTa: { include: { dosen: { include: { user: true } } } },
                },
              },
            },
          },
          ruangan: true,
        },
      });

      if (!jadwal) {
        const error: any = new Error('Jadwal tidak ditemukan');
        error.statusCode = 404;
        throw error;
      }
      
      console.log('[BACKEND UPDATE] 📋 Current jadwal:', {
        tanggal: jadwal.tanggal,
        waktu_mulai: jadwal.waktu_mulai,
        waktu_selesai: jadwal.waktu_selesai,
        ruangan_id: jadwal.ruangan_id,
        ruangan_nama: jadwal.ruangan.nama_ruangan,
      });

      const pengujiIds = [data.penguji1_id, data.penguji2_id, data.penguji3_id].filter(Boolean);
      const uniquePenguji = new Set(pengujiIds);
      if (pengujiIds.length !== uniquePenguji.size) {
        const error: any = new Error('Penguji tidak boleh sama');
        error.statusCode = 400;
        throw error;
      }

      const pembimbingIds = jadwal.sidang.tugasAkhir.peranDosenTa
        .filter((p) => p.peran === 'pembimbing1' || p.peran === 'pembimbing2')
        .map((p) => p.dosen_id);

      const isPengujiSamaDenganPembimbing = pengujiIds.some((id) => pembimbingIds.includes(id));
      if (isPengujiSamaDenganPembimbing) {
        const error: any = new Error('Penguji tidak boleh sama dengan pembimbing');
        error.statusCode = 400;
        throw error;
      }

      const tanggalBaru = data.tanggal ? new Date(data.tanggal) : jadwal.tanggal;
      const waktuMulaiBaru = data.waktu_mulai || jadwal.waktu_mulai;
      const waktuSelesaiBaru = data.waktu_selesai || jadwal.waktu_selesai;
      const ruanganBaru = data.ruangan_id !== undefined ? data.ruangan_id : jadwal.ruangan_id;

      if (!ruanganBaru) {
        const error: any = new Error('Ruangan harus dipilih');
        error.statusCode = 400;
        throw error;
      }

      const tanggalNormalized = new Date(tanggalBaru);
      tanggalNormalized.setUTCHours(0, 0, 0, 0);

      const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const newStart = toMinutes(waktuMulaiBaru);
      const newEnd = toMinutes(waktuSelesaiBaru);

      const allConflicts = await tx.jadwalSidang.findMany({
        where: {
          id: { not: id },
          tanggal: {
            gte: tanggalNormalized,
            lt: new Date(tanggalNormalized.getTime() + 24 * 60 * 60 * 1000),
          },
          ruangan_id: ruanganBaru,
        },
        include: { 
          sidang: { 
            include: { 
              tugasAkhir: { 
                include: { 
                  mahasiswa: { include: { user: true } } 
                } 
              } 
            } 
          },
          ruangan: true,
        },
      });

      const conflictRuangan = allConflicts.find((c) => {
        const existStart = toMinutes(c.waktu_mulai);
        const existEnd = toMinutes(c.waktu_selesai);
        return !(existEnd <= newStart || existStart >= newEnd);
      });

      if (conflictRuangan) {
        const error: any = new Error(
          `Ruangan ${conflictRuangan.ruangan.nama_ruangan} sudah digunakan untuk sidang ${conflictRuangan.sidang.tugasAkhir.mahasiswa.user.name} pada waktu tersebut`
        );
        error.statusCode = 409;
        throw error;
      }

      const allDosenIds = [...pengujiIds, ...pembimbingIds];
      const allSchedules = await tx.jadwalSidang.findMany({
        where: {
          id: { not: id },
          tanggal: {
            gte: tanggalNormalized,
            lt: new Date(tanggalNormalized.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          sidang: {
            include: {
              tugasAkhir: {
                include: {
                  mahasiswa: { include: { user: true } },
                  peranDosenTa: { include: { dosen: { include: { user: true } } } },
                },
              },
            },
          },
        },
      });

      const conflictDosen = allSchedules.filter((c) => {
        const existStart = toMinutes(c.waktu_mulai);
        const existEnd = toMinutes(c.waktu_selesai);
        return !(existEnd <= newStart || existStart >= newEnd);
      });

      for (const conflict of conflictDosen) {
        const conflictDosenIds = conflict.sidang.tugasAkhir.peranDosenTa
          .filter((p) => ['penguji1', 'penguji2', 'penguji3', 'pembimbing1'].includes(p.peran))
          .map((p) => p.dosen_id);

        const bentrok = allDosenIds.filter((id) => conflictDosenIds.includes(id));

        if (bentrok.length > 0) {
          const dosenBentrok = conflict.sidang.tugasAkhir.peranDosenTa.find((p) =>
            bentrok.includes(p.dosen_id)
          );
          const error: any = new Error(
            `Dosen ${dosenBentrok?.dosen.user.name} sudah dijadwalkan untuk sidang ${conflict.sidang.tugasAkhir.mahasiswa.user.name} pada waktu tersebut`
          );
          error.statusCode = 409;
          throw error;
        }
      }

      const updateData: any = {};
      if (data.tanggal) updateData.tanggal = new Date(data.tanggal);
      if (data.waktu_mulai) updateData.waktu_mulai = data.waktu_mulai;
      if (data.waktu_selesai) updateData.waktu_selesai = data.waktu_selesai;
      if (data.ruangan_id !== undefined) updateData.ruangan_id = data.ruangan_id;

      console.log('[BACKEND UPDATE] 💾 Update data:', JSON.stringify(updateData));

      const updated = await tx.jadwalSidang.update({
        where: { id },
        data: updateData,
      });
      
      console.log('[BACKEND UPDATE] ✅ Updated jadwal:', {
        id: updated.id,
        tanggal: updated.tanggal,
        waktu_mulai: updated.waktu_mulai,
        waktu_selesai: updated.waktu_selesai,
        ruangan_id: updated.ruangan_id,
      });

      if (data.penguji1_id && data.penguji2_id && data.penguji3_id) {
        await tx.peranDosenTa.deleteMany({
          where: {
            tugas_akhir_id: jadwal.sidang.tugas_akhir_id,
            peran: { in: [PeranDosen.penguji1, PeranDosen.penguji2, PeranDosen.penguji3] },
          },
        });

        await tx.peranDosenTa.createMany({
          data: [
            {
              tugas_akhir_id: jadwal.sidang.tugas_akhir_id,
              dosen_id: data.penguji1_id,
              peran: PeranDosen.penguji1,
            },
            {
              tugas_akhir_id: jadwal.sidang.tugas_akhir_id,
              dosen_id: data.penguji2_id,
              peran: PeranDosen.penguji2,
            },
            {
              tugas_akhir_id: jadwal.sidang.tugas_akhir_id,
              dosen_id: data.penguji3_id,
              peran: PeranDosen.penguji3,
            },
          ],
        });
      }

      return await tx.jadwalSidang.findUnique({
        where: { id },
        include: {
          sidang: {
            include: {
              tugasAkhir: {
                include: {
                  mahasiswa: { include: { user: true } },
                  peranDosenTa: { include: { dosen: { include: { user: true } } } },
                },
              },
            },
          },
          ruangan: true,
        },
      });
    });
  }

  async getEditOptions() {
    const [mahasiswa, dosen, ruangan] = await Promise.all([
      prisma.mahasiswa.findMany({ where: { siap_sidang: true }, include: { user: true } }),
      prisma.dosen.findMany({ include: { user: true } }),
      prisma.ruangan.findMany(),
    ]);

    return {
      mahasiswa: mahasiswa.map(m => ({ id: m.id, name: m.user.name, nim: m.nim })),
      dosen: dosen.map(d => ({ id: d.id, name: d.user.name })),
      ruangan: ruangan.map(r => ({ id: r.id, name: r.nama_ruangan })),
    };
  }

  async moveSchedule(fromDate: string, toDate: string) {
    console.log('[BACKEND] 📅 Moving schedule from', fromDate, 'to', toDate);
    
    const dateFrom = new Date(fromDate);
    dateFrom.setUTCHours(0, 0, 0, 0);
    const dateTo = new Date(toDate);
    dateTo.setUTCHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    console.log('[BACKEND] 📊 Days difference:', daysDiff);
    
    if (daysDiff <= 0) {
      const error: any = new Error('Tanggal tujuan harus lebih besar dari tanggal asal');
      error.statusCode = 400;
      throw error;
    }
    
    const jadwalToMove = await prisma.jadwalSidang.findMany({
      where: {
        tanggal: { gte: dateFrom },
      },
    });
    
    console.log('[BACKEND] 📋 Found', jadwalToMove.length, 'jadwal to move');
    
    if (jadwalToMove.length === 0) {
      const error: any = new Error('Tidak ada jadwal yang ditemukan dari tanggal tersebut');
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
        
        await tx.jadwalSidang.update({
          where: { id: jadwal.id },
          data: { tanggal: newDate },
        });
        
        console.log('[BACKEND] ✅ Moved jadwal', jadwal.id, 'from', oldDate.toISOString().split('T')[0], 'to', newDate.toISOString().split('T')[0]);
      }
    });
    
    console.log('[BACKEND] 🎉 Successfully moved', jadwalToMove.length, 'jadwal');
    return { count: jadwalToMove.length };
  }
}
