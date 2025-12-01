import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { PengajuanService } from '../services/pengajuan.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();
const pengajuanService = new PengajuanService();

// All routes in this router are protected
router.use(asyncHandler(authMiddleware));

// Endpoint untuk mahasiswa mengajukan ke dosen
router.post(
  '/mahasiswa',
  asyncHandler(async (req, res) => {
    if (typeof req.user?.mahasiswa?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Anda bukan mahasiswa',
      });
      return;
    }

    const mahasiswaId = req.user.mahasiswa.id;
    const { dosenId, peran } = req.body;

    if (typeof dosenId !== 'number' && typeof dosenId !== 'string') {
      res.status(400).json({
        status: 'gagal',
        message: 'ID dosen diperlukan',
      });
      return;
    }

    if (!peran || !['pembimbing1', 'pembimbing2'].includes(peran)) {
      res.status(400).json({
        status: 'gagal',
        message: 'Peran harus pembimbing1 atau pembimbing2',
      });
      return;
    }

    try {
      const result = await pengajuanService.ajukanKeDosen(
        mahasiswaId,
        parseInt(String(dosenId), 10),
        peran,
      );
      res.status(201).json({ status: 'sukses', data: result });
    } catch (_error) {
      res.status(400).json({
        status: 'gagal',
        message: _error instanceof Error ? _error.message : 'Terjadi kesalahan',
      });
    }
  }),
);

// Endpoint untuk mendapatkan pengajuan mahasiswa
router.get(
  '/mahasiswa',
  asyncHandler(async (req, res) => {
    if (typeof req.user?.mahasiswa?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Anda bukan mahasiswa',
      });

      return;
    }

    const mahasiswaId = req.user.mahasiswa.id;

    try {
      const result = await pengajuanService.getPengajuanMahasiswa(mahasiswaId);
      const resultData = result as { pengajuan: any[]; pembimbingAktif: any[]; pelepasan: any[] };
      res.status(200).json({ 
        status: 'sukses', 
        data: resultData.pengajuan,
        pembimbingAktif: resultData.pembimbingAktif,
        pelepasan: resultData.pelepasan 
      });
    } catch (_error) {
      res.status(500).json({
        status: 'gagal',
        message: 'Gagal mendapatkan data pengajuan',
      });
    }
  }),
);

// Endpoint untuk dosen menawarkan ke mahasiswa
router.post(
  '/dosen',
  asyncHandler(async (req, res) => {
    if (typeof req.user?.dosen?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Anda bukan dosen',
      });
      return;
    }

    const dosenId = req.user.dosen.id;
    const { mahasiswaId, peran } = req.body;

    if (typeof mahasiswaId !== 'number' && typeof mahasiswaId !== 'string') {
      res.status(400).json({
        status: 'gagal',
        message: 'ID mahasiswa diperlukan',
      });
      return;
    }

    if (!peran || !['pembimbing1', 'pembimbing2'].includes(peran)) {
      res.status(400).json({
        status: 'gagal',
        message: 'Peran harus pembimbing1 atau pembimbing2',
      });
      return;
    }

    try {
      const result = await pengajuanService.tawariMahasiswa(
        dosenId,
        parseInt(String(mahasiswaId), 10),
        peran,
      );
      res.status(201).json({ status: 'sukses', data: result });
    } catch (_error) {
      res.status(400).json({
        status: 'gagal',
        message: _error instanceof Error ? _error.message : 'Terjadi kesalahan',
      });
    }
  }),
);

// Endpoint untuk mendapatkan pengajuan dosen
router.get(
  '/dosen',
  asyncHandler(async (req, res) => {
    if (typeof req.user?.dosen?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Anda bukan dosen',
      });

      return;
    }

    const dosenId = req.user.dosen.id;

    try {
      const result = await pengajuanService.getPengajuanDosen(dosenId);
      const resultData = result as { pengajuan: any[]; mahasiswaBimbingan: any[] };
      res.status(200).json({ 
        status: 'sukses', 
        data: resultData.pengajuan,
        mahasiswaBimbingan: resultData.mahasiswaBimbingan 
      });
    } catch (_error) {
      res.status(500).json({
        status: 'gagal',
        message: 'Gagal mendapatkan data pengajuan',
      });
    }
  }),
);

