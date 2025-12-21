import { PrismaClient } from '../prisma-client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn', 'query'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma;

// Set statement timeout to prevent hanging queries
prisma.$executeRaw`SET statement_timeout = '10000'`.catch(() => {});

console.log('[DATABASE] PostgreSQL ready with 10s timeout');

export function getPrismaClient(): PrismaClient {
  return prisma;
}

export default prisma;
