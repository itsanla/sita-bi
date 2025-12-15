import { PrismaClient } from '@repo/db';
import type { Log, LogLevel } from '@repo/db';

interface CreateLogDto {
  user_id?: number | null | undefined;
  action: string;
  ip_address?: string | null | undefined;
  user_agent?: string | null | undefined;
  url?: string | null | undefined;
  method?: string | null | undefined;
  details?: string | null | undefined;
  module?: string | null | undefined;
  entity_id?: number | null | undefined;
  level?: LogLevel;
}

interface LogFilters {
  module?: string;
  level?: LogLevel;
  user_id?: string;
  entity_id?: string;
  date?: string; // Format: YYYY-MM-DD
}

export class LogService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: CreateLogDto): Promise<Log | null> {
    // Jika ada user_id, cek apakah user masih ada di database
    if (data.user_id != null) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: data.user_id },
        select: { id: true },
      });
      // Jika user tidak ada, jangan buat log (database mungkin di-reset)
      if (!userExists) {
        return null;
      }
    }

    return this.prisma.log.create({
      data: {
        user_id: data.user_id ?? null,
        action: data.action,
        ip_address: data.ip_address ?? null,
        user_agent: data.user_agent ?? null,
        url: data.url ?? null,
        method: data.method ?? null,
        details: data.details ?? null,
        module: data.module ?? null,
        entity_id: data.entity_id ?? null,
        level: data.level ?? 'INFO',
      },
    });
  }

  async findAll(
    page = 1,
    limit = 50,
    filters: LogFilters = {},
  ): Promise<unknown> {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Record<string, unknown> = {};
    if (filters.module !== undefined && filters.module.length > 0)
      where.module = filters.module;
    if (filters.level !== undefined && filters.level.length > 0)
      where.level = filters.level;
    if (filters.user_id !== undefined && filters.user_id.length > 0)
      where.user_id = parseInt(filters.user_id, 10);
    if (filters.entity_id !== undefined && filters.entity_id.length > 0)
      where.entity_id = parseInt(filters.entity_id, 10);

    // Filter by date (YYYY-MM-DD)
    if (filters.date !== undefined && filters.date.length > 0) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      where.created_at = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.log.findMany({
        where,
        skip,
        take,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.log.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getByEntity(entityId: number, moduleName: string): Promise<Log[]> {
    return this.prisma.log.findMany({
      where: {
        entity_id: entityId,
        module: moduleName,
      },
      orderBy: { created_at: 'desc' },
      include: { user: { select: { name: true } } },
    });
  }
}
