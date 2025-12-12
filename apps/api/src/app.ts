import express from 'express';
import cors from 'cors';
import bimbinganRouter from './api/bimbingan.router';
import dokumenTARouter from './api/dokumen-ta.router';
import uploadRouter from './api/upload.router';
import jadwalSidangSmartRouter from './api/jadwal-sidang.router';
import laporanRouter from './api/laporan.router';
import reportRouter from './api/report.router';
import logRouter from './api/log.router';
import pendaftaranSidangRouter from './api/pendaftaran-sidang.router';
import pengumumanRouter from './api/pengumuman.router';
import pengajuanRouter from './api/pengajuan.router';
import penilaianRouter from './api/penilaian.router';
import penilaianSidangRouter from './api/penilaian-sidang.router';
import penugasanRouter from './api/penugasan.router';
import profileRouter from './api/profile.router';
import dataDiriRouter from './api/data-diri.router';
import tawaranTopikRouter from './api/tawaran-topik.router';
import tugasAkhirRouter from './api/tugas-akhir.router';
import usersRouter from './api/users.router';
import filesRouter from './api/files.router';
import ruanganRouter from './api/ruangan.router';

import authRouter from './api/auth.router';
import whatsappRouter from './api/whatsapp.router';
import geminiRouter from './api/gemini.router';
import dashboardRouter from './api/dashboard.router';
import notificationRouter from './api/notification.router';
import importRouter from './api/import.router';
import rbacRouter from './api/rbac.router';
import pengaturanRouter from './api/pengaturan.router';
import periodeRouter from './api/periode.router';
import aturanValidasiRouter from './api/aturan-validasi.router';
import penjadwalanSidangRouter from './api/penjadwalan-sidang.router';
import dataMasterRouter from './api/data-master.router';
import { errorHandler } from './middlewares/error.middleware';
import { activityLogger } from './middlewares/logger.middleware';
import { getUploadPath, getApiRoot } from './utils/upload.config';
import { whatsappService } from './services/whatsapp.service'; // WhatsApp service

const app: express.Express = express();

// Disable x-powered-by header for security
app.disable('x-powered-by');

// Global Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware - prevent hanging requests
app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  req.setTimeout(30000);
  res.setTimeout(30000);

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        status: 'error',
        message: 'Request timeout - server took too long to respond',
      });
    }
  }, 30000);

  res.on('finish', () => {
    clearTimeout(timeout);
  });
  res.on('close', () => {
    clearTimeout(timeout);
  });

  next();
});

app.use(activityLogger);

// Explicit CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL ?? '*', // Allow frontend origin from env
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies to be sent
};

app.use(cors(corsOptions));

// Pastikan directory uploads exists di apps/api
const uploadsPath = getUploadPath();

// Serve static files from uploads directory (from apps/api)
app.use('/uploads', express.static(uploadsPath));

console.warn('⚠️  WhatsApp not connected - Server running without WhatsApp');

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const whatsappStatus = whatsappService.getStatus();

    // Check database connectivity
    const { PrismaService } = await import('./config/prisma');
    await PrismaService.getClient().$queryRaw`SELECT 1`;

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uploadsPath: uploadsPath,
      apiRoot: getApiRoot(),
      database: 'connected',
      whatsapp: {
        isReady: whatsappStatus.isReady,
        hasQR: whatsappStatus.hasQR,
      },
    });
  } catch {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
      database: 'disconnected',
    });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/bimbingan', bimbinganRouter);
app.use('/api/dokumen-ta', dokumenTARouter);
app.use('/api/upload', uploadRouter);
app.use('/api/jadwal-sidang-smart', jadwalSidangSmartRouter);
app.use('/api/laporan', laporanRouter);
app.use('/api/reports', reportRouter);
app.use('/api/logs', logRouter);
app.use('/api/pendaftaran-sidang', pendaftaranSidangRouter);
app.use('/api/pengumuman', pengumumanRouter);
app.use('/api/pengajuan', pengajuanRouter);
app.use('/api/penilaian', penilaianRouter);
app.use('/api/penilaian-sidang', penilaianSidangRouter);
app.use('/api/penugasan', penugasanRouter);
app.use('/api/profile', profileRouter);
app.use('/api/data-diri', dataDiriRouter);
app.use('/api/tawaran-topik', tawaranTopikRouter);
app.use('/api/tugas-akhir', tugasAkhirRouter);
app.use('/api/users', usersRouter);
app.use('/api/files', filesRouter);
app.use('/api/ruangan', ruanganRouter);

app.use('/api/whatsapp', whatsappRouter);
app.use('/api/gemini', geminiRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/import', importRouter);
app.use('/api/rbac', rbacRouter);
app.use('/api/pengaturan', pengaturanRouter);
app.use('/api/periode', periodeRouter);
app.use('/api/aturan-validasi', aturanValidasiRouter);
app.use('/api/penjadwalan-sidang', penjadwalanSidangRouter);
app.use('/api/data-master', dataMasterRouter);

// Error Handling Middleware
app.use(errorHandler);

export default app;
