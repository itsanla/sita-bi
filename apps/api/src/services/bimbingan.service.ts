import type { Prisma } from '@repo/db';
import { PrismaClient, StatusTugasAkhir } from '@repo/db';

// Interface untuk return types
interface BimbinganForDosen {
  data: unknown[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TugasAkhirWithBimbingan {
  id: number;
  mahasiswa_id: number;
  status: string;
  peranDosenTa: unknown[];
  bimbinganTa: unknown[];
  pendaftaranSidang: unknown[];
}

export class BimbinganService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private async logActivity(
    userId: number, // Can be null if system?
    action: string,
    url?: string,
    method?: string,
  ): Promise<void> {
    try {
      await this.prisma.log.create({
        data: {
          user_id: userId,
          action,
          url: url ?? null, // Fix undefined
          method: method ?? null, // Fix undefined
          ip_address: '127.0.0.1', // Placeholder
          user_agent: 'System', // Placeholder
        },
      });
    } catch (error) {
      console.error('Failed to create log:', error);
    }
  }

  async getBimbinganForDosen(
    dosenId: number,
    page = 1,
    limit = 50,
  ): Promise<BimbinganForDosen> {
    const whereClause: Prisma.TugasAkhirWhereInput = {
      peranDosenTa: {
        some: {
          dosen_id: dosenId,
          peran: { in: ['pembimbing1', 'pembimbing2'] },
        },
      },
      NOT: {
        status: {
          in: [
            StatusTugasAkhir.DIBATALKAN,
            StatusTugasAkhir.LULUS_DENGAN_REVISI,
            StatusTugasAkhir.LULUS_TANPA_REVISI,
            StatusTugasAkhir.SELESAI,
            StatusTugasAkhir.DITOLAK,
          ],
        },
      },
    };

    const total = await this.prisma.tugasAkhir.count({ where: whereClause });
    const data = await this.prisma.tugasAkhir.findMany({
      where: whereClause,
      include: {
        mahasiswa: { include: { user: true } },
        bimbinganTa: { orderBy: { created_at: 'desc' } },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBimbinganForMahasiswa(
    mahasiswaId: number,
  ): Promise<TugasAkhirWithBimbingan | null> {
    const tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: {
        mahasiswa_id: mahasiswaId,
        NOT: {
          status: {
            in: [
              StatusTugasAkhir.DIBATALKAN,
              StatusTugasAkhir.LULUS_DENGAN_REVISI,
              StatusTugasAkhir.LULUS_TANPA_REVISI,
              StatusTugasAkhir.SELESAI,
              StatusTugasAkhir.DITOLAK,
            ],
          },
        },
      },
      include: {
        peranDosenTa: { include: { dosen: { include: { user: true } } } },
        bimbinganTa: {
          include: {
            catatan: { include: { author: true } },
            historyPerubahan: true,
          },
          orderBy: { created_at: 'desc' },
        },
        pendaftaranSidang: { orderBy: { created_at: 'desc' } },
      },
    });

    if (tugasAkhir === null) {
      return null;
    }

    return tugasAkhir as TugasAkhirWithBimbingan;
  }

  async createCatatan(
    bimbinganTaId: number,
    authorId: number,
    catatan: string,
  ): Promise<unknown> {
    const bimbingan = await this.prisma.bimbinganTA.findUnique({
      where: { id: bimbinganTaId },
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: { include: { user: true } },
            peranDosenTa: true,
          },
        },
      },
    });

    if (bimbingan === null) {
      throw new Error('Bimbingan session not found');
    }

    const isMahasiswa = bimbingan.tugasAkhir.mahasiswa.user.id === authorId;
    const peranDosenList = bimbingan.tugasAkhir.peranDosenTa as {
      dosen_id: number | null;
    }[];

    const isPembimbing = peranDosenList.some(
      (p) => p.dosen_id === bimbingan.dosen_id,
    );

    if (!(isMahasiswa || isPembimbing)) {
      throw new Error(
        'You are not authorized to add a catatan to this bimbingan session.',
      );
    }

    const newCatatan = await this.prisma.catatanBimbingan.create({
      data: {
        bimbingan_ta_id: bimbinganTaId,
        author_id: authorId,
        catatan: catatan,
        author_type: 'user',
      },
    });

    // Log
    await this.logActivity(
      authorId,
      `Menambahkan catatan pada bimbingan ID ${bimbinganTaId}: "${catatan.substring(0, 50)}..."`,
    );

    return newCatatan;
  }

