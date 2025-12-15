import prisma from '../../config/database';
import { PeranDosen } from '@prisma/client';
import { PengaturanService } from './pengaturan.service';
import { SlotGeneratorService } from './slot-generator.service';
import { DosenAvailabilityService } from './dosen-availability.service';
import { ConflictValidatorService } from './conflict-validator.service';
import { SchedulerService } from './scheduler.service';
import { DiagnosticService } from './diagnostic.service';
import { CrudService } from './crud.service';
import { UpdateService } from './update.service';
import { GeneratorHelperService } from './generator-helper.service';
import { SchedulingLoopService } from './scheduling-loop.service';

export class JadwalSidangService {
  private pengaturanService: PengaturanService;
  private slotGenerator: SlotGeneratorService;
  private dosenAvailability: DosenAvailabilityService;
  private conflictValidator: ConflictValidatorService;
  private scheduler: SchedulerService;
  private diagnostic: DiagnosticService;
  private crudService: CrudService;
  private updateService: UpdateService;
  private generatorHelper: GeneratorHelperService;
  private schedulingLoop: SchedulingLoopService;

  constructor() {
    this.pengaturanService = new PengaturanService();
    this.slotGenerator = new SlotGeneratorService();
    this.dosenAvailability = new DosenAvailabilityService();
    this.conflictValidator = new ConflictValidatorService();
    this.scheduler = new SchedulerService();
    this.diagnostic = new DiagnosticService();
    this.crudService = new CrudService();
    this.updateService = new UpdateService();
    this.generatorHelper = new GeneratorHelperService();
    this.schedulingLoop = new SchedulingLoopService();
  }

  async generateJadwalOtomatis(): Promise<
    {
      mahasiswa: string;
      nim: string;
      ketua: string;
      sekretaris: string;
      anggota1: string;
      anggota2: string;
      hari_tanggal: string;
      pukul: string;
      ruangan: string;
    }[]
  > {
    const pengaturan = await this.pengaturanService.getPengaturan();

    const diagnostic = await this.diagnostic.runSmartDiagnostic(
      pengaturan,
      (key: string) => this.pengaturanService.getPengaturanByKey(key),
    );
    if (!diagnostic.success) {
      throw new Error(JSON.stringify(diagnostic.error));
    }

    const ruanganIds = await this.pengaturanService.getRuanganIds(
      pengaturan.ruangan_sidang,
    );

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
              include: { dosen: { include: { user: true } } },
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

    if (mahasiswaSiapData.length === 0) {
      throw new Error('Tidak ada mahasiswa yang siap sidang.');
    }

    const mahasiswaSiap =
      await this.generatorHelper.prepareMahasiswaSiap(mahasiswaSiapData);

    const maxPembimbingAktifStr =
      await this.pengaturanService.getPengaturanByKey('max_pembimbing_aktif');
    const maxPembimbingAktif = parseInt(
      maxPembimbingAktifStr !== '' ? maxPembimbingAktifStr : '4',
      10,
    );
    await this.generatorHelper.validatePembimbingLoad(
      mahasiswaSiap,
      maxPembimbingAktif,
    );

    const results: {
      mahasiswa: string;
      nim: string;
      ketua: string;
      sekretaris: string;
      anggota1: string;
      anggota2: string;
      hari_tanggal: string;
      pukul: string;
      ruangan: string;
    }[] = [];
    let unscheduled = [...mahasiswaSiap];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    for (
      let dayOffset = 0;
      unscheduled.length > 0 && dayOffset < 365;
      dayOffset++
    ) {
      const tanggal = new Date(startDate);
      tanggal.setDate(tanggal.getDate() + dayOffset);

      const slots = this.slotGenerator.generateTimeSlots(
        tanggal,
        pengaturan,
        ruanganIds,
      );
      if (slots.length === 0) continue;

      const processResult = await this.schedulingLoop.processSlots(
        slots,
        unscheduled,
        pengaturan,
      );
      results.push(...processResult.results);
      unscheduled = processResult.remaining;
    }

    if (unscheduled.length > 0) {
      const firstUnscheduled = unscheduled[0];
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
        }),
      );
    }

    await this.generatorHelper.finalizeScheduling();

    // Update status penjadwalan menjadi SELESAI setelah generate berhasil
    await this.updateStatusPenjadwalanSelesai();

    return results;
  }

  async getMahasiswaGagalSidang(): Promise<
    {
      nama: string;
      nim: string;
      prodi: string;
      kelas: string;
      status: string;
      alasan: string;
    }[]
  > {
    return this.crudService.getMahasiswaGagalSidang();
  }

  async getMahasiswaSiapSidang(): Promise<
    {
      id: number;
      status_hasil: string;
      status_display: string;
      validator_info: string;
      rejection_reason: string;
      tugasAkhir: unknown;
    }[]
  > {
    return this.crudService.getMahasiswaSiapSidang();
  }

  async getJadwalSidang(): Promise<unknown[]> {
    return this.crudService.getJadwalSidang();
  }

  async deleteAllJadwal(): Promise<{ count: number }> {
    return this.crudService.deleteAllJadwal();
  }

  async deleteJadwal(id: number, alasan?: string): Promise<void> {
    return this.crudService.deleteJadwal(id, alasan);
  }

  async updateJadwal(
    jadwalId: number,
    data: {
      tanggal?: string;
      waktu_mulai?: string;
      waktu_selesai?: string;
      ruangan_id?: number;
      penguji1_id?: number;
      penguji2_id?: number;
      penguji3_id?: number;
    },
  ): Promise<unknown> {
    return this.updateService.updateJadwal(jadwalId, data);
  }

  async getEditOptions(): Promise<{
    mahasiswa: { id: number; name: string; nim: string }[];
    dosen: { id: number; name: string }[];
    ruangan: { id: number; name: string }[];
  }> {
    return this.crudService.getEditOptions();
  }

  async moveSchedule(
    fromDate: string,
    toDate: string,
  ): Promise<{ count: number }> {
    return this.crudService.moveSchedule(fromDate, toDate);
  }

  async swapSchedule(
    jadwal1Id: number,
    jadwal2Id: number,
  ): Promise<{ jadwal1Id: number; jadwal2Id: number }> {
    return this.crudService.swapSchedule(jadwal1Id, jadwal2Id);
  }

  private async updateStatusPenjadwalanSelesai(): Promise<void> {
    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });

    if (!periodeAktif) return;

    // Cek apakah sudah ada record penjadwalan
    const existing = await prisma.penjadwalanSidang.findFirst({
      where: { periode_ta_id: periodeAktif.id },
      orderBy: { created_at: 'desc' },
    });

    if (existing) {
      // Update existing record ke SELESAI
      await prisma.penjadwalanSidang.update({
        where: { id: existing.id },
        data: { status: 'SELESAI' as any },
      });
      console.log('[JADWAL SERVICE] ✅ Status penjadwalan updated to SELESAI');
    } else {
      // Buat record baru dengan status SELESAI (generate manual tanpa atur jadwal)
      await prisma.penjadwalanSidang.create({
        data: {
          periode_ta_id: periodeAktif.id,
          status: 'SELESAI' as any,
          tanggal_generate: new Date(),
        },
      });
      console.log(
        '[JADWAL SERVICE] ✅ Record penjadwalan created with status SELESAI',
      );
    }
  }
}
