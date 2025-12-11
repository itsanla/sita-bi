import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles, Role } from '../middlewares/roles.middleware';
import { periodeGuard } from '../middlewares/periode.middleware';
import prisma from '../config/database';

const router: Router = Router();

router.use(asyncHandler(authMiddleware));

// Get sidang yang bisa dinilai (hanya untuk pembimbing1/sekretaris)
router.get(
  '/my-sidang',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const dosenId = req.user?.dosen?.id;

    if (typeof dosenId !== 'number') {
      res.status(403).json({
        status: 'gagal',
        message: 'Akses ditolak: Anda bukan dosen',
      });
      return;
    }

    // Cari periode aktif
    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });

    // Cari sidang dimana dosen ini adalah pembimbing1
    const sidangList = await prisma.sidang.findMany({
      where: {
        is_active: true,
        OR: [
          { periode_ta_id: periodeAktif?.id ?? undefined }, // Sidang dengan periode aktif
          { periode_ta_id: null }, // ATAU sidang tanpa periode (legacy data)
        ],
        tugasAkhir: {
          peranDosenTa: {
            some: {
              dosen_id: dosenId,
              peran: 'pembimbing1', // Hanya pembimbing1
            },
          },
        },
        jadwalSidang: {
          some: {}, // Harus sudah dijadwalkan
        },
      },
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: {
              include: {
                user: true,
              },
            },
            peranDosenTa: {
              where: {
                peran: {
                  in: ['penguji1', 'penguji2', 'penguji3'],
                },
              },
              include: {
                dosen: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        jadwalSidang: {
          include: {
            ruangan: true,
          },
          orderBy: {
            tanggal: 'asc',
          },
          take: 1,
        },
        nilaiSidang: {
          include: {
            dosen: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Ambil pengaturan penilaian untuk ditampilkan
    const [rumusSetting, nilaiMinimalSetting, tampilkanRincianSetting] =
      await Promise.all([
        prisma.pengaturanSistem.findUnique({
          where: { key: 'rumus_penilaian' },
        }),
        prisma.pengaturanSistem.findUnique({
          where: { key: 'nilai_minimal_lolos' },
        }),
        prisma.pengaturanSistem.findUnique({
          where: { key: 'tampilkan_rincian_nilai_ke_sekretaris' },
        }),
      ]);

    const tampilkanRincian =
      tampilkanRincianSetting?.value === 'true' ||
      tampilkanRincianSetting === null;

    const ASPEK_NILAI_SIDANG = 'Nilai Sidang';
    const DEFAULT_RUMUS = '(p1 + p2 + p3) / 3';
    const PERAN_PENGUJI1 = 'penguji1';
    const PERAN_PENGUJI2 = 'penguji2';
    const PERAN_PENGUJI3 = 'penguji3';

    // Hitung nilai akhir untuk setiap sidang yang sudah dinilai
    const sidangWithNilaiAkhir = sidangList.map((sidang) => {
      if (sidang.nilaiSidang?.length === 3) {
        const penguji1DosenId = sidang.tugasAkhir.peranDosenTa.find(
          (p) => p.peran === PERAN_PENGUJI1,
        )?.dosen_id;
        const penguji2DosenId = sidang.tugasAkhir.peranDosenTa.find(
          (p) => p.peran === PERAN_PENGUJI2,
        )?.dosen_id;
        const penguji3DosenId = sidang.tugasAkhir.peranDosenTa.find(
          (p) => p.peran === PERAN_PENGUJI3,
        )?.dosen_id;

        const nilai1 =
          sidang.nilaiSidang.find(
            (n) =>
              n.aspek === ASPEK_NILAI_SIDANG && n.dosen_id === penguji1DosenId,
          )?.skor ?? 0;
        const nilai2 =
          sidang.nilaiSidang.find(
            (n) =>
              n.aspek === ASPEK_NILAI_SIDANG && n.dosen_id === penguji2DosenId,
          )?.skor ?? 0;
        const nilai3 =
          sidang.nilaiSidang.find(
            (n) =>
              n.aspek === ASPEK_NILAI_SIDANG && n.dosen_id === penguji3DosenId,
          )?.skor ?? 0;

        const rumus = rumusSetting?.value ?? DEFAULT_RUMUS;
        const formula = rumus
          .replace(/p1/g, nilai1.toString())
          .replace(/p2/g, nilai2.toString())
          .replace(/p3/g, nilai3.toString());

        try {
          // eslint-disable-next-line sonarjs/code-eval
          const nilaiAkhir = eval(formula) as number;
          return { ...sidang, nilai_akhir: nilaiAkhir };
        } catch {
          return sidang;
        }
      }
      return sidang;
    });

    res.json({
      status: 'sukses',
      data: sidangWithNilaiAkhir,
      pengaturan_penilaian: tampilkanRincian
        ? {
            rumus: rumusSetting?.value ?? DEFAULT_RUMUS,
            nilai_minimal_lolos: parseFloat(nilaiMinimalSetting?.value ?? '60'),
            keterangan:
              'Berikan nilai sesuai kemampuan mahasiswa secara objektif',
          }
        : {
            keterangan:
              'Berikan nilai sesuai kemampuan mahasiswa secara objektif',
          },
    });
  }),
);

// Submit nilai sidang (hanya pembimbing1)
router.post(
  '/submit',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const dosenId = req.user?.dosen?.id;
    const { sidang_id, nilai_penguji1, nilai_penguji2, nilai_penguji3 } =
      req.body;

    if (typeof dosenId !== 'number') {
      res.status(403).json({
        status: 'gagal',
        message: 'Akses ditolak: Anda bukan dosen',
      });
      return;
    }

    // Validasi: pastikan dosen ini adalah pembimbing1 dari sidang ini
    const sidang = await prisma.sidang.findFirst({
      where: {
        id: sidang_id,
        tugasAkhir: {
          peranDosenTa: {
            some: {
              dosen_id: dosenId,
              peran: 'pembimbing1',
            },
          },
        },
      },
      include: {
        tugasAkhir: {
          include: {
            peranDosenTa: {
              where: {
                peran: {
                  in: ['penguji1', 'penguji2', 'penguji3'],
                },
              },
            },
          },
        },
      },
    });

    if (!sidang) {
      res.status(403).json({
        status: 'gagal',
        message:
          'Akses ditolak: Anda bukan sekretaris (pembimbing 1) dari sidang ini',
      });
      return;
    }

    // Validasi: pastikan ada 3 penguji
    const pengujiList = sidang.tugasAkhir.peranDosenTa;
    if (pengujiList.length !== 3) {
      res.status(400).json({
        status: 'gagal',
        message: 'Sidang belum memiliki 3 penguji',
      });
      return;
    }

    // Cek apakah sudah pernah input nilai
    const existingNilai = await prisma.nilaiSidang.findFirst({
      where: { sidang_id },
    });

    if (existingNilai) {
      res.status(400).json({
        status: 'gagal',
        message: 'Nilai sudah pernah diinput untuk sidang ini',
      });
      return;
    }

    // Ambil rumus penilaian dan nilai minimal lolos
    const [rumusSetting, nilaiMinimalSetting] = await Promise.all([
      prisma.pengaturanSistem.findUnique({ where: { key: 'rumus_penilaian' } }),
      prisma.pengaturanSistem.findUnique({
        where: { key: 'nilai_minimal_lolos' },
      }),
    ]);

    const DEFAULT_RUMUS_SUBMIT = '(p1 + p2 + p3) / 3';
    const rumus = rumusSetting?.value ?? DEFAULT_RUMUS_SUBMIT;
    const nilaiMinimal = parseFloat(nilaiMinimalSetting?.value ?? '60');

    // Hitung nilai akhir menggunakan rumus
    const formula = rumus
      .replace(/p1/g, nilai_penguji1.toString())
      .replace(/p2/g, nilai_penguji2.toString())
      .replace(/p3/g, nilai_penguji3.toString());

    let nilaiAkhir: number;
    try {
      // eslint-disable-next-line sonarjs/code-eval
      nilaiAkhir = eval(formula) as number;
    } catch {
      res.status(500).json({
        status: 'gagal',
        message: 'Rumus penilaian tidak valid',
      });
      return;
    }

    // Tentukan status lulus/gagal
    const lulus = nilaiAkhir >= nilaiMinimal;

    // Ambil periode aktif untuk tracking gagal sidang
    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });

    // Simpan nilai dan update status
    await prisma.$transaction(async (tx) => {
      // Simpan nilai dari 3 penguji
      const penguji1 = pengujiList.find((p) => p.peran === 'penguji1');
      const penguji2 = pengujiList.find((p) => p.peran === 'penguji2');
      const penguji3 = pengujiList.find((p) => p.peran === 'penguji3');

      if (!penguji1 || !penguji2 || !penguji3) {
        throw new Error('Penguji tidak lengkap');
      }

      await tx.nilaiSidang.createMany({
        data: [
          {
            sidang_id,
            dosen_id: penguji1.dosen_id,
            periode_ta_id: sidang.periode_ta_id,
            aspek: 'Nilai Sidang',
            skor: nilai_penguji1,
            komentar: 'Nilai dari Penguji 1',
          },
          {
            sidang_id,
            dosen_id: penguji2.dosen_id,
            periode_ta_id: sidang.periode_ta_id,
            aspek: 'Nilai Sidang',
            skor: nilai_penguji2,
            komentar: 'Nilai dari Penguji 2',
          },
          {
            sidang_id,
            dosen_id: penguji3.dosen_id,
            periode_ta_id: sidang.periode_ta_id,
            aspek: 'Nilai Sidang',
            skor: nilai_penguji3,
            komentar: 'Nilai dari Penguji 3',
          },
        ],
      });

      // Update status sidang
      await tx.sidang.update({
        where: { id: sidang_id },
        data: {
          status_hasil: lulus ? 'lulus' : 'tidak_lulus',
          selesai_sidang: true,
        },
      });

      // Update status mahasiswa
      if (lulus) {
        // LULUS: Set status kelulusan LULUS, reset gagal_sidang
        await tx.mahasiswa.update({
          where: { id: sidang.tugasAkhir.mahasiswa_id },
          data: {
            status_kelulusan: 'LULUS',
            gagal_sidang: false,
            periode_gagal_id: null,
            alasan_gagal: null,
            status_gagal: null,
          },
        });
      } else {
        // TIDAK LULUS: Set gagal_sidang true dengan periode aktif
        await tx.mahasiswa.update({
          where: { id: sidang.tugasAkhir.mahasiswa_id },
          data: {
            status_kelulusan: 'BELUM_LULUS',
            gagal_sidang: true,
            periode_gagal_id: periodeAktif !== null ? periodeAktif.id : null,
            alasan_gagal: `Nilai sidang (${nilaiAkhir.toFixed(2)}) tidak mencapai nilai minimal (${nilaiMinimal})`,
            status_gagal: 'NILAI_TIDAK_MEMENUHI',
          },
        });
      }

      // Update status tugas akhir
      await tx.tugasAkhir.update({
        where: { id: sidang.tugas_akhir_id },
        data: {
          status: lulus ? 'LULUS_TANPA_REVISI' : 'GAGAL',
        },
      });
    });

    res.json({
      status: 'sukses',
      message: `Nilai berhasil disimpan. Mahasiswa ${lulus ? 'LULUS' : 'TIDAK LULUS'}`,
      data: {
        nilai_akhir: nilaiAkhir,
        status: lulus ? 'LULUS' : 'TIDAK LULUS',
        nilai_minimal: nilaiMinimal,
      },
    });
  }),
);