  async detectScheduleConflicts(
    dosenId: number,
    tanggal: Date,
    jam: string,
    durationMinutes = 60,
  ): Promise<boolean> {
    const startTime = this.timeStringToMinutes(jam);
    const endTime = startTime + durationMinutes;

    const bimbinganConflicts = await this.prisma.bimbinganTA.findMany({
      where: {
        dosen_id: dosenId,
        tanggal_bimbingan: tanggal,
        status_bimbingan: 'dijadwalkan',
      },
    });

    for (const bimbingan of bimbinganConflicts) {
      if (bimbingan.jam_bimbingan != null) {
        const bStart = this.timeStringToMinutes(bimbingan.jam_bimbingan);
        const bEnd = bStart + 60;
        if (this.isOverlap(startTime, endTime, bStart, bEnd)) {
          return true;
        }
      }
    }

    const sidangConflicts = await this.prisma.jadwalSidang.findMany({
      where: {
        tanggal: tanggal,
        sidang: {
          tugasAkhir: {
            peranDosenTa: {
              some: {
                dosen_id: dosenId,
              },
            },
          },
        },
      },
    });

    for (const jadwal of sidangConflicts) {
      const jStart = this.timeStringToMinutes(jadwal.waktu_mulai);
      const jEnd = this.timeStringToMinutes(jadwal.waktu_selesai);
      if (this.isOverlap(startTime, endTime, jStart, jEnd)) {
        return true;
      }
    }

    return false;
  }

  async suggestAvailableSlots(
    dosenId: number,
    tanggalStr: string,
  ): Promise<string[]> {
    const tanggal = new Date(tanggalStr);
    const workingStart = 8 * 60;
    const workingEnd = 16 * 60;
    const slotDuration = 60;

    const busyIntervals: { start: number; end: number }[] = [];

    const bimbingan = await this.prisma.bimbinganTA.findMany({
      where: {
        dosen_id: dosenId,
        tanggal_bimbingan: tanggal,
        status_bimbingan: 'dijadwalkan',
      },
    });

    for (const b of bimbingan) {
      if (b.jam_bimbingan != null) {
        const start = this.timeStringToMinutes(b.jam_bimbingan);
        busyIntervals.push({ start, end: start + 60 });
      }
    }

    const sidangs = await this.prisma.jadwalSidang.findMany({
      where: {
        tanggal: tanggal,
        sidang: {
          tugasAkhir: {
            peranDosenTa: {
              some: {
                dosen_id: dosenId,
              },
            },
          },
        },
      },
    });

    for (const s of sidangs) {
      busyIntervals.push({
        start: this.timeStringToMinutes(s.waktu_mulai),
        end: this.timeStringToMinutes(s.waktu_selesai),
      });
    }

    busyIntervals.sort((a, b) => a.start - b.start);

    const mergedIntervals: { start: number; end: number }[] = [];
    for (const interval of busyIntervals) {
      const lastInterval = mergedIntervals[mergedIntervals.length - 1];
      if (lastInterval === undefined || lastInterval.end < interval.start) {
        mergedIntervals.push(interval);
      } else {
        lastInterval.end = Math.max(lastInterval.end, interval.end);
      }
    }

    const availableSlots: string[] = [];
    let currentPointer = workingStart;

    for (const interval of mergedIntervals) {
      while (currentPointer + slotDuration <= interval.start) {
        availableSlots.push(this.minutesToTimeString(currentPointer));
        currentPointer += slotDuration;
      }
      currentPointer = Math.max(currentPointer, interval.end);
    }

    while (currentPointer + slotDuration <= workingEnd) {
      availableSlots.push(this.minutesToTimeString(currentPointer));
      currentPointer += slotDuration;
    }

    return availableSlots;
  }

  private timeStringToMinutes(time: string): number {
    if (typeof time !== 'string') {
      return 0;
    }
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    const h = Number.isNaN(hours) ? 0 : hours;
    const m = Number.isNaN(minutes) ? 0 : minutes;

    return h * 60 + m;
  }

  private minutesToTimeString(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private isOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ): boolean {
    // Use strict inequality to allow abutting intervals (e.g. 10:00-11:00 and 11:00-12:00 are compatible)
    return start1 < end2 && start2 < end1;
  }

