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
    
    if (!dosenId) {
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
      },
    });

    // Ambil pengaturan penilaian untuk ditampilkan
    const [rumusSetting, nilaiMinimalSetting, tampilkanRincianSetting] = await Promise.all([
      prisma.pengaturanSistem.findUnique({ where: { key: 'rumus_penilaian' } }),
      prisma.pengaturanSistem.findUnique({ where: { key: 'nilai_minimal_lolos' } }),
      prisma.pengaturanSistem.findUnique({ where: { key: 'tampilkan_rincian_nilai_ke_sekretaris' } }),
    ]);

    const tampilkanRincian = tampilkanRincianSetting?.value === 'true' || tampilkanRincianSetting?.value === 'true' || tampilkanRincianSetting === null;

    res.json({
      status: 'sukses',
      data: sidangList,
      pengaturan_penilaian: tampilkanRincian ? {
        rumus: rumusSetting?.value || '(p1 + p2 + p3) / 3',
        nilai_minimal_lolos: parseFloat(nilaiMinimalSetting?.value || '60'),
        keterangan: 'Berikan nilai sesuai kemampuan mahasiswa secara objektif',
      } : {
        keterangan: 'Berikan nilai sesuai kemampuan mahasiswa secara objektif',
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
    const { sidang_id, nilai_penguji1, nilai_penguji2, nilai_penguji3 } = req.body;

    if (!dosenId) {
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
        message: 'Akses ditolak: Anda bukan sekretaris (pembimbing 1) dari sidang ini',
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
      prisma.pengaturanSistem.findUnique({ where: { key: 'nilai_minimal_lolos' } }),
    ]);

    const rumus = rumusSetting?.value || '(p1 + p2 + p3) / 3';
    const nilaiMinimal = parseFloat(nilaiMinimalSetting?.value || '60');

    // Hitung nilai akhir menggunakan rumus
    const formula = rumus
      .replace(/p1/g, nilai_penguji1.toString())
      .replace(/p2/g, nilai_penguji2.toString())
      .replace(/p3/g, nilai_penguji3.toString());

    let nilaiAkhir: number;
    try {
      nilaiAkhir = eval(formula);
    } catch (error) {
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
            periode_gagal_id: periodeAktif?.id || null,
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

export default router;
