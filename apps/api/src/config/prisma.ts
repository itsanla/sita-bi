import { PrismaClient } from '@repo/db';

// Singleton pattern for Prisma Client
class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
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
      PrismaService.instance.$connect().catch((err) => {
        console.error('Failed to connect to database:', err);
      });
    }
    return PrismaService.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
  }
}

export const prisma = PrismaService.getInstance();
export default prisma;