  async setJadwal(
    tugasAkhirId: number,
    dosenId: number,
    tanggal: string,
    jam: string,
  ): Promise<unknown> {
    // Use user_id for logging, but we only have dosenId (which is Dosen ID, not User ID)
    // We need to fetch user_id from dosen
    const dosen = await this.prisma.dosen.findUnique({
      where: { id: dosenId },
    });

    const userId = dosen?.user_id ?? 0;

    return this.prisma
      .$transaction(async (tx: Prisma.TransactionClient) => {
        const peranDosen = await tx.peranDosenTa.findFirst({
          where: { tugas_akhir_id: tugasAkhirId, dosen_id: dosenId },
          include: {
            tugasAkhir: {
              include: {
                mahasiswa: true,
              },
            },
          },
        });

        if (
          peranDosen?.peran == null ||
          peranDosen.peran.startsWith('pembimbing') === false
        ) {
          throw new Error('You are not a supervisor for this final project.');
        }

        const tanggalDate = new Date(tanggal);
        const startTime = this.timeStringToMinutes(jam);
        const endTime = startTime + 60;

        const conflicts = await tx.bimbinganTA.findMany({
          where: {
            dosen_id: dosenId,
            tanggal_bimbingan: tanggalDate,
            status_bimbingan: 'dijadwalkan',
          },
        });

        for (const c of conflicts) {
          if (c.jam_bimbingan != null) {
            const cStart = this.timeStringToMinutes(c.jam_bimbingan);
            const cEnd = cStart + 60;
            if (cStart < endTime && startTime < cEnd) {
              throw new Error(
                `Jadwal konflik dengan bimbingan lain pada jam ${c.jam_bimbingan}`,
              );
            }
          }
        }

        const sidangConflicts = await tx.jadwalSidang.findMany({
          where: {
            tanggal: tanggalDate,
            sidang: {
              tugasAkhir: {
                peranDosenTa: {
                  some: {
                    dosen_id: dosenId,
                  },
                },
              },
            },
          },
        });

        for (const s of sidangConflicts) {
          const sStart = this.timeStringToMinutes(s.waktu_mulai);
          const sEnd = this.timeStringToMinutes(s.waktu_selesai);
          if (sStart < endTime && startTime < sEnd) {
            throw new Error(
              `Jadwal konflik dengan sidang pada jam ${s.waktu_mulai} - ${s.waktu_selesai}`,
            );
          }
        }

        const bimbingan = await tx.bimbinganTA.create({
          data: {
            tugas_akhir_id: tugasAkhirId,
            dosen_id: dosenId,
            peran: peranDosen.peran,
            tanggal_bimbingan: tanggalDate,
            jam_bimbingan: jam,
            status_bimbingan: 'dijadwalkan',
          },
        });

        return bimbingan;
      })
      .then(async (res) => {
        await this.logActivity(
          userId,
          `Menjadwalkan bimbingan baru untuk TA ID ${tugasAkhirId} pada ${tanggal} ${jam}`,
        );
        return res;
      });
  }

  async rescheduleBimbingan(
    bimbinganId: number,
    mahasiswaUserId: number,
    newTanggal: string,
    newJam: string,
    alasan: string,
  ): Promise<unknown> {
    return this.prisma
      .$transaction(async (tx: Prisma.TransactionClient) => {
        const mahasiswa = await tx.mahasiswa.findUnique({
          where: { user_id: mahasiswaUserId },
        });
        if (mahasiswa === null) throw new Error('Mahasiswa not found');

        const bimbingan = await tx.bimbinganTA.findUnique({
          where: { id: bimbinganId },
        });

        if (bimbingan === null) throw new Error('Bimbingan not found');

        await tx.historyPerubahanJadwal.create({
          data: {
            bimbingan_ta_id: bimbinganId,
            mahasiswa_id: mahasiswa.id,
            tanggal_lama: bimbingan.tanggal_bimbingan,
            jam_lama: bimbingan.jam_bimbingan,
            tanggal_baru: new Date(newTanggal),
            jam_baru: newJam,
            alasan_perubahan: alasan,
            status: 'diajukan',
          },
        });

        return tx.bimbinganTA.update({
          where: { id: bimbinganId },
          data: {
            tanggal_bimbingan: new Date(newTanggal),
            jam_bimbingan: newJam,
            status_bimbingan: 'dijadwalkan',
          },
        });
      })
      .then(async (res) => {
        await this.logActivity(
          mahasiswaUserId,
          `Mengajukan perubahan jadwal bimbingan ID ${bimbinganId} ke ${newTanggal} ${newJam}`,
        );
        return res;
      });
  }

