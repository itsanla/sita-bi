import { Role } from '../middlewares/auth.middleware';
import prisma from '../config/database';

export interface RBACContext {
  userId: number;
  role: Role;
  dosenId?: number;
  mahasiswaId?: number;
  prodi?: 'D3' | 'D4' | null;
}

export async function canAccessMahasiswa(
  context: RBACContext,
  targetMahasiswaId: number,
): Promise<boolean> {
  if (context.role === Role.jurusan || context.role === Role.admin) {
    return true;
  }

  if (context.role === Role.prodi_d3 || context.role === Role.prodi_d4) {
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id: targetMahasiswaId },
      select: { prodi: true },
    });

    if (!mahasiswa) return false;
    return mahasiswa.prodi === context.prodi;
  }

  if (context.role === Role.dosen && context.dosenId != null) {
    const assignment = await prisma.peranDosenTa.findFirst({
      where: {
        dosen_id: context.dosenId,
        tugasAkhir: {
          mahasiswa_id: targetMahasiswaId,
        },
      },
    });

    return !!assignment;
  }

  if (context.role === Role.mahasiswa && context.mahasiswaId != null) {
    return context.mahasiswaId === targetMahasiswaId;
  }

  return false;
}

export async function canAccessTugasAkhir(
  context: RBACContext,
  tugasAkhirId: number,
): Promise<boolean> {
  if (context.role === Role.jurusan || context.role === Role.admin) {
    return true;
  }

  const tugasAkhir = await prisma.tugasAkhir.findUnique({
    where: { id: tugasAkhirId },
    include: {
      mahasiswa: { select: { prodi: true, id: true } },
      peranDosenTa: { select: { dosen_id: true } },
    },
  });

  if (!tugasAkhir) return false;

  if (context.role === Role.prodi_d3 || context.role === Role.prodi_d4) {
    return tugasAkhir.mahasiswa.prodi === context.prodi;
  }

  if (context.role === Role.dosen && context.dosenId != null) {
    return tugasAkhir.peranDosenTa.some((p) => p.dosen_id === context.dosenId);
  }

  if (context.role === Role.mahasiswa && context.mahasiswaId != null) {
    return tugasAkhir.mahasiswa.id === context.mahasiswaId;
  }

  return false;
}

export async function getFilteredMahasiswaQuery(
  context: RBACContext,
): Promise<Record<string, unknown>> {
  if (context.role === Role.jurusan || context.role === Role.admin) {
    return {};
  }

  if (context.role === Role.prodi_d3 || context.role === Role.prodi_d4) {
    return { prodi: context.prodi };
  }

  if (context.role === Role.dosen && context.dosenId != null) {
    return {
      tugasAkhir: {
        peranDosenTa: {
          some: {
            dosen_id: context.dosenId,
          },
        },
      },
    };
  }

  if (context.role === Role.mahasiswa && context.mahasiswaId != null) {
    return { id: context.mahasiswaId };
  }

  return { id: -1 };
}

export async function getDosenCapacity(dosenId: number): Promise<{
  current: number;
  max: number;
  available: number;
  percentage: number;
}> {
  const current = await prisma.peranDosenTa.count({
    where: {
      dosen_id: dosenId,
      peran: { in: ['pembimbing1', 'pembimbing2'] },
      tugasAkhir: {
        status: { in: ['BIMBINGAN', 'REVISI', 'DISETUJUI'] },
      },
    },
  });

  const max = 4;
  const available = Math.max(0, max - current);
  const percentage = Math.round((current / max) * 100);

  return { current, max, available, percentage };
}

export async function validatePembimbingAssignment(
  pembimbing1Id: number,
  pembimbing2Id?: number,
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (pembimbing2Id != null && pembimbing1Id === pembimbing2Id) {
    errors.push('Pembimbing 1 dan Pembimbing 2 harus berbeda');
  }

  const capacity1 = await getDosenCapacity(pembimbing1Id);
  if (capacity1.available === 0) {
    errors.push(
      `Pembimbing 1 sudah mencapai kapasitas maksimal (${capacity1.current}/${capacity1.max})`,
    );
  }

  if (pembimbing2Id != null) {
    const capacity2 = await getDosenCapacity(pembimbing2Id);
    if (capacity2.available === 0) {
      errors.push(
        `Pembimbing 2 sudah mencapai kapasitas maksimal (${capacity2.current}/${capacity2.max})`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePengujiAssignment(
  penguji1Id: number,
  penguji2Id?: number,
  penguji3Id?: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const pengujiIds = [penguji1Id, penguji2Id, penguji3Id].filter(
    (id) => id !== undefined,
  );

  const uniqueIds = new Set(pengujiIds);
  if (uniqueIds.size !== pengujiIds.length) {
    errors.push('Semua penguji harus berbeda');
  }

  return { valid: errors.length === 0, errors };
}

export async function validateTeamComposition(
  pembimbing1Id: number,
  pembimbing2Id?: number,
): Promise<{ isValid: boolean; errors: string[] }> {
  return validatePembimbingAssignment(pembimbing1Id, pembimbing2Id);
}

export async function validateNoOverlap(
  tugasAkhirId: number,
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  const peranDosen = await prisma.peranDosenTa.findMany({
    where: { tugas_akhir_id: tugasAkhirId },
    select: { dosen_id: true, peran: true },
  });

  const pembimbingIds = peranDosen
    .filter((p) => p.peran === 'pembimbing1' || p.peran === 'pembimbing2')
    .map((p) => p.dosen_id);

  const pengujiIds = peranDosen
    .filter(
      (p) =>
        p.peran === 'penguji1' ||
        p.peran === 'penguji2' ||
        p.peran === 'penguji3',
    )
    .map((p) => p.dosen_id);

  const overlap = pembimbingIds.some((id) => pengujiIds.includes(id));
  if (overlap) {
    errors.push(
      'Dosen tidak boleh menjadi pembimbing dan penguji di TA yang sama',
    );
  }

  return { valid: errors.length === 0, errors };
}
