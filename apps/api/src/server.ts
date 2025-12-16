import 'dotenv/config';
import app from './app';
import { createServer } from 'http';
import { initSocket } from './socket';
import { whatsappService } from './services/waha-whatsapp.service';
import { SchedulerService } from './services/scheduler.service';

import { startPeriodeCronJob } from './jobs/periode.cron';

const PORT = process.env['PORT'] ?? 3000;

const httpServer = createServer(app);

// Set server timeout to prevent hanging connections
httpServer.timeout = 35000; // 35 seconds (slightly longer than request timeout)
httpServer.keepAliveTimeout = 30000; // 30 seconds
httpServer.headersTimeout = 31000; // 31 seconds (must be greater than keepAliveTimeout)
httpServer.maxHeadersCount = 100;

// Monitor event loop lag
let lastCheck = Date.now();
setInterval(() => {
  const now = Date.now();
  const lag = now - lastCheck - 1000;
  if (lag > 100) {
    console.warn(`[EVENT LOOP LAG] ${lag}ms`);
  }
  lastCheck = now;
}, 1000);

// Monitor memory usage
setInterval(() => {
  const used = process.memoryUsage();
  const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);
  if (used.heapUsed > 400 * 1024 * 1024) { // Alert if > 400MB
    console.warn(`[MEMORY] Heap: ${mb(used.heapUsed)}MB / ${mb(used.heapTotal)}MB`);
  }
}, 30000);

// Initialize Socket.IO
initSocket(httpServer);

// Initialize Services
const initializeServices = async (): Promise<void> => {
  if (process.env['NODE_ENV'] !== 'test') {
    // Auto-initialize WhatsApp (async, non-blocking)
    whatsappService.initialize().catch((error) => {
      console.error('❌ WhatsApp initialization error:', error);
    });

    // Initialize scheduler (async, non-blocking)
    setImmediate(() => {
      const schedulerService = new SchedulerService();
      schedulerService.init();
      startPeriodeCronJob();
    });
  }
};

httpServer.listen(PORT, async () => {
  console.warn(`Backend server running on port ${PORT}`);
  console.warn(`Health check: /health`);
  console.warn(`Ready for frontend connections`);

  // Initialize services after server is listening
  await initializeServices();
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.warn(`\n🛑 ${signal} received - Shutting down...`);

  // Force exit after 2 seconds to prevent hanging
  const forceExitTimer = setTimeout(() => {
    console.warn('⚠️  Force exit after timeout');
    process.exit(0);
  }, 2000);

  // Stop health check but preserve session
  whatsappService.stopHealthCheck();
  console.warn('✅ WhatsApp health check stopped (session preserved)');

  clearTimeout(forceExitTimer);
  console.warn('👋 Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors - always log, restart in production
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (process.env['NODE_ENV'] === 'production') {
    console.error('🔄 Restarting server...');
    process.exit(1); // Let process manager restart
  } else {
    void gracefulShutdown('uncaughtException');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env['NODE_ENV'] === 'production') {
    console.error('🔄 Restarting server...');
    process.exit(1); // Let process manager restart
  } else {
    void gracefulShutdown('unhandledRejection');
  }
});

// Periodic health check
setInterval(() => {
  console.log(`[HEALTH] Server alive - ${new Date().toISOString()}`);
}, 60000); // Every minute
