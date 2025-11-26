import { ReportService } from '../report.service';

const mPrismaClient = {
  mahasiswa: { count: jest.fn() },
  dosen: { count: jest.fn(), findMany: jest.fn() },
  tugasAkhir: { count: jest.fn() },
  peranDosenTa: { groupBy: jest.fn() },
};
type MockPrismaClient = typeof mPrismaClient;

jest.mock('@repo/db', () => {
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
  };
});

describe('ReportService', () => {
  let service: ReportService;
  let prisma: MockPrismaClient;

  beforeEach(() => {
    service = new ReportService();
    // Inject the mock into the service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).prisma = mPrismaClient;
    prisma = mPrismaClient;
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return aggregated stats', async () => {
      prisma.mahasiswa.count.mockResolvedValue(100);
      prisma.dosen.count.mockResolvedValue(20);
      prisma.tugasAkhir.count.mockResolvedValue(50);

      const stats = await service.getDashboardStats();

      expect(stats).toEqual({
        totalStudents: 100,
        totalLecturers: 20,
        activeTAs: 50,
      });
      expect(prisma.mahasiswa.count).toHaveBeenCalled();
    });
  });

  describe('getLecturerWorkload', () => {
    it('should return workload per lecturer', async () => {
      const workloads = [
        { dosen_id: 1, peran: 'pembimbing1', _count: { tugas_akhir_id: 5 } },
      ];
      const lecturers = [{ id: 1, nidn: '123', user: { name: 'Dr. Test' } }];

      prisma.peranDosenTa.groupBy.mockResolvedValue(workloads);
      prisma.dosen.findMany.mockResolvedValue(lecturers);

      const result = await service.getLecturerWorkload();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Dr. Test');
      expect(result[0].roles).toHaveLength(1);
      expect(result[0].roles[0]).toEqual({ role: 'pembimbing1', count: 5 });
    });
  });
});