  async cancelBimbingan(
    bimbinganId: number,
    dosenId: number,
  ): Promise<unknown> {
    // Get user_id from dosenId
    const dosen = await this.prisma.dosen.findUnique({
      where: { id: dosenId },
    });
    const userId = dosen?.user_id ?? 0;

    return this.prisma
      .$transaction(async (tx: Prisma.TransactionClient) => {
        const bimbingan = await tx.bimbinganTA.findFirst({});
        if (bimbingan === null) {
          throw new Error(
            'Supervision session not found or you are not authorized to modify it.',
          );
        }

        return tx.bimbinganTA.update({
          where: { id: bimbinganId },
          data: { status_bimbingan: 'dibatalkan' },
        });
      })
      .then(async (res) => {
        await this.logActivity(
          userId,
          `Membatalkan sesi bimbingan ID ${bimbinganId}`,
        );
        return res;
      });
  }

  async selesaikanSesi(bimbinganId: number, dosenId: number): Promise<unknown> {
    // Get user_id from dosenId
    const dosen = await this.prisma.dosen.findUnique({
      where: { id: dosenId },
    });
    const userId = dosen?.user_id ?? 0;

    return this.prisma
      .$transaction(async (tx: Prisma.TransactionClient) => {
        const bimbingan = await tx.bimbinganTA.findFirst({
          where: { id: bimbinganId, dosen_id: dosenId },
          include: { tugasAkhir: true },
        });

        if (bimbingan === null) {
          throw new Error(
            'Supervision session not found or you are not authorized to modify it.',
          );
        }

        if (bimbingan.status_bimbingan !== 'dijadwalkan') {
          throw new Error('Only a "dijadwalkan" session can be completed.');
        }

        const updatedBimbingan = await tx.bimbinganTA.update({
          where: { id: bimbinganId },
          data: { status_bimbingan: 'selesai' },
        });

        const dokumenTerkait = await tx.dokumenTa.findFirst({
          where: { tugas_akhir_id: bimbingan.tugas_akhir_id },
          orderBy: { version: 'desc' },
        });

        if (dokumenTerkait === null) {
          return updatedBimbingan;
        }

        const peranDosen = await tx.peranDosenTa.findFirst({
          where: {
            tugas_akhir_id: bimbingan.tugasAkhir.id,
            dosen_id: dosenId,
          },
        });

        if (peranDosen !== null) {
          const updateData: Prisma.DokumenTaUpdateInput = {};
          if (peranDosen.peran === 'pembimbing1') {
            updateData.validatorP1 = { connect: { id: dosenId } };
          } else if (peranDosen.peran === 'pembimbing2') {
            updateData.validatorP2 = { connect: { id: dosenId } };
          }

          if (Object.keys(updateData).length > 0) {
            const updatedDokumen = await tx.dokumenTa.update({
              where: { id: dokumenTerkait.id },
              data: updateData,
            });

            if (
              updatedDokumen.divalidasi_oleh_p1 !== null &&
              updatedDokumen.divalidasi_oleh_p2 !== null
            ) {
              await tx.dokumenTa.update({
                where: { id: updatedDokumen.id },
                data: { status_validasi: 'disetujui' },
              });
            }
          }
        }

        return updatedBimbingan;
      })
      .then(async (res) => {
        await this.logActivity(
          userId,
          `Menyelesaikan sesi bimbingan ID ${bimbinganId}`,
        );
        return res;
      });
  }

  async addLampiran(
    bimbinganTaId: number,
    filePath: string,
    fileName: string,
    fileType: string,
  ): Promise<unknown> {
    return this.prisma.bimbinganLampiran.create({
      data: {
        bimbingan_ta_id: bimbinganTaId,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType,
      },
    });
  }

  async konfirmasiBimbingan(bimbinganTaId: number): Promise<unknown> {
    const bimbingan = await this.prisma.bimbinganTA.findUnique({
      where: { id: bimbinganTaId },
    });

    if (bimbingan === null) {
      throw new Error('Bimbingan not found');
    }

    // Logic to ensure only the assigned dosen can confirm is checked in controller/router via authorizeRoles or check there.
    // Ideally we pass dosenId here to verify ownership if not already done.

    return this.prisma.bimbinganTA.update({
      where: { id: bimbinganTaId },
      data: {
        is_konfirmasi: true,
        konfirmasi_at: new Date(),
      },
    });
  }
}
