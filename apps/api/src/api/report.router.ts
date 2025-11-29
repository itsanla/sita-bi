import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { ReportService } from '../services/report.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';

const router: Router = Router();
const reportService = new ReportService();

router.use(authMiddleware);

router.get(
  '/dashboard',
  authorizeRoles([Role.admin, Role.dosen]),
  asyncHandler(async (req, res) => {
    const stats = await reportService.getDashboardStats();
    res.json({ status: 'success', data: stats });
  }),
);

router.get(
  '/workload',
  authorizeRoles([Role.admin]),
  asyncHandler(async (req, res) => {
    const data = await reportService.getLecturerWorkload();
    res.json({ status: 'success', data });
  }),
);

// Exports
import { ExportService } from '../services/export.service';
const exportService = new ExportService();

router.get(
  '/export/jadwal-sidang/pdf',
  authorizeRoles([Role.admin]),
  asyncHandler(async (req, res) => {
    const buffer = await exportService.generateJadwalSidangPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=jadwal-sidang.pdf',
    );
    res.send(buffer);
  }),
);

router.get(
  '/export/jadwal-sidang/excel',
  authorizeRoles([Role.admin]),
  asyncHandler(async (req, res) => {
    const buffer = await exportService.generateJadwalSidangExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=jadwal-sidang.xlsx',
    );
    res.send(buffer);
  }),
);

router.get(
  '/export/nilai-sidang/excel',
  authorizeRoles([Role.admin]),
  asyncHandler(async (req, res) => {
    const buffer = await exportService.generateRekapNilaiExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=rekap-nilai.xlsx',
    );
    res.send(buffer);
  }),
);

router.get(
  '/export/users/excel',
  authorizeRoles([Role.admin]),
  asyncHandler(async (req, res) => {
    const buffer = await exportService.generateUsersExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
    res.send(buffer);
  }),
);

router.get(
  '/export/berita-acara/:sidangId',
  authorizeRoles([Role.admin, Role.dosen]),
  asyncHandler(async (req, res) => {
    const { sidangId } = req.params;
    if (sidangId == null || sidangId === '') {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Sidang diperlukan' });
      return;
    }
    const buffer = await exportService.generateBeritaAcaraPdf(
      parseInt(sidangId),
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=berita-acara-${sidangId}.pdf`,
    );
    res.send(buffer);
  }),
);

export default router;
