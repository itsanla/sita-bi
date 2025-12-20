import type { Ruangan } from '../prisma-client';
import { PrismaClient } from '../prisma-client';

export class RuanganService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findAll(): Promise<Ruangan[]> {
    return this.prisma.ruangan.findMany({
      orderBy: {
        nama_ruangan: 'asc',
      },
    });
  }
}
