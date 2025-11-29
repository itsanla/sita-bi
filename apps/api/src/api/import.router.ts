import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { ImportService } from '../services/import.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';
import multer from 'multer';

const router: Router = Router();
const importService = new ImportService();
const upload = multer();

router.use(authMiddleware);
router.use(authorizeRoles([Role.admin]));

router.post(
  '/validate/mahasiswa',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ status: 'gagal', message: 'File required' });
      return;
    }
    const result = await importService.validateMahasiswaCsv(req.file.buffer);
    res.json({ status: 'sukses', data: result });
  }),
);

router.post(
  '/validate/dosen',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ status: 'gagal', message: 'File required' });
      return;
    }
    const result = await importService.validateDosenCsv(req.file.buffer);
    res.json({ status: 'sukses', data: result });
  }),
);

router.post(
  '/execute/mahasiswa',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ status: 'gagal', message: 'File required' });
      return;
    }
    const result = await importService.executeImportMahasiswa(req.file.buffer);
    res.json({ status: 'sukses', data: result });
  }),
);

router.post(
  '/execute/dosen',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ status: 'gagal', message: 'File required' });
      return;
    }
    const result = await importService.executeImportDosen(req.file.buffer);
    res.json({ status: 'sukses', data: result });
  }),
);

export default router;