// Endpoint untuk menerima pengajuan
router.post(
  '/:id/terima',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID pengajuan diperlukan',
      });

      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Unauthorized',
      });

      return;
    }

    try {
      const result = await pengajuanService.terimaPengajuan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: 'sukses', data: result });
    } catch (error) {
      res.status(400).json({
        status: 'gagal',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }),
);

// Endpoint untuk menolak pengajuan
router.post(
  '/:id/tolak',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID pengajuan diperlukan',
      });

      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Unauthorized',
      });

      return;
    }

    try {
      const result = await pengajuanService.tolakPengajuan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: 'sukses', data: result });
    } catch (error) {
      res.status(400).json({
        status: 'gagal',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }),
);

// Endpoint untuk membatalkan pengajuan
router.post(
  '/:id/batalkan',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID pengajuan diperlukan',
      });

      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Unauthorized',
      });

      return;
    }

    try {
      const result = await pengajuanService.batalkanPengajuan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: 'sukses', data: result });
    } catch (error) {
      res.status(400).json({
        status: 'gagal',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }),
);

// Endpoint untuk mendapatkan list dosen tersedia
router.get(
  '/dosen-tersedia',
  asyncHandler(async (req, res) => {
    try {
      const result = await pengajuanService.getAvailableDosen();
      res.status(200).json({ status: 'sukses', data: result });
    } catch (_error) {
      res.status(500).json({
        status: 'gagal',
        message: 'Gagal mendapatkan data dosen',
      });
    }
  }),
);

// Endpoint untuk mendapatkan list mahasiswa tersedia (untuk dosen)
router.get(
  '/mahasiswa-tersedia',
  asyncHandler(async (req, res) => {
    if (typeof req.user?.dosen?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Anda bukan dosen',
      });
      return;
    }

    try {
      const result = await pengajuanService.getAvailableMahasiswa();
      res.status(200).json({ status: 'sukses', data: result });
    } catch (_error) {
      res.status(500).json({
        status: 'gagal',
        message: 'Gagal mendapatkan data mahasiswa',
      });
    }
  }),
);

// Endpoint untuk mengajukan pelepasan bimbingan
router.post(
  '/lepaskan',
  asyncHandler(async (req, res) => {
    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Unauthorized',
      });
      return;
    }

    const { peranDosenTaId } = req.body;

    if (typeof peranDosenTaId !== 'number') {
      res.status(400).json({
        status: 'gagal',
        message: 'ID peran dosen TA diperlukan',
      });
      return;
    }

    try {
      const result = await pengajuanService.ajukanPelepasanBimbingan(
        peranDosenTaId,
        req.user.id,
      );
      res.status(201).json({ status: 'sukses', data: result });
    } catch (error) {
      res.status(400).json({
        status: 'gagal',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }),
);

// Endpoint untuk konfirmasi pelepasan bimbingan
router.post(
  '/lepaskan/:id/konfirmasi',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID pengajuan pelepasan diperlukan',
      });
      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Unauthorized',
      });
      return;
    }

    try {
      const result = await pengajuanService.konfirmasiPelepasanBimbingan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: 'sukses', data: result });
    } catch (error) {
      res.status(400).json({
        status: 'gagal',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }),
);

// Endpoint untuk menolak pelepasan bimbingan
router.post(
  '/lepaskan/:id/tolak',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID pengajuan pelepasan diperlukan',
      });
      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Unauthorized',
      });
      return;
    }

    try {
      const result = await pengajuanService.tolakPelepasanBimbingan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: 'sukses', data: result });
    } catch (error) {
      res.status(400).json({
        status: 'gagal',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }),
);

// Endpoint untuk membatalkan pelepasan bimbingan (oleh yang mengajukan)
router.post(
  '/lepaskan/:id/batalkan',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: 'gagal',
        message: 'ID pengajuan pelepasan diperlukan',
      });
      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: 'gagal',
        message: 'Unauthorized',
      });
      return;
    }

    try {
      const result = await pengajuanService.batalkanPelepasanBimbingan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: 'sukses', data: result });
    } catch (error) {
      res.status(400).json({
        status: 'gagal',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }),
);

export default router;
