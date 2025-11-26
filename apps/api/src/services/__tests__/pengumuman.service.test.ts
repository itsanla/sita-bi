import { PengumumanService } from '../pengumuman.service';
import type { CreatePengumumanDto } from '../../dto/pengumuman.dto';

// Mock PrismaClient
jest.mock('@repo/db', () => {
  const mPrismaClient = {
    pengumuman: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pengumumanPembaca: {
      upsert: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
    AudiensPengumuman: {
      guest: 'guest',
      registered_users: 'registered_users',
      all_users: 'all_users',
      dosen: 'dosen',
      mahasiswa: 'mahasiswa',
    },
    PrioritasPengumuman: {
      RENDAH: 'RENDAH',
      MENENGAH: 'MENENGAH',
      TINGGI: 'TINGGI',
    },
    KategoriPengumuman: {
      AKADEMIK: 'AKADEMIK',
      ADMINISTRASI: 'ADMINISTRASI',
      KEMAHASISWAAN: 'KEMAHASISWAAN',
      LAINNYA: 'LAINNYA',
    },
  };
});

// Re-import types after mock to avoid conflict if they were real enums
import {
  AudiensPengumuman,
  PrioritasPengumuman,
  KategoriPengumuman,
} from '@repo/db';

describe('PengumumanService', () => {
  let service: PengumumanService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  beforeEach(() => {
    service = new PengumumanService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma = (service as any).prisma;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new pengumuman', async () => {
      const dto: CreatePengumumanDto = {
        judul: 'Test Pengumuman',
        isi: 'Isi test',
        audiens: AudiensPengumuman.all_users,
        is_published: true,
        prioritas: PrioritasPengumuman.TINGGI,
        kategori: KategoriPengumuman.AKADEMIK,
        scheduled_at: null,
        berakhir_pada: null,
      };
      const authorId = 1;
      const expectedResult = {
        id: 1,
        ...dto,
        dibuat_oleh: authorId,
        tanggal_dibuat: new Date(),
        scheduled_at: null,
        berakhir_pada: undefined,
      };

      prisma.pengumuman.create.mockResolvedValue(expectedResult);

      const result = await service.create(dto, authorId);

      expect(prisma.pengumuman.create).toHaveBeenCalledWith({
        data: {
          judul: dto.judul,
          isi: dto.isi,
          audiens: dto.audiens,
          dibuat_oleh: authorId,
          tanggal_dibuat: expect.any(Date),
          is_published: true,
          scheduled_at: null,
          prioritas: 'TINGGI',
          kategori: 'AKADEMIK',
          berakhir_pada: null,
          lampiran: { create: [] },
        },
        include: { lampiran: true },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findPublic', () => {
    it('should return published public announcements', async () => {
      const mockData = [{ id: 1, judul: 'Public', is_published: true }];
      prisma.pengumuman.count.mockResolvedValue(1);
      prisma.pengumuman.findMany.mockResolvedValue(mockData);

      const result = await service.findPublic(1, 10);

      expect(prisma.pengumuman.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                audiens: { in: ['all_users', 'guest'] },
              }),
            ]),
          }),
        }),
      );
      expect(result.data).toEqual(mockData);
    });

    it('should filter by kategori', async () => {
      const mockData = [{ id: 1, judul: 'Akademik', kategori: 'AKADEMIK' }];
      prisma.pengumuman.count.mockResolvedValue(1);
      prisma.pengumuman.findMany.mockResolvedValue(mockData);

      await service.findPublic(1, 10, KategoriPengumuman.AKADEMIK);

      expect(prisma.pengumuman.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ kategori: 'AKADEMIK' }]),
          }),
        }),
      );
    });
  });
});
