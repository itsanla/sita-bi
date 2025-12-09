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
    const [jamMulai, menitMulai] = pengaturan.jam_mulai_sidang.split(':').map(Number);
    const [jamSelesai, menitSelesai] = pengaturan.jam_selesai_sidang.split(':').map(Number);

    const startMinutes = jamMulai * 60 + menitMulai;
    const endMinutes = jamSelesai * 60 + menitSelesai;
    const durasiTotal = pengaturan.durasi_sidang_menit + pengaturan.jeda_sidang_menit;

    for (const ruanganId of ruanganIds) {
      let currentMinutes = startMinutes;
      while (currentMinutes + pengaturan.durasi_sidang_menit <= endMinutes) {
        const waktuMulai = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
        const waktuSelesai = `${String(Math.floor((currentMinutes + pengaturan.durasi_sidang_menit) / 60)).padStart(2, '0')}:${String((currentMinutes + pengaturan.durasi_sidang_menit) % 60).padStart(2, '0')}`;

        slots.push({
          tanggal,
          waktu_mulai: waktuMulai,
          waktu_selesai: waktuSelesai,
          ruangan_id: ruanganId,
        });

        currentMinutes += durasiTotal;
      }
    }

    return slots;
  }

  private async isSlotAvailable(slot: TimeSlot): Promise<boolean> {
    const existing = await prisma.jadwalSidang.findFirst({
      where: {
        tanggal: slot.tanggal,
        ruangan_id: slot.ruangan_id,
        OR: [
          {
            waktu_mulai: { lte: slot.waktu_selesai },
            waktu_selesai: { gte: slot.waktu_mulai },
          },
        ],
      },
    });

    return !existing;
  }

  private async getDosenAvailable(
    slot: TimeSlot,
    excludeDosenIds: number[],
    pengaturan: PengaturanJadwal
  ): Promise<number[]> {
    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });

    const dosenBusy = await prisma.jadwalSidang.findMany({
      where: {
        tanggal: slot.tanggal,
        OR: [
          {
            waktu_mulai: { lte: slot.waktu_selesai },
            waktu_selesai: { gte: slot.waktu_mulai },
          },
        ],
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
    dosenBusy.forEach((jadwal) => {
      jadwal.sidang.tugasAkhir.peranDosenTa.forEach((peran) => {
        if (['penguji1', 'penguji2', 'penguji3', 'pembimbing1'].includes(peran.peran)) {
          busyDosenIds.add(peran.dosen_id);
        }
      });
    });

    const dosenKuota = await prisma.peranDosenTa.groupBy({
      by: ['dosen_id'],
      where: {
        peran: { in: ['penguji1', 'penguji2', 'penguji3'] },
        tugasAkhir: {
          periode_ta_id: periodeAktif?.id,
        },
      },
      _count: { dosen_id: true },
    });

    const fullQuotaDosenIds = new Set(
      dosenKuota
        .filter((d) => d._count.dosen_id >= pengaturan.max_mahasiswa_uji_per_dosen)
        .map((d) => d.dosen_id)
    );

    const allDosen = await prisma.dosen.findMany({
      select: { id: true },
    });

    return allDosen
      .map((d) => d.id)
      .filter(
        (id) =>
          !excludeDosenIds.includes(id) &&
          !busyDosenIds.has(id) &&
          !fullQuotaDosenIds.has(id)
      );
  }

  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async generateJadwalOtomatis(): Promise<any[]> {
    console.log('[BACKEND] 🚀 Starting generateJadwalOtomatis...');
    
    const pengaturan = await this.getPengaturan();
    const ruanganIds = await this.getRuanganIds(pengaturan.ruangan_sidang);

    if (ruanganIds.length === 0) {
      console.error('[BACKEND] ❌ No ruangan available');
      throw new Error('Tidak ada ruangan tersedia. Pastikan ruangan sudah diatur di menu Aturan Umum.');
    }

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
    const results: any[] = [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    console.log('[BACKEND] 📅 Start date for scheduling:', startDate);

    for (const sidang of mahasiswaSiap) {
      console.log('[BACKEND] 🎯 Scheduling mahasiswa:', sidang.tugasAkhir.mahasiswa.nim);
      const pembimbingIds = sidang.tugasAkhir.peranDosenTa.map((p) => p.dosen_id);
      console.log('[BACKEND] 👨‍🏫 Pembimbing IDs:', pembimbingIds);
      let scheduled = false;

      for (let dayOffset = 0; dayOffset < 30 && !scheduled; dayOffset++) {
        const tanggal = new Date(startDate);
        tanggal.setDate(tanggal.getDate() + dayOffset);
        console.log('[BACKEND] 📅 Trying date:', tanggal.toISOString().split('T')[0], 'offset:', dayOffset);

        const slots = this.generateTimeSlots(tanggal, pengaturan, ruanganIds);
        console.log('[BACKEND] 🕐 Generated slots:', slots.length);

        for (const slot of slots) {
          const isAvailable = await this.isSlotAvailable(slot);
          console.log('[BACKEND] 🔍 Slot', slot.waktu_mulai, 'available:', isAvailable);
          if (!isAvailable) continue;

          const availableDosen = await this.getDosenAvailable(
            slot,
            pembimbingIds,
            pengaturan
          );
          console.log('[BACKEND] 👨‍🏫 Available dosen:', availableDosen.length);

          if (availableDosen.length >= 3) {
            console.log('[BACKEND] ✅ Found slot with enough dosen!');
            const shuffled = this.shuffleArray(availableDosen);
            const pengujiIds = shuffled.slice(0, 3);

            const pengujiData = await prisma.$transaction(async (tx) => {
              // Hapus penguji lama jika ada
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

              const [ketua, anggota1, anggota2] = await Promise.all([
                tx.dosen.findUnique({ where: { id: pengujiIds[0] }, include: { user: true } }),
                tx.dosen.findUnique({ where: { id: pengujiIds[1] }, include: { user: true } }),
                tx.dosen.findUnique({ where: { id: pengujiIds[2] }, include: { user: true } }),
              ]);

              return { ketua, anggota1, anggota2 };
            });

            const pembimbing1 = sidang.tugasAkhir.peranDosenTa.find(
              (p: any) => p.peran === 'pembimbing1'
            );

            const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const hari = hariMap[slot.tanggal.getDay()];
            const tanggalStr = slot.tanggal.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });

            results.push({
              mahasiswa: sidang.tugasAkhir.mahasiswa.user.name,
              nim: sidang.tugasAkhir.mahasiswa.nim,
              ketua: pengujiData.ketua?.user.name || '-',
              sekretaris: pembimbing1?.dosen?.user?.name || '-',
              anggota1: pengujiData.anggota1?.user.name || '-',
              anggota2: pengujiData.anggota2?.user.name || '-',
              hari_tanggal: `${hari}, ${tanggalStr}`,
              pukul: `${slot.waktu_mulai} - ${slot.waktu_selesai}`,
            });

            console.log('[BACKEND] ✅ Mahasiswa scheduled:', sidang.tugasAkhir.mahasiswa.nim);
            scheduled = true;
            break;
          } else {
            console.log('[BACKEND] ⚠️ Not enough dosen for this slot');
          }
        }
      }

      if (!scheduled) {
        console.error('[BACKEND] ❌ Failed to schedule:', sidang.tugasAkhir.mahasiswa.nim);
        throw new Error(
          `Gagal menjadwalkan mahasiswa ${sidang.tugasAkhir.mahasiswa.user.name} (${sidang.tugasAkhir.mahasiswa.nim}). Tidak ada slot atau dosen tersedia dalam 30 hari ke depan. Periksa: (1) Jumlah ruangan, (2) Ketersediaan dosen, (3) Kuota dosen, (4) Hari libur.`
        );
      }
    }

    console.log('[BACKEND] 🎉 All mahasiswa scheduled successfully!');
    console.log('[BACKEND] 📊 Total results:', results.length);
    return results;
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
    return await prisma.jadwalSidang.findMany({
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
      orderBy: [{ tanggal: 'asc' }, { waktu_mulai: 'asc' }],
    });
  }
}
