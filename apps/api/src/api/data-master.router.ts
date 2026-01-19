import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import prisma from '../config/database';
import { ExportService } from '../services/export.service';

const router: Router = Router();
const exportService = new ExportService();

const TIDAK_TERCATAT = 'Tidak Tercatat';

router.get(
  '/judul-ta',
  asyncHandler(async (req, res): Promise<void> => {
    const { tahun, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      periodeTa: { status: { in: ['AKTIF', 'SELESAI'] } },
    };

    if (typeof tahun === 'string' && tahun !== '') {
      where.periodeTa.tahun = parseInt(tahun);
    }

    if (typeof search === 'string' && search !== '') {
      where.OR = [
        { judul: { contains: search } },
        { mahasiswa: { user: { name: { contains: search } } } },
        { mahasiswa: { nim: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.tugasAkhir.findMany({
        where,
        include: {
          mahasiswa: { include: { user: true } },
          periodeTa: true,
        },
        orderBy: [
          { periodeTa: { tahun: 'desc' } },
          { mahasiswa: { nim: 'asc' } },
        ],
        skip,
        take: limitNum,
      }),
      prisma.tugasAkhir.count({ where }),
    ]);

    const result = data.map((ta, index) => ({
      no: skip + index + 1,
      nim: ta.mahasiswa.nim,
      nama_mahasiswa: ta.mahasiswa.user.name,
      judul: ta.judul,
      tahun: ta.periodeTa?.tahun,
    }));

    res.json({
      status: 'sukses',
      data: result,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }),
);

router.get(
  '/jadwal-ta',
  asyncHandler(async (req, res): Promise<void> => {
    const { tahun, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: {
      periodeTa?: { tahun: number };
      sidang?: {
        tugasAkhir?: {
          OR?: {
            judul?: { contains: string };
            mahasiswa?: {
              user?: { name?: { contains: string } };
              nim?: { contains: string };
            };
          }[];
        };
      };
    } = {};

    if (typeof tahun === 'string' && tahun !== '') {
      where.periodeTa = { tahun: parseInt(tahun) };
    }

    if (typeof search === 'string' && search !== '') {
      where.sidang = {
        tugasAkhir: {
          OR: [
            { judul: { contains: search } },
            { mahasiswa: { user: { name: { contains: search } } } },
            { mahasiswa: { nim: { contains: search } } },
          ],
        },
      };
    }

    const [data, total] = await Promise.all([
      prisma.jadwalSidang.findMany({
        where,
        include: {
          ruangan: true,
          sidang: {
            include: {
              tugasAkhir: {
                include: {
                  mahasiswa: { include: { user: true } },
                  peranDosenTa: {
                    include: {
                      dosen: { include: { user: true } },
                    },
                  },
                },
              },
            },
          },
          periodeTa: true,
        },
        orderBy: { tanggal: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.jadwalSidang.count({ where }),
    ]);

    const result = data.map((jadwal) => {
      const pembimbing1 = jadwal.sidang.tugasAkhir.peranDosenTa.find(
        (p) => p.peran === 'pembimbing1',
      );
      const pembimbing2 = jadwal.sidang.tugasAkhir.peranDosenTa.find(
        (p) => p.peran === 'pembimbing2',
      );
      const penguji1 = jadwal.sidang.tugasAkhir.peranDosenTa.find(
        (p) => p.peran === 'penguji1',
      );
      const penguji2 = jadwal.sidang.tugasAkhir.peranDosenTa.find(
        (p) => p.peran === 'penguji2',
      );
      const penguji3 = jadwal.sidang.tugasAkhir.peranDosenTa.find(
        (p) => p.peran === 'penguji3',
      );

      return {
        tanggal: jadwal.tanggal,
        waktu_mulai: jadwal.waktu_mulai,
        waktu_selesai: jadwal.waktu_selesai,
        ruangan: jadwal.ruangan.nama_ruangan,
        nim: jadwal.sidang.tugasAkhir.mahasiswa.nim,
        nama_mahasiswa: jadwal.sidang.tugasAkhir.mahasiswa.user.name,
        judul: jadwal.sidang.tugasAkhir.judul,
        pembimbing_1: pembimbing1?.dosen.user.name ?? TIDAK_TERCATAT,
        pembimbing_2: pembimbing2?.dosen.user.name ?? TIDAK_TERCATAT,
        penguji_1: penguji1?.dosen.user.name ?? TIDAK_TERCATAT,
        penguji_2: penguji2?.dosen.user.name ?? TIDAK_TERCATAT,
        penguji_3: penguji3?.dosen.user.name ?? TIDAK_TERCATAT,
        tahun: jadwal.periodeTa?.tahun,
      };
    });

    res.json({
      status: 'sukses',
      data: result,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }),
);

router.get(
  '/jadwal-ta-dosen',
  asyncHandler(async (req, res): Promise<void> => {
    const { tahun, dosen_id, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: {
      periodeTa?: { tahun: number };
      sidang?: {
        tugasAkhir?: {
          peranDosenTa?: {
            some?: { dosen_id?: number };
          };
          OR?: {
            judul?: { contains: string };
            mahasiswa?: {
              user?: { name?: { contains: string } };
              nim?: { contains: string };
            };
          }[];
        };
      };
    } = {};

    if (typeof tahun === 'string' && tahun !== '') {
      where.periodeTa = { tahun: parseInt(tahun) };
    }

    if (typeof dosen_id === 'string' && dosen_id !== '') {
      where.sidang = {
        tugasAkhir: {
          peranDosenTa: {
            some: { dosen_id: parseInt(dosen_id) },
          },
        },
      };
    }

    if (typeof search === 'string' && search !== '') {
      if (!where.sidang) where.sidang = {};
      if (!where.sidang.tugasAkhir) where.sidang.tugasAkhir = {};
      where.sidang.tugasAkhir.OR = [
        { judul: { contains: search } },
        { mahasiswa: { user: { name: { contains: search } } } },
        { mahasiswa: { nim: { contains: search } } },
      ];
    }

    const allData = await prisma.jadwalSidang.findMany({
      where,
      include: {
        ruangan: true,
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                mahasiswa: { include: { user: true } },
                peranDosenTa: {
                  include: {
                    dosen: { include: { user: true } },
                  },
                },
              },
            },
          },
        },
        periodeTa: true,
      },
      orderBy: { tanggal: 'asc' },
    });

    const allResult: any[] = [];
    allData.forEach((jadwal) => {
      jadwal.sidang.tugasAkhir.peranDosenTa.forEach((peran) => {
        if (
          !['pembimbing1', 'penguji1', 'penguji2', 'penguji3'].includes(
            peran.peran,
          )
        ) {
          return;
        }

        if (dosen_id && peran.dosen_id !== parseInt(dosen_id as string)) {
          return;
        }

        const peranLabel =
          ({
            pembimbing1: 'Ketua',
            pembimbing2: 'Pembimbing 2',
            penguji1: 'Anggota 1',
            penguji2: 'Anggota 2',
            penguji3: 'Sekretaris',
          } as any)[peran.peran] || peran.peran;

        allResult.push({
          nama_dosen: peran.dosen.user.name,
          tanggal: jadwal.tanggal,
          waktu_mulai: jadwal.waktu_mulai,
          waktu_selesai: jadwal.waktu_selesai,
          ruangan: jadwal.ruangan.nama_ruangan,
          nim: jadwal.sidang.tugasAkhir.mahasiswa.nim,
          nama_mahasiswa: jadwal.sidang.tugasAkhir.mahasiswa.user.name,
          judul: jadwal.sidang.tugasAkhir.judul,
          peran: peranLabel,
          tahun: jadwal.periodeTa?.tahun,
        });
      });
    });

    const total = allResult.length;
    const result = allResult.slice(skip, skip + limitNum);

    res.json({
      status: 'sukses',
      data: result,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }),
);

router.get(
  '/periode',
  asyncHandler(async (req, res): Promise<void> => {
    const periode = await prisma.periodeTa.findMany({
      where: { status: { in: ['AKTIF', 'SELESAI'] } },
      select: { tahun: true, nama: true },
      orderBy: { tahun: 'desc' },
    });

    res.json({
      status: 'sukses',
      data: periode,
    });
  }),
);

router.get(
  '/dosen',
  asyncHandler(async (req, res): Promise<void> => {
    const dosen = await prisma.dosen.findMany({
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
    });

    const result = dosen.map((d) => ({
      id: d.id,
      nama: d.user.name,
      nip: d.nip,
    }));

    res.json({
      status: 'sukses',
      data: result,
    });
  }),
);

router.get(
  '/export/judul-pdf',
  asyncHandler(async (req, res): Promise<void> => {
    const { tahun } = req.query;

    const where: any = {
      periodeTa: { status: { in: ['AKTIF', 'SELESAI'] } },
    };
    if (typeof tahun === 'string' && tahun !== '') {
      where.periodeTa.tahun = parseInt(tahun);
    }

    const judulData = await prisma.tugasAkhir.findMany({
      where,
      include: {
        mahasiswa: { include: { user: true } },
      },
      orderBy: { mahasiswa: { nim: 'asc' } },
    });

    const exportData = judulData.map((ta, idx) => ({
      no: idx + 1,
      nim: ta.mahasiswa.nim,
      nama: ta.mahasiswa.user.name,
      judul: ta.judul,
    }));

    const buffer = await Promise.race([
      exportService.generatePDFJudulTA(exportData),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error('PDF generation timeout')), 25000);
      })
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=judul-ta-${Date.now()}.pdf`,
    );
    res.send(buffer);
  }),
);

router.get(
  '/export/jadwal-pdf',
  asyncHandler(async (req, res): Promise<void> => {
    const { tahun } = req.query;

    const where: any = {};
    if (typeof tahun === 'string' && tahun !== '') {
      where.periodeTa = { tahun: parseInt(tahun) };
    }

    const jadwalData = await prisma.jadwalSidang.findMany({
      where,
      include: {
        ruangan: true,
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                mahasiswa: { include: { user: true } },
                peranDosenTa: {
                  include: {
                    dosen: { include: { user: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { tanggal: 'asc' },
    });

    const exportData = jadwalData.map((item) => {
      const mhs = item.sidang.tugasAkhir.mahasiswa;
      const peran = item.sidang.tugasAkhir.peranDosenTa;
      const ketua = peran.find((p) => p.peran === 'pembimbing1');
      const sekretaris = peran.find((p) => p.peran === 'penguji3');
      const anggota1 = peran.find((p) => p.peran === 'penguji1');
      const anggota2 = peran.find((p) => p.peran === 'penguji2');

      const tanggal = new Date(item.tanggal);
      const hariMap = [
        'Minggu',
        'Senin',
        'Selasa',
        'Rabu',
        'Kamis',
        'Jumat',
        'Sabtu',
      ];
      const hari = hariMap[tanggal.getDay()];
      const tanggalStr = tanggal.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      return {
        mahasiswa: mhs.user.name,
        nim: mhs.nim,
        ketua: ketua?.dosen.user.name || '-',
        sekretaris: sekretaris?.dosen.user.name || '-',
        anggota1: anggota1?.dosen.user.name || '-',
        anggota2: anggota2?.dosen.user.name || '-',
        hari_tanggal: `${hari}, ${tanggalStr}`,
        pukul: `${item.waktu_mulai} - ${item.waktu_selesai}`,
        ruangan: item.ruangan.nama_ruangan,
      };
    });

    const buffer = await Promise.race([
      exportService.generatePDF(exportData),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error('PDF generation timeout')), 25000);
      })
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=jadwal-sidang-${Date.now()}.pdf`,
    );
    res.send(buffer);
  }),
);

router.get(
  '/export/jadwal-dosen-pdf',
  asyncHandler(async (req, res): Promise<void> => {
    const { tahun, dosen_id } = req.query;

    const where: any = {};
    if (typeof tahun === 'string' && tahun !== '') {
      where.periodeTa = { tahun: parseInt(tahun) };
    }
    if (typeof dosen_id === 'string' && dosen_id !== '') {
      where.sidang = {
        tugasAkhir: {
          peranDosenTa: {
            some: { dosen_id: parseInt(dosen_id) },
          },
        },
      };
    }

    const jadwalData = await prisma.jadwalSidang.findMany({
      where,
      include: {
        ruangan: true,
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                mahasiswa: { include: { user: true } },
                peranDosenTa: {
                  include: {
                    dosen: { include: { user: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { tanggal: 'asc' },
    });

    const exportData: any[] = [];
    jadwalData.forEach((jadwal) => {
      jadwal.sidang.tugasAkhir.peranDosenTa.forEach((peran) => {
        if (
          !['pembimbing1', 'penguji1', 'penguji2', 'penguji3'].includes(
            peran.peran,
          )
        )
          return;
        if (dosen_id && peran.dosen_id !== parseInt(dosen_id as string)) return;

        const peranLabel =
          ({
            pembimbing1: 'Ketua',
            pembimbing2: 'Pembimbing 2',
            penguji1: 'Anggota 1',
            penguji2: 'Anggota 2',
            penguji3: 'Sekretaris',
          } as any)[peran.peran] || peran.peran;

        exportData.push({
          no: exportData.length + 1,
          nama_dosen: peran.dosen.user.name,
          tanggal: new Date(jadwal.tanggal).toLocaleDateString('id-ID'),
          waktu: `${jadwal.waktu_mulai}-${jadwal.waktu_selesai}`,
          ruangan: jadwal.ruangan.nama_ruangan,
          mahasiswa: jadwal.sidang.tugasAkhir.mahasiswa.user.name,
          nim: jadwal.sidang.tugasAkhir.mahasiswa.nim,
          peran: peranLabel,
        });
      });
    });

    const buffer = await Promise.race([
      exportService.generatePDFJadwalDosen(exportData),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error('PDF generation timeout')), 25000);
      })
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=jadwal-dosen-${Date.now()}.pdf`,
    );
    res.send(buffer);
  }),
);

export default router;
