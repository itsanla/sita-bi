import { PrismaClient } from '../prisma-client';

// Singleton pattern untuk Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma;

// Optimasi SQLite untuk concurrent access
prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;').catch(() => {});
prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;').catch(() => {});

export default prisma;
