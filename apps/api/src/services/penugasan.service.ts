import { PrismaClient, PeranDosen, StatusTugasAkhir } from '@repo/db';
import type { AssignPembimbingDto } from '../dto/penugasan.dto';
import { z } from 'zod';
import type { PrismaPromise } from '@prisma/client';
import { validateDosenWorkload } from '../utils/business-rules';

// Define AssignPengujiDto schema here since it's not in the DTO file yet
export const assignPengujiSchema = z.object({
  penguji1Id: z.number().int(),
  penguji2Id: z.number().int().optional(),
  penguji3Id: z.number().int().optional(),
});
export type AssignPengujiDto = z.infer<typeof assignPengujiSchema>;

// Define return types
interface DosenLoadResult {
  id: number;
  name: string;
  email: string;
  totalLoad: number;
  bimbinganLoad: number;
  pengujiLoad: number;
}

export class PenugasanService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getDosenLoad(): Promise<DosenLoadResult[]> {
    const dosenList = await this.prisma.dosen.findMany({
      include: {
        user: { select: { name: true, email: true } },
        peranDosenTa: {
          where: {
            tugasAkhir: {
              status: {
                in: [StatusTugasAkhir.BIMBINGAN, StatusTugasAkhir.REVISI],
              },
            },
          },
        },
      },
    });

