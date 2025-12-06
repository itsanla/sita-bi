import { Router } from 'express';
import { PeriodeService } from '../services/periode.service';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';
import { auditLog } from '../middlewares/audit.middleware';

const router = Router();
const periodeService = new PeriodeService();

router.get(
  '/',
  asyncHandler(authMiddleware),
  asyncHandler(async (req, res) => {
    const periodes = await periodeService.getAllPeriode();
    res.json({
      status: 'sukses',
      data: periodes,
    });
  }),
);

router.get(
  '/aktif',
  asyncHandler(async (req, res) => {
    const periode = await periodeService.getActivePeriode();
    res.json({
      status: 'sukses',
      data: periode,
    });
  }),
);

router.get(
  '/status',
  asyncHandler(async (req, res) => {
    const status = await periodeService.getPeriodeStatus();
    res.json({
      status: 'sukses',
      data: status,
    });
  }),
);

router.post(
  '/buka',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('BUKA_PERIODE', 'periode'),
  asyncHandler(async (req, res) => {
    const { tahun, tanggal_buka } = req.body as {
      tahun: number;
      tanggal_buka?: string;
    };
    const userId = req.user?.id;

    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Pengguna tidak ditemukan',
      });
      return;
    }

    if (!tahun || typeof tahun !== 'number' || tahun < 2000 || tahun > 2100) {
      res.status(400).json({
        status: 'gagal',
        message: 'Tahun tidak valid (harus antara 2000-2100)',
      });
      return;
    }

    const periode = await periodeService.bukaPeriode(
      tahun,
      userId,
      tanggal_buka,
    );
    
    const message = tanggal_buka
      ? `Jadwal pembukaan Periode TA ${tahun} berhasil disimpan`
      : `Periode TA ${tahun} berhasil dibuka`;
    
    res.status(201).json({
      status: 'sukses',
      message,
      data: periode,
    });
  }),
);

router.patch(
  '/:id/jadwal-buka',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('ATUR_JADWAL_PERIODE', 'periode'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tanggal_buka } = req.body as { tanggal_buka: string };

    if (!tanggal_buka || typeof tanggal_buka !== 'string') {
      res.status(400).json({
        status: 'gagal',
        message: 'Tanggal pembukaan harus diisi',
      });
      return;
    }

    const periodeId = parseInt(id, 10);
    if (Number.isNaN(periodeId)) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID periode tidak valid',
      });
      return;
    }

    const periode = await periodeService.setJadwalBuka(
      periodeId,
      tanggal_buka,
    );
    res.json({
      status: 'sukses',
      message: 'Jadwal pembukaan periode berhasil diatur',
      data: periode,
    });
  }),
);

router.post(
  '/:id/tutup',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('TUTUP_PERIODE', 'periode'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { catatan } = req.body as { catatan?: string };
    const userId = req.user?.id;

    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Pengguna tidak ditemukan',
      });
      return;
    }

    const periodeId = parseInt(id, 10);
    if (Number.isNaN(periodeId)) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID periode tidak valid',
      });
      return;
    }

    const periode = await periodeService.tutupPeriode(
      periodeId,
      userId,
      catatan,
    );
    res.json({
      status: 'sukses',
      message: `Periode TA ${periode.tahun} berhasil ditutup`,
      data: periode,
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('HAPUS_PERIODE', 'periode'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const periodeId = parseInt(id, 10);
    if (Number.isNaN(periodeId)) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID periode tidak valid',
      });
      return;
    }

    await periodeService.hapusPeriode(periodeId);
    res.json({
      status: 'sukses',
      message: 'Periode berhasil dihapus',
    });
  }),
);

router.post(
  '/:id/buka-sekarang',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('BUKA_PERIODE_SEKARANG', 'periode'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const periodeId = parseInt(id, 10);
    if (Number.isNaN(periodeId)) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID periode tidak valid',
      });
      return;
    }

    const periode = await periodeService.bukaSekarang(periodeId);
    res.json({
      status: 'sukses',
      message: `Periode TA ${periode.tahun} berhasil dibuka`,
      data: periode,
    });
  }),
);

router.delete(
  '/:id/batalkan-jadwal',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('BATALKAN_JADWAL_PERIODE', 'periode'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const periodeId = parseInt(id, 10);
    if (Number.isNaN(periodeId)) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID periode tidak valid',
      });
      return;
    }

    const periode = await periodeService.batalkanJadwal(periodeId);
    res.json({
      status: 'sukses',
      message: 'Jadwal pembukaan periode dibatalkan',
      data: periode,
    });
  }),
);

export default router;