// Get hasil sidang untuk mahasiswa
router.get(
  '/hasil-mahasiswa',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res): Promise<void> => {
    const mahasiswaId = req.user?.mahasiswa?.id;

    if (typeof mahasiswaId !== 'number') {
      res.status(403).json({
        status: 'gagal',
        message: 'Akses ditolak: Anda bukan mahasiswa',
      });
      return;
    }

    // Cari sidang mahasiswa yang sudah selesai
    const sidang = await prisma.sidang.findFirst({
      where: {
        is_active: true,
        selesai_sidang: true,
        tugasAkhir: {
          mahasiswa_id: mahasiswaId,
        },
      },
      include: {
        tugasAkhir: {
          include: {
            peranDosenTa: {
              where: {
                peran: {
                  in: ['penguji1', 'penguji2', 'penguji3'],
                },
              },
              include: {
                dosen: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        jadwalSidang: {
          include: {
            ruangan: true,
          },
          orderBy: {
            tanggal: 'asc',
          },
          take: 1,
        },
        nilaiSidang: {
          include: {
            dosen: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!sidang) {
      res.status(404).json({
        status: 'gagal',
        message: 'Hasil sidang belum tersedia',
      });
      return;
    }

    // Ambil pengaturan penilaian
    const [rumusSetting, nilaiMinimalSetting] = await Promise.all([
      prisma.pengaturanSistem.findUnique({ where: { key: 'rumus_penilaian' } }),
      prisma.pengaturanSistem.findUnique({
        where: { key: 'nilai_minimal_lolos' },
      }),
    ]);

    const DEFAULT_RUMUS_MAHASISWA = '(p1 + p2 + p3) / 3';
    const ASPEK_NILAI = 'Nilai Sidang';
    const PERAN_P1 = 'penguji1';
    const PERAN_P2 = 'penguji2';
    const PERAN_P3 = 'penguji3';

    // Hitung nilai akhir
    let nilaiAkhir: number | undefined;
    if (sidang.nilaiSidang?.length === 3) {
      const nilaiSidangList = sidang.nilaiSidang;
      const penguji1DosenId = sidang.tugasAkhir.peranDosenTa.find(
        (p) => p.peran === PERAN_P1,
      )?.dosen_id;
      const penguji2DosenId = sidang.tugasAkhir.peranDosenTa.find(
        (p) => p.peran === PERAN_P2,
      )?.dosen_id;
      const penguji3DosenId = sidang.tugasAkhir.peranDosenTa.find(
        (p) => p.peran === PERAN_P3,
      )?.dosen_id;

      const nilai1 =
        nilaiSidangList.find(
          (n) => n.aspek === ASPEK_NILAI && n.dosen_id === penguji1DosenId,
        )?.skor ?? 0;
      const nilai2 =
        nilaiSidangList.find(
          (n) => n.aspek === ASPEK_NILAI && n.dosen_id === penguji2DosenId,
        )?.skor ?? 0;
      const nilai3 =
        nilaiSidangList.find(
          (n) => n.aspek === ASPEK_NILAI && n.dosen_id === penguji3DosenId,
        )?.skor ?? 0;

      const rumus = rumusSetting?.value ?? DEFAULT_RUMUS_MAHASISWA;
      const formula = rumus
        .replace(/p1/g, nilai1.toString())
        .replace(/p2/g, nilai2.toString())
        .replace(/p3/g, nilai3.toString());

      try {
        // eslint-disable-next-line sonarjs/code-eval
        nilaiAkhir = eval(formula) as number;
      } catch {
        nilaiAkhir = undefined;
      }
    }

    res.json({
      status: 'sukses',
      data: {
        ...sidang,
        nilai_akhir: nilaiAkhir,
      },
      pengaturan_penilaian: {
        rumus: rumusSetting?.value ?? DEFAULT_RUMUS_MAHASISWA,
        nilai_minimal_lolos: parseFloat(nilaiMinimalSetting?.value ?? '60'),
        keterangan: 'Informasi penilaian sidang tugas akhir',
      },
    });
  }),
);

export default router;