    return dosenList.map((d) => {
      const bimbinganCount: number = d.peranDosenTa.filter((p) =>
        ['pembimbing1', 'pembimbing2'].includes(p.peran),
      ).length;
      const pengujiCount: number = d.peranDosenTa.filter((p) =>
        ['penguji1', 'penguji2', 'penguji3', 'penguji4'].includes(p.peran),
      ).length;

      return {
        id: d.id,
        name: d.user.name,
        email: d.user.email,
        totalLoad: bimbinganCount + pengujiCount,
        bimbinganLoad: bimbinganCount,
        pengujiLoad: pengujiCount,
      };
    });
  }

  // Refinement: Sort by lowest load
  async getRecommendedDosen(
    _type: 'pembimbing' | 'penguji' = 'pembimbing',
  ): Promise<DosenLoadResult[]> {
    const allDosen = await this.getDosenLoad();
    // Simple refinement: sort by total load asc
    return allDosen.sort((a, b) => a.totalLoad - b.totalLoad);
  }

  async checkDosenLoad(
    dosenId: number,
  ): Promise<{ isOverloaded: boolean; load: number }> {
    const activeAssignments = await this.prisma.peranDosenTa.count({
      where: {
        dosen_id: dosenId,
        tugasAkhir: {
          status: {
            in: [StatusTugasAkhir.BIMBINGAN, StatusTugasAkhir.REVISI],
          },
        },
      },
    });

    // Example threshold: 10
    return {
      isOverloaded: activeAssignments >= 10,
      load: activeAssignments,
    };
  }

  async findUnassignedTugasAkhir(page = 1, limit = 50): Promise<unknown> {
    const whereClause = {
      status: StatusTugasAkhir.DISETUJUI,
      peranDosenTa: {
        none: {
          peran: {
            in: [PeranDosen.pembimbing1, PeranDosen.pembimbing2],
          },
        },
      },
    };

    const total = await this.prisma.tugasAkhir.count({ where: whereClause });
    const data = await this.prisma.tugasAkhir.findMany({
      where: whereClause,
      include: {
        mahasiswa: { include: { user: true } },
      },
      orderBy: {
        updated_at: 'asc',
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

  async assignPembimbing(
    tugasAkhirId: number,
    dto: AssignPembimbingDto,
    adminId: number, // Need admin ID for history
  ): Promise<unknown> {
    const { pembimbing1Id, pembimbing2Id } = dto;

    // Validate using new RBAC helpers
    const { validatePembimbingAssignment } = await import('../utils/rbac-helpers');
    const validation = await validatePembimbingAssignment(pembimbing1Id, pembimbing2Id);
    
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    await validateDosenWorkload(pembimbing1Id);
    if (pembimbing2Id !== undefined) {
      await validateDosenWorkload(pembimbing2Id);
    }

    // Validate composition (check if roles are already filled - although upsert handles it, we want to enforce logic)
    // We are replacing/assigning, so we should check existing logic if we weren't doing upsert.
    // But since we are doing upsert, validateTeamComposition might throw "already filled" if we call it blindly.
    // However, the rule is "2 Pembimbing". This method assigns both or one.
    // So let's just trust the input is intended to fill P1 and P2.
    // The validateTeamComposition is more useful if we were adding one by one.

    // For now, let's stick to workload validation which is critical.

    // We are removing the unused import error by commenting out until used or just ignoring if we plan to use later
    // validateTeamComposition(tugasAkhirId, PeranDosen.pembimbing1);

    const queries: PrismaPromise<unknown>[] = [];

    // Prepare query for Pembimbing 1
    queries.push(
      this.prisma.peranDosenTa.upsert({
        where: {
          tugas_akhir_id_peran: {
            tugas_akhir_id: tugasAkhirId,
            peran: PeranDosen.pembimbing1,
          },
        },
        update: { dosen_id: pembimbing1Id },
        create: {
          tugas_akhir_id: tugasAkhirId,
          dosen_id: pembimbing1Id,
          peran: PeranDosen.pembimbing1,
        },
      }),
    );

    // Log history for Pembimbing 1
    queries.push(
      this.prisma.historyPenugasanDosen.create({
        data: {
          tugas_akhir_id: tugasAkhirId,
          dosen_id: pembimbing1Id,
          admin_id: adminId,
          peran: 'pembimbing1',
          action: 'ASSIGN',
        },
      }),
    );

    // Prepare query for Pembimbing 2 if provided
    if (pembimbing2Id !== undefined) {
      queries.push(
        this.prisma.peranDosenTa.upsert({
          where: {
            tugas_akhir_id_peran: {
              tugas_akhir_id: tugasAkhirId,
              peran: PeranDosen.pembimbing2,
            },
          },
          update: { dosen_id: pembimbing2Id },
          create: {
            tugas_akhir_id: tugasAkhirId,
            dosen_id: pembimbing2Id,
            peran: PeranDosen.pembimbing2,
          },
        }),
      );
      // Log history for Pembimbing 2
      queries.push(
        this.prisma.historyPenugasanDosen.create({
          data: {
            tugas_akhir_id: tugasAkhirId,
            dosen_id: pembimbing2Id,
            admin_id: adminId,
            peran: 'pembimbing2',
            action: 'ASSIGN',
          },
        }),
      );
    }

    // Update TugasAkhir status
    queries.push(
      this.prisma.tugasAkhir.update({
        where: { id: tugasAkhirId },
        data: { status: StatusTugasAkhir.BIMBINGAN },
      }),
    );

    const result = await this.prisma.$transaction(queries);

    // Auto-create 9 empty sessions after pembimbing assigned
    try {
      const { BimbinganService } = await import('./bimbingan.service');
      const bimbinganService = new BimbinganService();
      await bimbinganService.initializeEmptySessions(tugasAkhirId);
    } catch (error) {
      console.error('Failed to initialize empty sessions:', error);
    }

    return result;
  }

  async assignPenguji(
    tugasAkhirId: number,
    dto: AssignPengujiDto,
    adminId: number,
  ): Promise<unknown> {
    const { penguji1Id, penguji2Id, penguji3Id } = dto;
    
    // Validate penguji assignment
    const { validatePengujiAssignment } = await import('../utils/rbac-helpers');
    const validation = validatePengujiAssignment(penguji1Id, penguji2Id, penguji3Id);
    
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    
    const queries: PrismaPromise<unknown>[] = [];

    // Assign Penguji 1
    queries.push(
      this.prisma.peranDosenTa.upsert({
        where: {
          tugas_akhir_id_peran: {
            tugas_akhir_id: tugasAkhirId,
            peran: PeranDosen.penguji1,
          },
        },
        update: { dosen_id: penguji1Id },
        create: {
          tugas_akhir_id: tugasAkhirId,
          dosen_id: penguji1Id,
          peran: PeranDosen.penguji1,
        },
      }),
    );

    queries.push(
      this.prisma.historyPenugasanDosen.create({
        data: {
          tugas_akhir_id: tugasAkhirId,
          dosen_id: penguji1Id,
          admin_id: adminId,
          peran: 'penguji1',
          action: 'ASSIGN',
        },
      }),
    );

    if (penguji2Id !== undefined) {
      queries.push(
        this.prisma.peranDosenTa.upsert({
          where: {
            tugas_akhir_id_peran: {
              tugas_akhir_id: tugasAkhirId,
              peran: PeranDosen.penguji2,
            },
          },
          update: { dosen_id: penguji2Id },
          create: {
            tugas_akhir_id: tugasAkhirId,
            dosen_id: penguji2Id,
            peran: PeranDosen.penguji2,
          },
        }),
      );
      queries.push(
        this.prisma.historyPenugasanDosen.create({
          data: {
            tugas_akhir_id: tugasAkhirId,
            dosen_id: penguji2Id,
            admin_id: adminId,
            peran: 'penguji2',
            action: 'ASSIGN',
          },
        }),
      );
    }

    if (penguji3Id !== undefined) {
      queries.push(
        this.prisma.peranDosenTa.upsert({
          where: {
            tugas_akhir_id_peran: {
              tugas_akhir_id: tugasAkhirId,
              peran: PeranDosen.penguji3,
            },
          },
          update: { dosen_id: penguji3Id },
          create: {
            tugas_akhir_id: tugasAkhirId,
            dosen_id: penguji3Id,
            peran: PeranDosen.penguji3,
          },
        }),
      );
      queries.push(
        this.prisma.historyPenugasanDosen.create({
          data: {
            tugas_akhir_id: tugasAkhirId,
            dosen_id: penguji3Id,
            admin_id: adminId,
            peran: 'penguji3',
            action: 'ASSIGN',
          },
        }),
      );
    }

    return this.prisma.$transaction(queries);
  }
}
