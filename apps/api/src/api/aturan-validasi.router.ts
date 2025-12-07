import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { insecureAuthMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles, Role } from '../middlewares/roles.middleware';
import { PrismaClient, ModeValidasi } from '@repo/db';
import { BadRequestError } from '../errors/AppError';

const router = Router();
const prisma = new PrismaClient();

router.use(asyncHandler(insecureAuthMiddleware));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    let aturan = await prisma.aturanValidasi.findFirst();

    if (!aturan) {
      aturan = await prisma.aturanValidasi.create({
        data: {
          mode_validasi_judul: ModeValidasi.KEDUA_PEMBIMBING,
          mode_validasi_draf: ModeValidasi.KEDUA_PEMBIMBING,
        },
      });
    }

    res.json({ status: 'sukses', data: aturan });
  }),
);

router.put(
  '/',
  authorizeRoles([Role.jurusan]),
  asyncHandler(async (req, res) => {
    const { mode_validasi_judul, mode_validasi_draf } = req.body;

    if (!mode_validasi_judul || !mode_validasi_draf) {
      throw new BadRequestError('Mode validasi harus diisi');
    }

    const validModes = ['SALAH_SATU', 'KEDUA_PEMBIMBING', 'PEMBIMBING_1_SAJA'];
    if (
      !validModes.includes(mode_validasi_judul) ||
      !validModes.includes(mode_validasi_draf)
    ) {
      throw new BadRequestError('Mode validasi tidak valid');
    }

    let aturan = await prisma.aturanValidasi.findFirst();

    if (!aturan) {
      aturan = await prisma.aturanValidasi.create({
        data: {
          mode_validasi_judul: mode_validasi_judul as ModeValidasi,
          mode_validasi_draf: mode_validasi_draf as ModeValidasi,
        },
      });
    } else {
      aturan = await prisma.aturanValidasi.update({
        where: { id: aturan.id },
        data: {
          mode_validasi_judul: mode_validasi_judul as ModeValidasi,
          mode_validasi_draf: mode_validasi_draf as ModeValidasi,
        },
      });
    }

    res.json({ status: 'sukses', data: aturan });
  }),
);

export default router;
