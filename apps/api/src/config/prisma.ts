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

    // Add query timeout middleware
    instance.$use(async (params, next) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Query timeout: ${params.model}.${params.action}`)), 10000)
      );
      
      try {
        return await Promise.race([next(params), timeout]);
      } catch (error) {
        console.error('[PRISMA TIMEOUT]', params.model, params.action);
        throw error;
      }
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
