import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { PrismaClient } from '@repo/db';
import { PendaftaranSidangService } from '../services/pendaftaran-sidang.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import { rejectPendaftaranSchema } from '../dto/pendaftaran-sidang.dto';
import { uploadSidangFiles } from '../middlewares/upload.middleware';

const router: Router = Router();
const pendaftaranSidangService = new PendaftaranSidangService();

// Apply JWT Auth and Roles Guard globally for this router
router.use(asyncHandler(authMiddleware));

router.post(
  '/',
  // authorizeRoles([Role.mahasiswa]), // Dikomenkan untuk sementara untuk testing
  uploadSidangFiles, // Multer middleware to handle file uploads
  asyncHandler(async (req, res): Promise<void> => {
    try {
      // ID Mahasiswa di-hardcode untuk testing karena otentikasi dinonaktifkan
      const mahasiswaId = 1; // Ganti dengan ID mahasiswa yang valid dari database Anda jika perlu

      // Check if mahasiswa exists, if not create test data
      const prisma = new PrismaClient();

      let mahasiswa = await prisma.mahasiswa.findUnique({
        where: { id: mahasiswaId },
        include: { tugasAkhir: true },
      });

      if (mahasiswa === null) {
        // Create test user first if needed
        let testUser = await prisma.user.findFirst({
          where: { email: 'test@example.com' },
        });

        testUser ??= await prisma.user.create({
          data: {
            name: 'Test User',
            email: 'test@example.com',
            password: 'hashed_password',
            phone_number: '+6281234567890',
          },
        });

        mahasiswa = await prisma.mahasiswa.create({
          data: {
            user_id: testUser.id,
            nim: '12345678',
            prodi: 'D4',
            kelas: 'A',
          },
          include: { tugasAkhir: true },
        });
      }

      // Check if approved tugas akhir exists, create if not
      let tugasAkhir = await prisma.tugasAkhir.findFirst({
        where: { mahasiswa_id: mahasiswa.id, status: 'DISETUJUI' },
      });

      tugasAkhir ??= await prisma.tugasAkhir.create({
        data: {
          mahasiswa_id: mahasiswa.id,
          judul: 'Test Thesis Title',
          status: 'DISETUJUI',
          tanggal_pengajuan: new Date(),
        },
      });

      // req.files will contain the uploaded files after multer processes them
      const pendaftaran = await pendaftaranSidangService.registerForSidang(
        mahasiswa.id,
        req.files,
      );

      res.status(201).json({ status: 'sukses', data: pendaftaran });
    } catch (error) {
      console.error('Registration error:', error);
      throw error; // Re-throw to be handled by error middleware
    }
  }),
);

router.get(
  '/pending-approvals',
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil dosen.',
      });
      return;
    }
    const pendingRegistrations =
      await pendaftaranSidangService.getPendingRegistrations(dosenId);
    res.status(200).json({ status: 'sukses', data: pendingRegistrations });
  }),
);

router.post(
  '/:id/approve',
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pendaftaran diperlukan' });
      return;
    }
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil dosen.',
      });
      return;
    }
    const approvedRegistration =
      await pendaftaranSidangService.approveRegistration(
        parseInt(id, 10),
        dosenId,
      );
    res.status(200).json({ status: 'sukses', data: approvedRegistration });
  }),
);

router.post(
  '/:id/reject',
  authorizeRoles([Role.dosen]),
  validate(rejectPendaftaranSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pendaftaran diperlukan' });
      return;
    }
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil dosen.',
      });
      return;
    }
    const { catatan } = req.body;
    const rejectedRegistration =
      await pendaftaranSidangService.rejectRegistration(
        parseInt(id, 10),
        dosenId,
        catatan,
      );
    res.status(200).json({ status: 'sukses', data: rejectedRegistration });
  }),
);

router.get(
  '/my-registration',
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res): Promise<void> => {
    const mahasiswaId = req.user?.mahasiswa?.id;
    if (mahasiswaId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil mahasiswa.',
      });
      return;
    }
    const registration =
      await pendaftaranSidangService.findMyRegistration(mahasiswaId);
    res.status(200).json({ status: 'sukses', data: registration });
  }),
);

router.get(
  '/check-eligibility',
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res): Promise<void> => {
    const mahasiswaId = req.user?.mahasiswa?.id;
    if (mahasiswaId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil mahasiswa.',
      });
      return;
    }
    const eligibility =
      await pendaftaranSidangService.checkEligibility(mahasiswaId);
    res.status(200).json({ status: 'sukses', data: eligibility });
  }),
);

export default router;
