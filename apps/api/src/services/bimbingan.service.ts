import type { Prisma } from '@repo/db';
import { PrismaClient } from '@repo/db';
import { BimbinganRepository } from '../repositories/bimbingan.repository';
import {
  NotFoundError,
  UnauthorizedError,
  ConflictError,
} from '../errors/AppError';
import { getMinBimbinganValid } from '../utils/business-rules';
import { getAturanValidasi, isDrafValid } from '../utils/aturan-validasi';

interface BimbinganForDosen {
  data: {
    id: number;
    judul: string;
    status: string;
    mahasiswa: {
      id: number;
      user: { id: number; name: string; email: string };
    };
    bimbinganTa: {
      id: number;
      status_bimbingan: string;
      tanggal_bimbingan: Date | null;
      jam_bimbingan: string | null;
    }[];
  }[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TugasAkhirWithBimbingan {
  id: number;
  mahasiswa_id: number;
  status: string;
  peranDosenTa: {
    id: number;
    peran: string;
    dosen: { id: number; user: { name: string } };
  }[];
  bimbinganTa: {
    id: number;
    status_bimbingan: string;
    tanggal_bimbingan: Date | null;
    jam_bimbingan: string | null;
    catatan: unknown[];
    lampiran: unknown[];
    historyPerubahan: unknown[];
  }[];
  pendaftaranSidang: unknown[];
}

const ERROR_MSG_DOSEN_NOT_FOUND = 'Dosen tidak ditemukan';
const ERROR_MSG_SESI_NOT_FOUND = 'Sesi bimbingan tidak ditemukan';
const ERROR_MSG_TA_NOT_FOUND = 'Tugas Akhir tidak ditemukan';
const ERROR_MSG_PEMBIMBING_NOT_ASSIGNED = 'Pembimbing belum ditugaskan';
const ERROR_MSG_NO_ACCESS =
  'Sesi bimbingan tidak ditemukan atau Anda tidak memiliki akses';

export class BimbinganService {
  private repository: BimbinganRepository;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.repository = new BimbinganRepository(this.prisma);
  }

  private async logActivity(
    userId: number,
    action: string,
    url?: string,
    method?: string,
  ): Promise<void> {
    try {
      const logData: {
        user_id: number;
        action: string;
        url?: string;
        method?: string;
      } = {
        user_id: userId,
        action,
      };
      if (url !== undefined && url !== '') logData.url = url;
      if (method !== undefined && method !== '') logData.method = method;
      await this.repository.createLog(logData);
    } catch (error) {
      console.error('Failed to create log:', error);
    }
  }

  async getBimbinganForDosen(
    dosenId: number,
    page = 1,
    limit = 20,
  ): Promise<BimbinganForDosen> {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    const { data, total } = await this.repository.findTugasAkhirForDosen(
      dosenId,
      validPage,
      validLimit,
    );

    return {
      data,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async getBimbinganForMahasiswa(
    mahasiswaId: number,
  ): Promise<TugasAkhirWithBimbingan | null> {
    const tugasAkhir =
      await this.repository.findTugasAkhirForMahasiswa(mahasiswaId);

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
    const bimbingan = await this.repository.findBimbinganById(bimbinganTaId);

    if (bimbingan === null || typeof bimbingan !== 'object') {
      throw new NotFoundError(ERROR_MSG_SESI_NOT_FOUND);
    }

    const isMahasiswa = bimbingan.tugasAkhir.mahasiswa.user.id === authorId;
    const peranDosenList = bimbingan.tugasAkhir.peranDosenTa as {
      dosen_id: number | null;
    }[];

    const isPembimbing = peranDosenList.some(
      (p) => p.dosen_id === bimbingan.dosen_id,
    );

    if (!isMahasiswa && !isPembimbing) {
      throw new UnauthorizedError(
        'Anda tidak memiliki akses untuk menambahkan catatan pada sesi bimbingan ini',
      );
    }

    const sanitizedCatatan = catatan.trim();
    const newCatatan = await this.repository.createCatatan(
      bimbinganTaId,
      authorId,
      sanitizedCatatan,
    );

    await this.logActivity(
      authorId,
      `Menambahkan catatan pada bimbingan ID ${bimbinganTaId}: "${sanitizedCatatan.substring(0, 50)}..."`,
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

    const [bimbinganConflicts, sidangConflicts] = await Promise.all([
      this.repository.findBimbinganConflicts(dosenId, tanggal),
      this.repository.findSidangConflicts(dosenId, tanggal),
    ]);

    for (const bimbingan of bimbinganConflicts) {
      if (bimbingan.jam_bimbingan !== null && bimbingan.jam_bimbingan !== '') {
        const bStart = this.timeStringToMinutes(bimbingan.jam_bimbingan);
        const bEnd = bStart + 60;
        if (this.isOverlap(startTime, endTime, bStart, bEnd)) {
          return true;
        }
      }
    }

    for (const jadwal of sidangConflicts) {
      const jStart = this.timeStringToMinutes(jadwal.waktu_mulai);
      const jEnd = this.timeStringToMinutes(jadwal.waktu_selesai);
      if (this.isOverlap(startTime, endTime, jStart, jEnd)) {
        return true;
      }
    }

    return false;
  }

  async detectScheduleConflictsExcluding(
    dosenId: number,
    tanggal: Date,
    jam: string,
    excludeBimbinganId: number,
    durationMinutes = 60,
  ): Promise<boolean> {
    const startTime = this.timeStringToMinutes(jam);
    const endTime = startTime + durationMinutes;

    const [bimbinganConflicts, sidangConflicts] = await Promise.all([
      this.repository.findBimbinganConflicts(dosenId, tanggal),
      this.repository.findSidangConflicts(dosenId, tanggal),
    ]);

    for (const bimbingan of bimbinganConflicts) {
      // Skip sesi yang sedang diubah
      if ('id' in bimbingan && bimbingan.id === excludeBimbinganId) {
        continue;
      }
      
      if (bimbingan.jam_bimbingan !== null && bimbingan.jam_bimbingan !== '') {
        const bStart = this.timeStringToMinutes(bimbingan.jam_bimbingan);
        const bEnd = bStart + 60;
        if (this.isOverlap(startTime, endTime, bStart, bEnd)) {
          return true;
        }
      }
    }

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

    const [bimbingan, sidangs] = await Promise.all([
      this.repository.findBimbinganConflicts(dosenId, tanggal),
      this.repository.findSidangConflicts(dosenId, tanggal),
    ]);

    for (const b of bimbingan) {
      if (b.jam_bimbingan !== null && b.jam_bimbingan !== '') {
        const start = this.timeStringToMinutes(b.jam_bimbingan);
        busyIntervals.push({ start, end: start + 60 });
      }
    }

    for (const s of sidangs) {
      const hasValidWaktu =
        typeof s.waktu_mulai === 'string' &&
        s.waktu_mulai !== '' &&
        typeof s.waktu_selesai === 'string' &&
        s.waktu_selesai !== '';

      if (hasValidWaktu) {
        busyIntervals.push({
          start: this.timeStringToMinutes(s.waktu_mulai),
          end: this.timeStringToMinutes(s.waktu_selesai),
        });
      }
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
    if (typeof time !== 'string' || time === '') {
      return 0;
    }
    const parts = time.split(':');
    const hours = parseInt(parts[0] ?? '0', 10);
    const minutes = parseInt(parts[1] ?? '0', 10);

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
    const dosen = await this.repository.findDosenByUserId(dosenId);
    if (dosen === null || typeof dosen !== 'object' || !('user_id' in dosen)) {
      throw new NotFoundError(ERROR_MSG_DOSEN_NOT_FOUND);
    }
    const userId = dosen.user_id as number;

    return this.prisma
      .$transaction(async (tx: Prisma.TransactionClient) => {
        const peranDosen = await this.repository.findPeranDosenTa(
          tugasAkhirId,
          dosenId,
        );

        const hasValidPeran =
          peranDosen !== null &&
          typeof peranDosen === 'object' &&
          'peran' in peranDosen &&
          typeof peranDosen.peran === 'string' &&
          peranDosen.peran.startsWith('pembimbing');

        if (!hasValidPeran) {
          throw new UnauthorizedError(
            'Anda bukan pembimbing untuk tugas akhir ini',
          );
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
          if (c.jam_bimbingan !== null && c.jam_bimbingan !== '') {
            const cStart = this.timeStringToMinutes(c.jam_bimbingan);
            const cEnd = cStart + 60;
            if (cStart < endTime && startTime < cEnd) {
              throw new ConflictError(
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
          const hasValidWaktuSidang =
            typeof s.waktu_mulai === 'string' &&
            s.waktu_mulai !== '' &&
            typeof s.waktu_selesai === 'string' &&
            s.waktu_selesai !== '';

          if (hasValidWaktuSidang) {
            const sStart = this.timeStringToMinutes(s.waktu_mulai);
            const sEnd = this.timeStringToMinutes(s.waktu_selesai);
            if (sStart < endTime && startTime < sEnd) {
              throw new ConflictError(
                `Jadwal konflik dengan sidang pada jam ${s.waktu_mulai} - ${s.waktu_selesai}`,
              );
            }
          }
        }

        // Get next sesi_ke number
        const existingCount = await tx.bimbinganTA.count({
          where: { tugas_akhir_id: tugasAkhirId },
        });
        
        const bimbingan = await tx.bimbinganTA.create({
          data: {
            tugas_akhir_id: tugasAkhirId,
            dosen_id: dosenId,
            peran: peranDosen.peran,
            tanggal_bimbingan: tanggalDate,
            jam_bimbingan: jam,
            status_bimbingan: 'dijadwalkan',
            sesi_ke: existingCount + 1,
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
        if (!mahasiswa) throw new NotFoundError('Mahasiswa tidak ditemukan');

        const bimbingan = await tx.bimbinganTA.findUnique({
          where: { id: bimbinganId },
        });

        if (!bimbingan) throw new NotFoundError(ERROR_MSG_SESI_NOT_FOUND);

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
    const dosen = await this.repository.findDosenByUserId(dosenId);
    if (dosen === null || typeof dosen !== 'object' || !('user_id' in dosen)) {
      throw new NotFoundError(ERROR_MSG_DOSEN_NOT_FOUND);
    }
    const userId = dosen.user_id as number;

    const bimbingan = await this.repository.findBimbinganByIdAndDosen(
      bimbinganId,
      dosenId,
    );

    if (bimbingan === null || typeof bimbingan !== 'object') {
      throw new NotFoundError(ERROR_MSG_NO_ACCESS);
    }

    const result = await this.repository.updateBimbinganStatus(
      bimbinganId,
      'dibatalkan',
    );

    await this.logActivity(
      userId,
      `Membatalkan sesi bimbingan ID ${bimbinganId}`,
    );

    return result;
  }

  async selesaikanSesi(bimbinganId: number, dosenId: number): Promise<unknown> {
    const dosen = await this.repository.findDosenByUserId(dosenId);
    if (dosen === null || typeof dosen !== 'object' || !('user_id' in dosen)) {
      throw new NotFoundError(ERROR_MSG_DOSEN_NOT_FOUND);
    }
    const userId = dosen.user_id as number;

    return this.prisma
      .$transaction(async (tx: Prisma.TransactionClient) => {
        const bimbingan = await this.repository.findBimbinganByIdAndDosen(
          bimbinganId,
          dosenId,
        );

        if (bimbingan === null || typeof bimbingan !== 'object') {
          throw new NotFoundError(ERROR_MSG_NO_ACCESS);
        }

        // Validasi bahwa dosen yang menyelesaikan adalah dosen yang sesuai dengan peran sesi
        if ('peran' in bimbingan && 'tugas_akhir_id' in bimbingan) {
          const tugasAkhir = await tx.tugasAkhir.findUnique({
            where: { id: bimbingan.tugas_akhir_id as number },
            include: { peranDosenTa: true },
          });
          
          if (tugasAkhir) {
            const peranDosen = tugasAkhir.peranDosenTa.find(
              (p) => p.dosen_id === dosenId && p.peran === bimbingan.peran
            );
            
            if (!peranDosen) {
              throw new UnauthorizedError(
                `Hanya ${bimbingan.peran} yang dapat menyelesaikan sesi bimbingan ini`
              );
            }
          }
        }

        if (bimbingan.status_bimbingan !== 'dijadwalkan') {
          throw new ConflictError(
            'Hanya sesi dengan status "dijadwalkan" yang dapat diselesaikan',
          );
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

            const isValidatedByBoth =
              updatedDokumen.divalidasi_oleh_p1 !== null &&
              updatedDokumen.divalidasi_oleh_p2 !== null;

            if (isValidatedByBoth) {
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
    const bimbingan = await this.repository.findBimbinganById(bimbinganTaId);
    if (bimbingan === null || typeof bimbingan !== 'object') {
      throw new NotFoundError(ERROR_MSG_SESI_NOT_FOUND);
    }

    return this.repository.createLampiran({
      bimbingan_ta_id: bimbinganTaId,
      file_path: filePath,
      file_name: fileName,
      file_type: fileType,
    });
  }

  async addMultipleLampiran(
    bimbinganTaId: number,
    files: { path: string; name: string; type: string }[],
  ): Promise<unknown[]> {
    const bimbingan = await this.repository.findBimbinganById(bimbinganTaId);
    if (bimbingan === null || typeof bimbingan !== 'object') {
      throw new NotFoundError(ERROR_MSG_SESI_NOT_FOUND);
    }

    const results = [];
    for (const file of files) {
      const result = await this.repository.createLampiran({
        bimbingan_ta_id: bimbinganTaId,
        file_path: file.path,
        file_name: file.name,
        file_type: file.type,
      });
      results.push(result);
    }
    return results;
  }

  async konfirmasiBimbingan(bimbinganTaId: number): Promise<unknown> {
    const bimbingan = await this.repository.findBimbinganById(bimbinganTaId);

    if (bimbingan === null) {
      throw new NotFoundError('Bimbingan not found');
    }

    return this.repository.konfirmasiBimbingan(bimbinganTaId);
  }

  async initializeEmptySessions(tugasAkhirId: number): Promise<void> {
    const tugasAkhir = await this.prisma.tugasAkhir.findUnique({
      where: { id: tugasAkhirId },
      include: { peranDosenTa: true },
    });

    if (tugasAkhir === null) {
      throw new NotFoundError(ERROR_MSG_TA_NOT_FOUND);
    }

    const pembimbing1 = tugasAkhir.peranDosenTa.find(
      (p) => p.peran === 'pembimbing1',
    );

    if (pembimbing1 === undefined) {
      return;
    }

    const existingCount =
      await this.repository.countBimbinganByTugasAkhir(tugasAkhirId);
    if (existingCount > 0) {
      return;
    }

    const minBimbingan = await getMinBimbinganValid();
    for (let i = 1; i <= minBimbingan; i++) {
      await this.repository.createEmptySesi(
        tugasAkhirId,
        pembimbing1.dosen_id,
        'pembimbing1',
        i,
      );
    }
  }

  async createEmptySesi(
    tugasAkhirId: number,
    userId: number,
    pembimbingPeran: 'pembimbing1' | 'pembimbing2',
  ): Promise<unknown> {
    const tugasAkhir = await this.prisma.tugasAkhir.findUnique({
      where: { id: tugasAkhirId },
      include: {
        mahasiswa: true,
        peranDosenTa: { include: { dosen: true } },
      },
    });

    if (tugasAkhir === null) {
      throw new NotFoundError(ERROR_MSG_TA_NOT_FOUND);
    }

    const isMahasiswa = tugasAkhir.mahasiswa.user_id === userId;
    const pembimbing = tugasAkhir.peranDosenTa.find(
      (p) =>
        p.dosen.user_id === userId &&
        (p.peran === 'pembimbing1' || p.peran === 'pembimbing2'),
    );

    if (!isMahasiswa && pembimbing === undefined) {
      throw new UnauthorizedError(
        'Anda tidak memiliki akses untuk membuat sesi bimbingan',
      );
    }

    const currentCount =
      await this.repository.countBimbinganByTugasAkhir(tugasAkhirId);
    const nextSesi = currentCount + 1;

    const dosenPembimbing = tugasAkhir.peranDosenTa.find(
      (p) => p.peran === pembimbingPeran,
    );

    if (dosenPembimbing === undefined) {
      throw new NotFoundError(`${pembimbingPeran} belum ditugaskan`);
    }

    const newSesi = await this.repository.createEmptySesi(
      tugasAkhirId,
      dosenPembimbing.dosen_id,
      dosenPembimbing.peran,
      nextSesi,
    );

    await this.logActivity(
      userId,
      `Membuat sesi bimbingan ke-${nextSesi} dengan ${pembimbingPeran} untuk TA ID ${tugasAkhirId}`,
    );

    return newSesi;
  }

  async setJadwalSesi(
    bimbinganId: number,
    userId: number,
    tanggal: string,
    jamMulai: string,
    jamSelesai?: string,
  ): Promise<unknown> {
    const bimbingan = await this.repository.findBimbinganWithAccess(
      bimbinganId,
      userId,
    );

    if (
      bimbingan === null ||
      typeof bimbingan !== 'object' ||
      !('dosen_id' in bimbingan)
    ) {
      throw new NotFoundError(ERROR_MSG_NO_ACCESS);
    }

    const tanggalDate = new Date(tanggal);
    const dosenId = bimbingan.dosen_id as number;

    const hasConflict = await this.detectScheduleConflictsExcluding(
      dosenId,
      tanggalDate,
      jamMulai,
      bimbinganId,
    );
    if (hasConflict) {
      throw new ConflictError(
        'Jadwal konflik dengan bimbingan atau sidang lain',
      );
    }

    const updated = await this.repository.updateJadwalBimbingan(
      bimbinganId,
      tanggalDate,
      jamMulai,
      jamSelesai,
    );

    await this.logActivity(
      userId,
      `Set jadwal bimbingan ID ${bimbinganId} pada ${tanggal} ${jamMulai}`,
    );

    return updated;
  }

  async konfirmasiSelesai(
    bimbinganId: number,
    dosenUserId: number,
  ): Promise<unknown> {
    const dosen = await this.repository.findDosenByUserId(dosenUserId);
    if (dosen === null || typeof dosen !== 'object' || !('id' in dosen)) {
      throw new NotFoundError(ERROR_MSG_DOSEN_NOT_FOUND);
    }

    const bimbingan = await this.repository.findBimbinganByIdAndDosen(
      bimbinganId,
      dosen.id as number,
    );
    if (bimbingan === null || typeof bimbingan !== 'object') {
      throw new NotFoundError(ERROR_MSG_NO_ACCESS);
    }

    // Validasi bahwa dosen yang mengkonfirmasi adalah dosen yang sesuai dengan peran sesi
    if ('peran' in bimbingan && 'dosen_id' in bimbingan) {
      const tugasAkhir = await this.prisma.tugasAkhir.findUnique({
        where: { id: bimbingan.tugas_akhir_id as number },
        include: { peranDosenTa: true },
      });
      
      if (tugasAkhir) {
        const peranDosen = tugasAkhir.peranDosenTa.find(
          (p) => p.dosen_id === (dosen.id as number) && p.peran === bimbingan.peran
        );
        
        if (!peranDosen) {
          throw new UnauthorizedError(
            `Hanya ${bimbingan.peran} yang dapat memvalidasi sesi bimbingan ini`
          );
        }
      }
    }

    const hasTanggal =
      'tanggal_bimbingan' in bimbingan && bimbingan.tanggal_bimbingan !== null;
    const hasJam =
      'jam_bimbingan' in bimbingan &&
      bimbingan.jam_bimbingan !== null &&
      bimbingan.jam_bimbingan !== '';

    if (!hasTanggal || !hasJam) {
      throw new ConflictError('Sesi belum dijadwalkan');
    }

    const result = await this.repository.updateBimbinganStatus(
      bimbinganId,
      'selesai',
    );
    await this.logActivity(
      dosenUserId,
      `Konfirmasi selesai bimbingan ID ${bimbinganId}`,
    );

    return result;
  }

  async deleteSesi(bimbinganId: number, userId: number): Promise<void> {
    const bimbingan = await this.repository.findBimbinganWithAccess(
      bimbinganId,
      userId,
    );

    if (bimbingan === null || typeof bimbingan !== 'object') {
      throw new NotFoundError(ERROR_MSG_NO_ACCESS);
    }

    const isSelesai =
      'status_bimbingan' in bimbingan &&
      bimbingan.status_bimbingan === 'selesai';

    if (isSelesai) {
      throw new ConflictError('Tidak dapat menghapus sesi yang sudah selesai');
    }

    await this.repository.deleteBimbinganSesi(bimbinganId);
    await this.logActivity(
      userId,
      `Menghapus sesi bimbingan ID ${bimbinganId}`,
    );
  }

  async checkSidangEligibility(tugasAkhirId: number): Promise<{
    eligible: boolean;
    validBimbinganCount: number;
    isDrafValidated: boolean;
    minRequired: number;
    message?: string;
  }> {
    const minRequired = await getMinBimbinganValid();
    const validBimbinganCount =
      await this.repository.countValidBimbingan(tugasAkhirId);

    const latestDokumen =
      await this.repository.findLatestDokumenTa(tugasAkhirId);

    const aturanValidasi = await getAturanValidasi();
    const isDrafValidated =
      latestDokumen !== null &&
      typeof latestDokumen === 'object' &&
      'divalidasi_oleh_p1' in latestDokumen &&
      'divalidasi_oleh_p2' in latestDokumen &&
      isDrafValid(
        aturanValidasi.mode_validasi_draf,
        latestDokumen.divalidasi_oleh_p1 as number | null,
        latestDokumen.divalidasi_oleh_p2 as number | null,
      );

    const eligible = validBimbinganCount >= minRequired && isDrafValidated;

    let message = '';
    if (!eligible) {
      if (validBimbinganCount < minRequired) {
        message = `Bimbingan valid baru ${validBimbinganCount}/${minRequired}. `;
      }
      if (!isDrafValidated) {
        message += 'Draf TA belum divalidasi sesuai aturan.';
      }
    }

    return {
      eligible,
      validBimbinganCount,
      isDrafValidated,
      minRequired,
      message: message || undefined,
    };
  }

  async batalkanValidasi(
    bimbinganId: number,
    dosenUserId: number,
  ): Promise<unknown> {
    const dosen = await this.repository.findDosenByUserId(dosenUserId);
    if (dosen === null || typeof dosen !== 'object' || !('id' in dosen)) {
      throw new NotFoundError(ERROR_MSG_DOSEN_NOT_FOUND);
    }

    const bimbingan = await this.repository.findBimbinganByIdAndDosen(
      bimbinganId,
      dosen.id as number,
    );
    if (bimbingan === null || typeof bimbingan !== 'object') {
      throw new NotFoundError(ERROR_MSG_SESI_NOT_FOUND);
    }

    // Validasi bahwa dosen yang membatalkan adalah dosen yang sesuai dengan peran sesi
    if ('peran' in bimbingan && 'tugas_akhir_id' in bimbingan) {
      const tugasAkhir = await this.prisma.tugasAkhir.findUnique({
        where: { id: bimbingan.tugas_akhir_id as number },
        include: { peranDosenTa: true },
      });
      
      if (tugasAkhir) {
        const peranDosen = tugasAkhir.peranDosenTa.find(
          (p) => p.dosen_id === (dosen.id as number) && p.peran === bimbingan.peran
        );
        
        if (!peranDosen) {
          throw new UnauthorizedError(
            `Hanya ${bimbingan.peran} yang dapat membatalkan validasi sesi bimbingan ini`
          );
        }
      }
    }

    if (bimbingan.status_bimbingan !== 'selesai') {
      throw new ConflictError(
        'Hanya sesi yang sudah selesai yang bisa dibatalkan validasinya',
      );
    }

    const result = await this.repository.updateBimbinganStatus(
      bimbinganId,
      'dijadwalkan',
    );
    await this.logActivity(
      dosenUserId,
      `Membatalkan validasi bimbingan ID ${bimbinganId}`,
    );

    return result;
  }
}
