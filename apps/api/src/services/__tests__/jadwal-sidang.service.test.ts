import { JadwalSidangService } from '../jadwal-sidang.service';
import { PrismaClient } from '@repo/db';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';

jest.mock('@repo/db', () => ({
  PrismaClient: jest.fn(),
  PeranDosen: {
    pembimbing1: 'pembimbing1',
    pembimbing2: 'pembimbing2',
    penguji1: 'penguji1',
  },
}));

describe('JadwalSidangService', () => {
  let service: JadwalSidangService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    (PrismaClient as jest.Mock).mockReturnValue(prismaMock);
    service = new JadwalSidangService();
  });

  describe('checkConflict', () => {
    it('should return conflict if room is booked', async () => {
      // Setup mock data
      const dto = {
        sidangId: 1,
        tanggal: '2023-11-20',
        waktu_mulai: '09:00',
        waktu_selesai: '10:00',
        ruangan_id: 101,
        pengujiIds: [2, 3],
      };

      prismaMock.sidang.findUnique.mockResolvedValue({
        id: 1,
        tugasAkhir: {
          peranDosenTa: [{ dosen_id: 1, peran: 'pembimbing1' }],
        },
      } as unknown as never);

      prismaMock.jadwalSidang.findFirst.mockResolvedValue({
        id: 99,
        waktu_mulai: '09:30',
        waktu_selesai: '10:30',
        ruangan: { nama_ruangan: 'Room 101' },
        sidang: {
          tugasAkhir: {
            mahasiswa: {
              user: { name: 'Student B' },
            },
          },
        },
      } as unknown as never);

      prismaMock.jadwalSidang.findMany.mockResolvedValue([]);

      const result = await service.checkConflict(dto);

      expect(result.hasConflict).toBe(true);
      expect(result.messages[0]).toContain('Room 101');
      expect(result.messages[0]).toContain('Student B');
    });

    it('should return conflict if dosen is busy', async () => {
      // Setup mock data
      const dto = {
        sidangId: 1,
        tanggal: '2023-11-20',
        waktu_mulai: '09:00',
        waktu_selesai: '10:00',
        ruangan_id: 101,
        pengujiIds: [2, 3],
      };

      prismaMock.sidang.findUnique.mockResolvedValue({
        id: 1,
        tugasAkhir: {
          peranDosenTa: [{ dosen_id: 1, peran: 'pembimbing1' }],
        },
      } as unknown as never);
      // No room conflict
      prismaMock.jadwalSidang.findFirst.mockResolvedValue(null);

      prismaMock.jadwalSidang.findMany.mockResolvedValue([
        {
          sidang: {
            tugas_akhir_id: 999,
            tugasAkhir: {
              peranDosenTa: [
                {
                  dosen_id: 1,
                  dosen: { user: { name: 'Prof A' } },
                },
              ],
            },
          },
        } as unknown as never,
      ]);

      const result = await service.checkConflict(dto);

      expect(result.hasConflict).toBe(true);
      expect(result.messages[0]).toContain('Prof A');
    });
  });
});
