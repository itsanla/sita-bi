import { LogService } from '../log.service';

// Define the type of the mock
const mPrismaClient = {
  log: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
};
type MockPrismaClient = typeof mPrismaClient;

// Mock PrismaClient
jest.mock('@repo/db', () => {
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
    LogLevel: {
      INFO: 'INFO',
      WARN: 'WARN',
      ERROR: 'ERROR',
      DEBUG: 'DEBUG',
    },
  };
});

describe('LogService', () => {
  let service: LogService;
  let prisma: MockPrismaClient;

  beforeEach(() => {
    service = new LogService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma = (service as any).prisma;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a log', async () => {
      const logData = {
        action: 'TEST_ACTION',
        module: 'TEST',
        level: 'INFO' as const,
      };

      const expectedResult = { id: 1, ...logData, created_at: new Date() };
      prisma.log.create.mockResolvedValue(expectedResult);

      const result = await service.create(logData);

      expect(prisma.log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'TEST_ACTION',
          level: 'INFO',
        }),
      });
      expect(result).toEqual(expectedResult);
    });

    it('should default level to INFO', async () => {
      const logData = { action: 'TEST' };
      await service.create(logData);
      expect(prisma.log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          level: 'INFO',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated logs', async () => {
      const logs = [{ id: 1, action: 'TEST' }];
      const total = 1;

      prisma.log.findMany.mockResolvedValue(logs);
      prisma.log.count.mockResolvedValue(total);

      const result = await service.findAll(1, 10);

      expect(prisma.log.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        data: logs,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply filters', async () => {
      await service.findAll(1, 10, { module: 'AUTH' });
      expect(prisma.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ module: 'AUTH' }),
        }),
      );
    });
  });
});
