import { BimbinganService } from './bimbingan.service';
import { PrismaClient } from '@repo/db';

// Define the mock shape and type
const mPrisma = {
  bimbinganTA: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  jadwalSidang: {
    findMany: jest.fn(),
  },
  peranDosenTa: {
    findFirst: jest.fn(),
  },
  dosen: {
    findUnique: jest.fn(),
  },
  log: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mPrisma.$transaction.mockImplementation((callback: any) => callback(mPrisma));
type MockPrismaClient = typeof mPrisma;

// Mock @repo/db
jest.mock('@repo/db', () => ({
  PrismaClient: jest.fn(() => mPrisma),
  StatusTugasAkhir: {},
}));

describe('BimbinganService - Smart Scheduling', () => {
  let service: BimbinganService;
  let prisma: MockPrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BimbinganService();
    prisma = new PrismaClient() as unknown as MockPrismaClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).prisma = prisma;
  });

  describe('detectScheduleConflicts', () => {
    it('should return true if there is a conflict with another bimbingan', async () => {
      prisma.bimbinganTA.findMany.mockResolvedValue([
        { jam_bimbingan: '10:00' },
      ]);
      prisma.jadwalSidang.findMany.mockResolvedValue([]);

      const conflict = await service.detectScheduleConflicts(
        1,
        new Date(),
        '10:30',
      );
      expect(conflict).toBe(true);
    });

    it('should return false if there are no conflicts', async () => {
      prisma.bimbinganTA.findMany.mockResolvedValue([]);
      prisma.jadwalSidang.findMany.mockResolvedValue([]);

      const conflict = await service.detectScheduleConflicts(
        1,
        new Date(),
        '10:00',
      );
      expect(conflict).toBe(false);
    });
  });

  describe('suggestAvailableSlots', () => {
    it('should return available slots excluding busy times', async () => {
      // Mock busy at 08:00 - 09:00
      prisma.bimbinganTA.findMany.mockResolvedValue([
        { jam_bimbingan: '08:00' },
      ]);
      prisma.jadwalSidang.findMany.mockResolvedValue([]);

      const slots = await service.suggestAvailableSlots(1, '2023-01-01');

      // The logic returns slots every 60 minutes starting from 08:00
      // If 08:00 is busy (until 09:00), the first available slot should be 09:00

      // Debug: log the slots if test fails
      // console.log(slots);

      expect(slots).not.toContain('08:00');
      expect(slots).toContain('09:00');
    });
  });
});
