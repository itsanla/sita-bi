import { PenugasanService } from '../penugasan.service';
import { PrismaClient, StatusTugasAkhir } from '@repo/db';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import * as businessRules from '../../utils/business-rules';

// Mock Prisma
jest.mock('@repo/db', () => ({
  PrismaClient: jest.fn(),
  PeranDosen: {
    pembimbing1: 'pembimbing1',
    pembimbing2: 'pembimbing2',
    penguji1: 'penguji1',
    penguji2: 'penguji2',
  },
  StatusTugasAkhir: {
    DISETUJUI: 'DISETUJUI',
    BIMBINGAN: 'BIMBINGAN',
    REVISI: 'REVISI',
  },
}));

// Mock business rules
jest.mock('../../utils/business-rules');

describe('PenugasanService', () => {
  let service: PenugasanService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    (PrismaClient as jest.Mock).mockImplementation(() => prismaMock);
    service = new PenugasanService();
    (service as { prisma: DeepMockProxy<PrismaClient> }).prisma = prismaMock;

    // Reset business rules mocks
    (businessRules.validateDosenWorkload as jest.Mock).mockResolvedValue(true);
    (businessRules.validateTeamComposition as jest.Mock).mockResolvedValue(
      true,
    );
  });

  describe('getDosenLoad', () => {
    it('should calculate load correctly', async () => {
      prismaMock.dosen.findMany.mockResolvedValue([
        {
          id: 1,
          user: { name: 'Dosen A', email: 'a@test.com' },
          peranDosenTa: [{ peran: 'pembimbing1' }, { peran: 'penguji1' }],
        },
        {
          id: 2,
          user: { name: 'Dosen B', email: 'b@test.com' },
          peranDosenTa: [{ peran: 'pembimbing1' }],
        },
      ] as unknown as never);

      const result = await service.getDosenLoad();

      expect(result).toHaveLength(2);
      expect(result[0]?.totalLoad).toBe(2);
      expect(result[0]?.bimbinganLoad).toBe(1);
      expect(result[0]?.pengujiLoad).toBe(1);
      expect(result[1]?.totalLoad).toBe(1);
    });
  });

  describe('checkDosenLoad', () => {
    it('should identify overloaded lecturer', async () => {
      prismaMock.peranDosenTa.count.mockResolvedValue(10);

      const result = await service.checkDosenLoad(1);

      expect(result.isOverloaded).toBe(true);
      expect(result.load).toBe(10);
    });

    it('should identify not overloaded lecturer', async () => {
      prismaMock.peranDosenTa.count.mockResolvedValue(5);

      const result = await service.checkDosenLoad(1);

      expect(result.isOverloaded).toBe(false);
      expect(result.load).toBe(5);
    });
  });

  describe('assignPembimbing', () => {
    it('should assign supervisors and log history', async () => {
      const dto = { pembimbing1Id: 1, pembimbing2Id: 2 };
      const adminId = 99;
      const taId = 100;

      prismaMock.$transaction.mockResolvedValue([{}, {}, {}, {}, {}]);

      await service.assignPembimbing(taId, dto, adminId);

      // Verify transaction calls
      // 1. Upsert Pembimbing 1
      // 2. Log History Pembimbing 1
      // 3. Upsert Pembimbing 2
      // 4. Log History Pembimbing 2
      // 5. Update Status

      expect(prismaMock.peranDosenTa.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.historyPenugasanDosen.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.tugasAkhir.update).toHaveBeenCalledWith({
        where: { id: taId },
        data: { status: StatusTugasAkhir.BIMBINGAN },
      });
    });
  });

  describe('assignPenguji', () => {
    it('should assign examiners and log history', async () => {
      const dto = { penguji1Id: 3, penguji2Id: 4 };
      const adminId = 99;
      const taId = 100;

      prismaMock.$transaction.mockResolvedValue([{}, {}, {}, {}]);

      await service.assignPenguji(taId, dto, adminId);

      // Verify transaction calls
      // 1. Upsert Penguji 1
      // 2. Log History Penguji 1
      // 3. Upsert Penguji 2
      // 4. Log History Penguji 2

      expect(prismaMock.peranDosenTa.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.historyPenugasanDosen.create).toHaveBeenCalledTimes(2);
    });
  });
});
