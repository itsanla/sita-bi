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
import { timeoutMiddleware } from './middlewares/timeout.middleware';
import { getUploadPath, getApiRoot } from './utils/upload.config';
import { generateApiDocs } from './utils/api-docs';
import { whatsappService } from './services/waha-whatsapp.service'; // WhatsApp service
import prisma from './config/database';

const app: express.Express = express();

// Disable x-powered-by header for security
app.disable('x-powered-by');

// Track concurrent requests
let concurrentRequests = 0;
const MAX_CONCURRENT_REQUESTS = 100;
const activeRequestsMap = new Map<string, { url: string; start: number }>();

// Monitor and reset if counter goes negative (memory leak detection)
setInterval(() => {
  if (concurrentRequests < 0) {
    console.error(`[MEMORY LEAK] Concurrent counter negative: ${concurrentRequests}, resetting to 0`);
    concurrentRequests = 0;
  }
  if (concurrentRequests > MAX_CONCURRENT_REQUESTS * 2) {
    console.error(`[MEMORY LEAK] Concurrent counter too high: ${concurrentRequests}, resetting to 0`);
    concurrentRequests = 0;
  }
  
  // Check for hanging requests - log only, don't kill
  const now = Date.now();
  activeRequestsMap.forEach((req, id) => {
    const duration = now - req.start;
    if (duration > 30000) { // 30s threshold
      console.error(`[HANGING REQUEST] ${req.url} - ${Math.floor(duration/1000)}s`);
      // Remove from map to prevent repeated logging
      activeRequestsMap.delete(id);
    }
  });
}, 5000); // Check every 5 seconds

// Global Middlewares
app.use(timeoutMiddleware(30000)); // 30 second timeout
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware - prevent hanging requests
app.use((req, res, next) => {
  // Check concurrent request limit
  if (concurrentRequests >= MAX_CONCURRENT_REQUESTS) {
    console.error(`[OVERLOAD] Rejecting request - ${concurrentRequests} concurrent requests`);
    res.status(503).json({
      status: 'error',
      message: 'Server overloaded, please try again later',
    });
    return;
  }
  
  concurrentRequests++;
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let cleanedUp = false;
  
  // Track this request
  (req as any).requestId = requestId;
  activeRequestsMap.set(requestId, { url: `${req.method} ${req.path}`, start: startTime });
  
  // Set timeout for all requests (10 seconds)
  req.setTimeout(10000, () => {
    console.error(`[REQ TIMEOUT] ${req.method} ${req.path} - Request socket timeout`);
    if (!res.headersSent) {
      res.status(408).json({
        status: 'error',
        message: 'Request timeout - socket timeout',
      });
    }
  });
  
  res.setTimeout(10000, () => {
    console.error(`[RES TIMEOUT] ${req.method} ${req.path} - Response socket timeout`);
    if (!res.headersSent) {
      res.status(408).json({
        status: 'error',
        message: 'Request timeout - response timeout',
      });
    }
  });

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[TIMEOUT] ${req.method} ${req.path} - ${Date.now() - startTime}ms`);
      res.status(408).json({
        status: 'error',
        message: 'Request timeout - server took too long to respond',
      });
    }
  }, 10000);

  // Cleanup on finish - prevent double cleanup
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    
    clearTimeout(timeout);
    concurrentRequests = Math.max(0, concurrentRequests - 1);
    activeRequestsMap.delete(requestId);
    
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`[SLOW] ${req.method} ${req.path} - ${duration}ms`);
    }
  };

  res.once('finish', cleanup);
  res.once('close', cleanup);
  res.once('error', (err) => {
    console.error(`[RES ERROR] ${req.method} ${req.path}:`, err.message);
    cleanup();
  });
  
  req.once('error', (err) => {
    console.error(`[REQ ERROR] ${req.method} ${req.path}:`, err.message);
    cleanup();
  });
  
  // Force cleanup after 12 seconds
  setTimeout(() => {
    if (!cleanedUp) {
      console.error(`[FORCE CLEANUP] ${req.method} ${req.path} - 12s timeout`);
      cleanup();
    }
  }, 12000);

  next();
});

// Log all incoming requests (skip OPTIONS to reduce noise)
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} (concurrent: ${concurrentRequests})`);
  }
  next();
});



// Explicit CORS configuration
// CORS - Allow all origins (NO SECURITY)
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
}));

app.use(activityLogger);

// Pastikan directory uploads exists di apps/api
const uploadsPath = getUploadPath();

// Serve static files from uploads directory (from apps/api)
app.use('/uploads', express.static(uploadsPath));

console.warn('⚠️  WhatsApp not connected - Server running without WhatsApp');

// Root endpoint - API Documentation
app.get('/', (_req, res) => {
  const apiRoutes = generateApiDocs(app);
  res.json({
    name: 'SITA BI API',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    totalEndpoints: apiRoutes.length,
    endpoints: apiRoutes
  });
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const whatsappStatus = whatsappService.getStatus();

    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

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

// Catch unhandled routes with timeout protection
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.path}`);
  if (!res.headersSent) {
    res.status(404).json({ status: 'error', message: 'Route not found' });
  }
});

// Error Handling Middleware with timeout protection
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[ERROR MIDDLEWARE]', err);
  if (!res.headersSent) {
    errorHandler(err, req, res, next);
  } else {
    console.error('[ERROR] Headers already sent, cannot send error response');
  }
});

// Handle uncaught exceptions - log but don't crash in development
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  if (process.env['NODE_ENV'] === 'production') {
    console.error('🔄 Restarting server due to uncaught exception...');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason, promise);
  if (process.env['NODE_ENV'] === 'production') {
    console.error('🔄 Restarting server due to unhandled rejection...');
    process.exit(1);
  }
});

export default app;
