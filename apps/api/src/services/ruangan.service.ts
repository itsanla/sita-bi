import { getPrismaClient } from '../config/database';
import type { Ruangan } from '../prisma-client';
;

export class RuanganService {
  private prisma: ReturnType<typeof getPrismaClient>;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findAll(): Promise<Ruangan[]> {
    return this.prisma.ruangan.findMany({
      orderBy: {
        nama_ruangan: 'asc',
      },
    });
  }
}
