import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { PengajuanService } from '../services/pengajuan.service';
import { authMiddleware, Role } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { periodeGuard } from '../middlewares/periode.middleware';

const MSG_GAGAL = 'gagal';
const MSG_SUKSES = 'sukses';
const MSG_UNAUTHORIZED = 'Akses ditolak';
const MSG_TERJADI_KESALAHAN = 'Terjadi kesalahan';
const MSG_ID_PENGAJUAN_DIPERLUKAN = 'ID pengajuan diperlukan';
const MSG_ID_PELEPASAN_DIPERLUKAN = 'ID pelepasan diperlukan';
const MSG_GAGAL_DATA_PENGAJUAN = 'Gagal mengambil data pengajuan';
const MSG_AKSES_DITOLAK_DOSEN = 'Akses ditolak: Anda bukan dosen';
const MSG_GAGAL_DATA_DOSEN = 'Gagal mengambil data dosen';
const MSG_GAGAL_DATA_MAHASISWA = 'Gagal mengambil data mahasiswa';

const router: Router = Router();
const pengajuanService = new PengajuanService();

// All routes in this router are protected
router.use(asyncHandler(authMiddleware));

// Endpoint untuk mahasiswa mengajukan ke dosen
router.post(
  '/mahasiswa',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res) => {
    if (typeof req.user?.mahasiswa?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: 'Akses ditolak: Anda bukan mahasiswa',
      });
      return;
    }

    const mahasiswaId = req.user.mahasiswa.id;
    const { dosenId, peran } = req.body;

    if (dosenId === undefined || dosenId === null) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: 'ID dosen diperlukan',
      });
      return;
    }

    if (
      peran === undefined ||
      peran === null ||
      !['pembimbing1', 'pembimbing2'].includes(peran)
    ) {
      res.status(400).json({
        status: MSG_GAGAL,
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
      res.status(201).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_TERJADI_KESALAHAN,
      });
    }
  }),
);

// Endpoint untuk mendapatkan pengajuan mahasiswa
router.get(
  '/mahasiswa',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res) => {
    if (typeof req.user?.mahasiswa?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: 'Akses ditolak: Anda bukan mahasiswa',
      });

      return;
    }

    const mahasiswaId = req.user.mahasiswa.id;

    try {
      const result = await pengajuanService.getPengajuanMahasiswa(mahasiswaId);
      const resultData = result as {
        pengajuan: unknown[];
        pembimbingAktif: unknown[];
        pelepasan: unknown[];
      };
      res.status(200).json({
        status: MSG_SUKSES,
        data: resultData.pengajuan,
        pembimbingAktif: resultData.pembimbingAktif,
        pelepasan: resultData.pelepasan,
      });
    } catch (error) {
      res.status(500).json({
        status: MSG_GAGAL,
        message:
          error instanceof Error ? error.message : MSG_GAGAL_DATA_PENGAJUAN,
      });
    }
  }),
);

// Endpoint untuk dosen menawarkan ke mahasiswa
router.post(
  '/dosen',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res) => {
    if (typeof req.user?.dosen?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_AKSES_DITOLAK_DOSEN,
      });
      return;
    }

    const dosenId = req.user.dosen.id;
    const { mahasiswaId, peran } = req.body;

    if (mahasiswaId === undefined || mahasiswaId === null) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: 'ID mahasiswa diperlukan',
      });
      return;
    }

    if (
      peran === undefined ||
      peran === null ||
      !['pembimbing1', 'pembimbing2'].includes(peran)
    ) {
      res.status(400).json({
        status: MSG_GAGAL,
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
      res.status(201).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_TERJADI_KESALAHAN,
      });
    }
  }),
);

// Endpoint untuk mendapatkan pengajuan dosen
router.get(
  '/dosen',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res) => {
    if (typeof req.user?.dosen?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_AKSES_DITOLAK_DOSEN,
      });

      return;
    }

    const dosenId = req.user.dosen.id;

    try {
      const result = await pengajuanService.getPengajuanDosen(dosenId);
      const resultData = result as {
        pengajuan: unknown[];
        mahasiswaBimbingan: unknown[];
      };
      res.status(200).json({
        status: MSG_SUKSES,
        data: resultData.pengajuan,
        mahasiswaBimbingan: resultData.mahasiswaBimbingan,
      });
    } catch (error) {
      res.status(500).json({
        status: MSG_GAGAL,
        message:
          error instanceof Error ? error.message : MSG_GAGAL_DATA_PENGAJUAN,
      });
    }
  }),
);

