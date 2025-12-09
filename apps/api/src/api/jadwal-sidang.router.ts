import { Router } from 'express';
import { JadwalSidangService } from '../services/jadwal-sidang.service';
import { RuanganSyncService } from '../services/ruangan-sync.service';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';
import { auditLog } from '../middlewares/audit.middleware';

const router = Router();
const service = new JadwalSidangService();
const ruanganSync = new RuanganSyncService();

router.post(
  '/generate',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('GENERATE_JADWAL_SIDANG', 'jadwal_sidang'),
  asyncHandler(async (req, res) => {
    console.log('[BACKEND API] 🚀 POST /generate called');
    console.log('[BACKEND API] 👤 User:', req.user?.name, req.user?.email);
    
    console.log('[BACKEND API] 🔄 Syncing ruangan...');
    const syncResult = await ruanganSync.syncRuanganFromPengaturan();
    console.log('[BACKEND API] ✅ Ruangan synced:', syncResult);
    
    console.log('[BACKEND API] 📦 Calling generateJadwalOtomatis...');
    const result = await service.generateJadwalOtomatis();
    console.log('[BACKEND API] ✅ Generate completed, results:', result.length);

    res.json({
      status: 'sukses',
      message: `Berhasil menjadwalkan ${result.length} mahasiswa`,
      data: result,
    });
  })
);

router.get(
  '/mahasiswa-siap',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  asyncHandler(async (req, res) => {
    console.log('[BACKEND API] 🔍 GET /mahasiswa-siap called');
    const mahasiswa = await service.getMahasiswaSiapSidang();
    console.log('[BACKEND API] 📊 Returning mahasiswa:', mahasiswa.length);

    res.json({
      status: 'sukses',
      data: mahasiswa,
    });
  })
);

router.get(
  '/jadwal',
  asyncHandler(authMiddleware),
  asyncHandler(async (req, res) => {
    const jadwal = await service.getJadwalSidang();

    res.json({
      status: 'sukses',
      data: jadwal,
    });
  })
);

export default router;
