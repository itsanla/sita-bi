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
httpServer.keepAliveTimeout = 65000; // 65 seconds
httpServer.headersTimeout = 66000; // 66 seconds (must be greater than keepAliveTimeout)

// Initialize Socket.IO
initSocket(httpServer);

// Initialize Services
const initializeServices = async (): Promise<void> => {
  if (process.env['NODE_ENV'] !== 'test') {
    // Auto-initialize WhatsApp
    try {
      await whatsappService.initialize();
    } catch (error) {
      console.error('❌ WhatsApp initialization error:', error);
    }

    const schedulerService = new SchedulerService();
    schedulerService.init();

    // Start periode auto-open cron job
    startPeriodeCronJob();
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

// Handle uncaught errors
// Don't call gracefulShutdown on uncaught errors in production
// Let PM2/Docker handle restart
if (process.env['NODE_ENV'] !== 'production') {
  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    void gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    void gracefulShutdown('unhandledRejection');
  });
}
