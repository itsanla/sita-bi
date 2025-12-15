import type { PengaturanJadwal, TimeSlot } from './types';
import { DosenAvailabilityService } from './dosen-availability.service';
import { ConflictValidatorService } from './conflict-validator.service';
import { SchedulerService } from './scheduler.service';
import { GeneratorHelperService } from './generator-helper.service';

export class SchedulingLoopService {
  private dosenAvailability: DosenAvailabilityService;
  private conflictValidator: ConflictValidatorService;
  private scheduler: SchedulerService;
  private generatorHelper: GeneratorHelperService;

  constructor() {
    this.dosenAvailability = new DosenAvailabilityService();
    this.conflictValidator = new ConflictValidatorService();
    this.scheduler = new SchedulerService();
    this.generatorHelper = new GeneratorHelperService();
  }

  async tryScheduleSidang(
    sidang: any,
    slot: TimeSlot,
    pengaturan: PengaturanJadwal,
  ): Promise<{ success: boolean; result?: any }> {
    const pembimbingIds = sidang.tugasAkhir.peranDosenTa.map(
      (p: any) => p.dosen_id,
    );

    let availableDosen = await this.dosenAvailability.getDosenAvailable(
      slot,
      pembimbingIds,
      pengaturan,
      false,
    );
    if (availableDosen.length < 3) {
      availableDosen = await this.dosenAvailability.getDosenAvailable(
        slot,
        pembimbingIds,
        pengaturan,
        true,
      );
    }

    if (availableDosen.length < 3) {
      return { success: false };
    }

    let isValid = false;
    let pengujiIds: number[] = [];
    const maxRetries = Math.min(10, availableDosen.length);

    for (let retry = 0; retry < maxRetries && !isValid; retry++) {
      const shuffled = this.scheduler.shuffleArray(availableDosen);
      pengujiIds = shuffled.slice(0, 3);
      isValid = await this.conflictValidator.validateNoConflict(
        slot,
        pengujiIds,
        pembimbingIds,
      );
    }

    if (!isValid) {
      return { success: false };
    }

    const pengujiData = await this.generatorHelper.createJadwalTransaction(
      sidang,
      slot,
      pengujiIds,
    );
    const result = this.generatorHelper.formatResult(sidang, pengujiData, slot);

    return { success: true, result };
  }

  async processSlots(
    slots: TimeSlot[],

    unscheduled: any[],
    pengaturan: PengaturanJadwal,
  ): Promise<{ results: any[]; remaining: any[] }> {
    const results: any[] = [];
    const remaining = [...unscheduled];

    for (const slot of slots) {
      if (remaining.length === 0) break;

      const isAvailable = await this.conflictValidator.isSlotAvailable(slot);
      if (!isAvailable) continue;

      for (let i = 0; i < remaining.length; i++) {
        const sidang = remaining[i];
        const scheduleResult = await this.tryScheduleSidang(
          sidang,
          slot,
          pengaturan,
        );

        if (scheduleResult.success && Boolean(scheduleResult.result)) {
          results.push(scheduleResult.result);
          remaining.splice(i, 1);
          break;
        }
      }
    }

    return { results, remaining };
  }
}
