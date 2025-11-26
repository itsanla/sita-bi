import { PrismaClient } from '@repo/db';

/**
 * Prisma client with query logging extension
 */
const prisma = new PrismaClient();

// eslint-disable-next-line no-console
console.log('✅ Prisma client initialized');

export default prisma;
