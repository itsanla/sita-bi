import 'dotenv/config';
import app from './app';
import { createServer } from 'http';
import { initSocket } from './socket';
import { whatsappService } from './services/whatsapp.service';
import { SchedulerService } from './services/scheduler.service';
import { PrismaService } from './config/prisma';
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
if (process.env['NODE_ENV'] !== 'test') {
  // Auto-initialize WhatsApp if session exists
  void (async (): Promise<void> => {
    try {
      await whatsappService.initialize();
    } catch {
      console.warn(
        '💬 WhatsApp: Not initialized (visit /api/whatsapp/qr to setup)',
      );
    }
  })();

  const schedulerService = new SchedulerService();
  schedulerService.init();

  // Start periode auto-open cron job
  startPeriodeCronJob();
}

httpServer.listen(PORT, () => {
  console.warn(`Backend server running on port ${PORT}`);
  console.warn(`Health check: /health`);
  console.warn(`Ready for frontend connections`);
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.warn(`\n🛑 ${signal} received - Shutting down gracefully...`);

  const isDev = process.env['NODE_ENV'] === 'development';
  const shutdownTimeout = isDev ? 500 : 3000; // Faster in dev

  // Stop accepting new connections
  httpServer.close(async () => {
    console.warn('✅ HTTP server closed');

    try {
      // Skip WhatsApp cleanup in dev for faster restart
      if (!isDev) {
        await whatsappService.logout();
        console.warn('✅ WhatsApp disconnected');
      }
    } catch (err) {
      console.error('❌ Error during WhatsApp cleanup:', err);
    }

    try {
      // Disconnect database
      await PrismaService.disconnect();
      console.warn('✅ Database disconnected');
    } catch (err) {
      console.error('❌ Error during database cleanup:', err);
    }

    console.warn('👋 Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, shutdownTimeout);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  void gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  void gracefulShutdown('unhandledRejection');
});
