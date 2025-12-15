import { PrismaClient } from '@repo/db';

// Singleton pattern for Prisma Client
let instance: PrismaClient | null = null;

function getInstance(): PrismaClient {
  if (instance === null) {
    instance = new PrismaClient({
      log:
        process.env['NODE_ENV'] === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
      datasources: {
        db: {
          url: process.env['DATABASE_URL'],
        },
      },
    });

    // Handle connection errors
    instance.$connect().catch((err: unknown) => {
      console.error('Failed to connect to database:', err);
    });
  }
  return instance;
}

export async function disconnect(): Promise<void> {
  if (instance !== null) {
    await instance.$disconnect();
    instance = null;
  }
}

export const prisma = getInstance();
export default prisma;
