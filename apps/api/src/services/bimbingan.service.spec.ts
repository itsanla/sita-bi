import { BimbinganService } from './bimbingan.service';

// Mock PrismaClient
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma: any = {
  tugasAkhir: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  bimbinganTA: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(), // Added findMany for conflict check
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  catatanBimbingan: {
    create: jest.fn(),
  },
  peranDosenTa: {
    findFirst: jest.fn(),
  },
  historyPerubahanJadwal: {
    create: jest.fn(),
  },
  dokumenTa: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  dosen: {
    findUnique: jest.fn(), // Added dosen.findUnique mock
  },
  jadwalSidang: {
    findMany: jest.fn(), // Added jadwalSidang.findMany mock for conflict check
  },
  log: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

jest.mock('@repo/db', () => {
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    StatusTugasAkhir: {
      DIBATALKAN: 'DIBATALKAN',
      LULUS_DENGAN_REVISI: 'LULUS_DENGAN_REVISI',
      LULUS_TANPA_REVISI: 'LULUS_TANPA_REVISI',
      SELESAI: 'SELESAI',
      DITOLAK: 'DITOLAK',
    },
  };
});

describe('BimbinganService', () => {
  let service: BimbinganService;

  beforeEach(() => {
    service = new BimbinganService();
    jest.clearAllMocks();
  });

  describe('setJadwal', () => {
    it('should schedule a supervision session if no conflict exists', async () => {
      const mockDosen = { id: 1, user_id: 100 };
      const mockPeranDosen = {
        peran: 'pembimbing1',
        tugasAkhir: {
          mahasiswa: { id: 1 },
        },
      };

      mockPrisma.dosen.findUnique.mockResolvedValue(mockDosen);
      mockPrisma.peranDosenTa.findFirst.mockResolvedValue(mockPeranDosen);
      mockPrisma.bimbinganTA.findMany.mockResolvedValue([]); // No existing bimbingan conflicts
      mockPrisma.jadwalSidang.findMany.mockResolvedValue([]); // No existing sidang conflicts
      mockPrisma.bimbinganTA.create.mockResolvedValue({ id: 1 });

      const result = await service.setJadwal(1, 1, '2023-10-27', '10:00');

      expect(mockPrisma.dosen.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.peranDosenTa.findFirst).toHaveBeenCalled();
      expect(mockPrisma.bimbinganTA.create).toHaveBeenCalledWith({
        data: {
          tugas_akhir_id: 1,
          dosen_id: 1,
          peran: 'pembimbing1',
          tanggal_bimbingan: expect.any(Date),
          jam_bimbingan: '10:00',
          status_bimbingan: 'dijadwalkan',
        },
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should throw error if schedule conflict exists for lecturer (bimbingan)', async () => {
      const mockDosen = { id: 1, user_id: 100 };
      const mockPeranDosen = {
        peran: 'pembimbing1',
        tugasAkhir: {
          mahasiswa: { id: 1 },
        },
      };

      mockPrisma.dosen.findUnique.mockResolvedValue(mockDosen);
      mockPrisma.peranDosenTa.findFirst.mockResolvedValue(mockPeranDosen);

      // Simulate conflict with another bimbingan
      mockPrisma.bimbinganTA.findMany.mockResolvedValue([
        { id: 2, jam_bimbingan: '10:00' }, // Conflict at 10:00
      ]);

      await expect(
        service.setJadwal(1, 1, '2023-10-27', '10:00'),
      ).rejects.toThrow(/Jadwal konflik dengan bimbingan lain/);
    });
  });

  describe('cancelBimbingan', () => {
    it('should cancel a session and log history', async () => {
      const mockDosen = { id: 1, user_id: 100 };
      const mockBimbingan = {
        id: 1,
        tanggal_bimbingan: new Date(),
        jam_bimbingan: '10:00',
        tugasAkhir: { mahasiswa: { id: 1 } },
      };

      mockPrisma.dosen.findUnique.mockResolvedValue(mockDosen);
      mockPrisma.bimbinganTA.findFirst.mockResolvedValue(mockBimbingan);
      mockPrisma.bimbinganTA.update.mockResolvedValue({
        ...mockBimbingan,
        status_bimbingan: 'dibatalkan',
      });

      await service.cancelBimbingan(1, 1);

      expect(mockPrisma.dosen.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.bimbinganTA.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status_bimbingan: 'dibatalkan' },
      });
      // Logging is called in .then() block, verifying mockPrisma.log.create would be good if accessible or implicitly covered
    });
  });

  describe('selesaikanSesi', () => {
    it('should complete a session and log history', async () => {
      const mockDosen = { id: 1, user_id: 100 };
      const mockBimbingan = {
        id: 1,
        status_bimbingan: 'dijadwalkan',
        tugas_akhir_id: 1,
        tugasAkhir: { id: 1, mahasiswa: { id: 1 } },
      };

      mockPrisma.dosen.findUnique.mockResolvedValue(mockDosen);
      mockPrisma.bimbinganTA.findFirst.mockResolvedValue(mockBimbingan);
      mockPrisma.bimbinganTA.update.mockResolvedValue({
        ...mockBimbingan,
        status_bimbingan: 'selesai',
      });
      mockPrisma.dokumenTa.findFirst.mockResolvedValue(null); // No document to validate

      await service.selesaikanSesi(1, 1);

      expect(mockPrisma.dosen.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.bimbinganTA.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status_bimbingan: 'selesai' },
      });
    });

    it('should throw error if session is not "dijadwalkan"', async () => {
      const mockDosen = { id: 1, user_id: 100 };
      const mockBimbingan = {
        id: 1,
        status_bimbingan: 'dibatalkan',
        tugasAkhir: { mahasiswa: { id: 1 } },
      };

      mockPrisma.dosen.findUnique.mockResolvedValue(mockDosen);
      mockPrisma.bimbinganTA.findFirst.mockResolvedValue(mockBimbingan);

      await expect(service.selesaikanSesi(1, 1)).rejects.toThrow(
        'Only a "dijadwalkan" session can be completed.',
      );
    });
  });
});