// Endpoint untuk menerima pengajuan
router.post(
  '/:id/terima',
  periodeGuard(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: MSG_ID_PENGAJUAN_DIPERLUKAN,
      });

      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_UNAUTHORIZED,
      });

      return;
    }

    try {
      const result = await pengajuanService.terimaPengajuan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_TERJADI_KESALAHAN,
      });
    }
  }),
);

// Endpoint untuk menolak pengajuan
router.post(
  '/:id/tolak',
  periodeGuard(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: MSG_ID_PENGAJUAN_DIPERLUKAN,
      });

      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_UNAUTHORIZED,
      });

      return;
    }

    try {
      const result = await pengajuanService.tolakPengajuan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_TERJADI_KESALAHAN,
      });
    }
  }),
);

// Endpoint untuk membatalkan pengajuan
router.post(
  '/:id/batalkan',
  periodeGuard(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: MSG_ID_PENGAJUAN_DIPERLUKAN,
      });

      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_UNAUTHORIZED,
      });

      return;
    }

    try {
      const result = await pengajuanService.batalkanPengajuan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_TERJADI_KESALAHAN,
      });
    }
  }),
);

// Endpoint untuk mendapatkan list dosen tersedia
router.get(
  '/dosen-tersedia',
  periodeGuard(),
  asyncHandler(async (req, res) => {
    try {
      const result = await pengajuanService.getAvailableDosen();
      res.status(200).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(500).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_GAGAL_DATA_DOSEN,
      });
    }
  }),
);

// Endpoint untuk mendapatkan list mahasiswa tersedia (untuk dosen)
router.get(
  '/mahasiswa-tersedia',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res) => {
    if (typeof req.user?.dosen?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_AKSES_DITOLAK_DOSEN,
      });
      return;
    }

    try {
      const periodeId =
        req.query.periode_ta_id !== undefined
          ? parseInt(req.query.periode_ta_id as string, 10)
          : undefined;
      const result = await pengajuanService.getAvailableMahasiswa(periodeId);
      res.status(200).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(500).json({
        status: MSG_GAGAL,
        message:
          error instanceof Error ? error.message : MSG_GAGAL_DATA_MAHASISWA,
      });
    }
  }),
);

// Endpoint untuk mengajukan pelepasan bimbingan
router.post(
  '/lepaskan',
  periodeGuard(),
  asyncHandler(async (req, res) => {
    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_UNAUTHORIZED,
      });
      return;
    }

    const { peranDosenTaId } = req.body;

    if (typeof peranDosenTaId !== 'number') {
      res.status(400).json({
        status: MSG_GAGAL,
        message: 'ID peran dosen TA diperlukan',
      });
      return;
    }

    try {
      const result = await pengajuanService.ajukanPelepasanBimbingan(
        peranDosenTaId,
        req.user.id,
      );
      res.status(201).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_TERJADI_KESALAHAN,
      });
    }
  }),
);

// Endpoint untuk konfirmasi pelepasan bimbingan
router.post(
  '/lepaskan/:id/konfirmasi',
  periodeGuard(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: MSG_ID_PELEPASAN_DIPERLUKAN,
      });
      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_UNAUTHORIZED,
      });
      return;
    }

    try {
      const result = await pengajuanService.konfirmasiPelepasanBimbingan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_TERJADI_KESALAHAN,
      });
    }
  }),
);

// Endpoint untuk menolak pelepasan bimbingan
router.post(
  '/lepaskan/:id/tolak',
  periodeGuard(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: MSG_ID_PELEPASAN_DIPERLUKAN,
      });
      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_UNAUTHORIZED,
      });
      return;
    }

    try {
      const result = await pengajuanService.tolakPelepasanBimbingan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_TERJADI_KESALAHAN,
      });
    }
  }),
);

// Endpoint untuk membatalkan pelepasan bimbingan (oleh yang mengajukan)
router.post(
  '/lepaskan/:id/batalkan',
  periodeGuard(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: MSG_ID_PELEPASAN_DIPERLUKAN,
      });
      return;
    }

    if (typeof req.user?.id !== 'number') {
      res.status(401).json({
        status: MSG_GAGAL,
        message: MSG_UNAUTHORIZED,
      });
      return;
    }

    try {
      const result = await pengajuanService.batalkanPelepasanBimbingan(
        parseInt(id, 10),
        req.user.id,
      );
      res.status(200).json({ status: MSG_SUKSES, data: result });
    } catch (error) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: error instanceof Error ? error.message : MSG_TERJADI_KESALAHAN,
      });
    }
  }),
);

export default router;
