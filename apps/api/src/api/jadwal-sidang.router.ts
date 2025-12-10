import { Router } from 'express';
import { JadwalSidangService } from '../services/jadwal-sidang.service';
import { RuanganSyncService } from '../services/ruangan-sync.service';
import { ExportService } from '../services/export.service';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';
import { auditLog } from '../middlewares/audit.middleware';

const router = Router();
const service = new JadwalSidangService();
const ruanganSync = new RuanganSyncService();
const exportService = new ExportService();

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

router.delete(
  '/jadwal',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('DELETE_JADWAL_SIDANG', 'jadwal_sidang'),
  asyncHandler(async (req, res) => {
    console.log('[BACKEND API] 🗑️ DELETE /jadwal called');
    const result = await service.deleteAllJadwal();
    console.log('[BACKEND API] ✅ Deleted:', result);

    res.json({
      status: 'sukses',
      message: `Berhasil menghapus ${result.count} jadwal sidang`,
      data: result,
    });
  })
);

router.delete(
  '/jadwal/:id',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('DELETE_SINGLE_JADWAL', 'jadwal_sidang'),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    await service.deleteJadwal(id);
    res.json({ status: 'sukses', message: 'Jadwal berhasil dihapus' });
  })
);

router.patch(
  '/jadwal/:id',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('UPDATE_JADWAL', 'jadwal_sidang'),
  asyncHandler(async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const result = await service.updateJadwal(id, data);
      res.json({ status: 'sukses', message: 'Jadwal berhasil diupdate', data: result });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ status: 'error', message: error.message });
    }
  })
);

router.get(
  '/options',
  asyncHandler(authMiddleware),
  asyncHandler(async (req, res) => {
    const options = await service.getEditOptions();
    res.json({ status: 'sukses', data: options });
  })
);

router.post(
  '/move-schedule',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('MOVE_SCHEDULE', 'jadwal_sidang'),
  asyncHandler(async (req, res) => {
    const { from_date, to_date } = req.body;
    const result = await service.moveSchedule(from_date, to_date);
    res.json({ status: 'sukses', message: `Berhasil memindahkan ${result.count} jadwal`, data: result });
  })
);

router.post(
  '/swap-schedule',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('SWAP_SCHEDULE', 'jadwal_sidang'),
  asyncHandler(async (req, res) => {
    const { jadwal1_id, jadwal2_id } = req.body;
    const result = await service.swapSchedule(jadwal1_id, jadwal2_id);
    res.json({ status: 'sukses', message: 'Berhasil menukar jadwal mahasiswa', data: result });
  })
);

router.get(
  '/export/pdf',
  asyncHandler(authMiddleware),
  asyncHandler(async (req, res) => {
    const jadwal = await service.getJadwalSidang();
    const exportData = jadwal.map((item) => {
      const mhs = item.sidang.tugasAkhir.mahasiswa;
      const peran = item.sidang.tugasAkhir.peranDosenTa;
      const ketua = peran.find((p) => p.peran === 'penguji1');
      const sekretaris = peran.find((p) => p.peran === 'pembimbing1');
      const anggota1 = peran.find((p) => p.peran === 'penguji2');
      const anggota2 = peran.find((p) => p.peran === 'penguji3');
      
      const tanggal = new Date(item.tanggal);
      const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const hari = hariMap[tanggal.getDay()];
      const tanggalStr = tanggal.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      
      return {
        mahasiswa: mhs.user.name,
        nim: mhs.nim,
        ketua: ketua?.dosen.user.name || '-',
        sekretaris: sekretaris?.dosen.user.name || '-',
        anggota1: anggota1?.dosen.user.name || '-',
        anggota2: anggota2?.dosen.user.name || '-',
        hari_tanggal: `${hari}, ${tanggalStr}`,
        pukul: `${item.waktu_mulai} - ${item.waktu_selesai}`,
        ruangan: item.ruangan.nama_ruangan,
      };
    });

    const pdfBuffer = await exportService.generatePDF(exportData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=jadwal-sidang-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  })
);

router.get(
  '/export/excel',
  asyncHandler(authMiddleware),
  asyncHandler(async (req, res) => {
    const jadwal = await service.getJadwalSidang();
    const exportData = jadwal.map((item) => {
      const mhs = item.sidang.tugasAkhir.mahasiswa;
      const peran = item.sidang.tugasAkhir.peranDosenTa;
      const ketua = peran.find((p) => p.peran === 'penguji1');
      const sekretaris = peran.find((p) => p.peran === 'pembimbing1');
      const anggota1 = peran.find((p) => p.peran === 'penguji2');
      const anggota2 = peran.find((p) => p.peran === 'penguji3');
      
      const tanggal = new Date(item.tanggal);
      const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const hari = hariMap[tanggal.getDay()];
      const tanggalStr = tanggal.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      
      return {
        mahasiswa: mhs.user.name,
        nim: mhs.nim,
        ketua: ketua?.dosen.user.name || '-',
        sekretaris: sekretaris?.dosen.user.name || '-',
        anggota1: anggota1?.dosen.user.name || '-',
        anggota2: anggota2?.dosen.user.name || '-',
        hari_tanggal: `${hari}, ${tanggalStr}`,
        pukul: `${item.waktu_mulai} - ${item.waktu_selesai}`,
        ruangan: item.ruangan.nama_ruangan,
      };
    });

    const excelBuffer = await exportService.generateExcel(exportData);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=jadwal-sidang-${Date.now()}.xlsx`);
    res.send(excelBuffer);
  })
);

export default router;
