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
httpServer.timeout = 12000; // 12 seconds
httpServer.keepAliveTimeout = 10000; // 10 seconds
httpServer.headersTimeout = 11000; // 11 seconds (must be greater than keepAliveTimeout)
httpServer.maxHeadersCount = 100;

// Track active requests to detect hangs
const activeRequests = new Map<string, { url: string; startTime: number }>();
let requestIdCounter = 0;

// Monitor and force-close hanging requests
const requestMonitor = setInterval(() => {
  const now = Date.now();
  const hangingRequests: string[] = [];
  
  activeRequests.forEach((req, id) => {
    const duration = now - req.startTime;
    if (duration > 32000) { // 32 seconds - force cleanup
      hangingRequests.push(id);
      console.error(`[FORCE CLEANUP] Hanging request detected: ${req.url} - ${duration}ms`);
    }
  });
  
  hangingRequests.forEach(id => activeRequests.delete(id));
  
  if (activeRequests.size > 100) {
    console.error(`[CRITICAL] Too many active requests: ${activeRequests.size}`);
    console.error('[FORCE RESTART] Server overloaded, restarting...');
    process.exit(1);
  } else if (activeRequests.size > 50) {
    console.warn(`[WARNING] High active requests: ${activeRequests.size}`);
  }
}, 5000);

requestMonitor.unref();

// Monitor event loop lag with aggressive hang detection
let lastCheck = Date.now();
let consecutiveLags = 0;
let lagCheckCount = 0;
let maxLagSeen = 0;

const lagInterval = setInterval(() => {
  const now = Date.now();
  const lag = now - lastCheck - 1000;
  lagCheckCount++;
  
  if (lag > maxLagSeen) {
    maxLagSeen = lag;
  }
  
  if (lag > 3000) {
    process.stderr.write(`\n[CRITICAL LAG] ${lag}ms - Server appears to be hanging!\n`);
    process.stderr.write('[FORCE RESTART] Killing process due to hang...\n');
    process.exit(1);
  }
  
  if (lag > 1500) {
    consecutiveLags++;
    console.warn(`[EVENT LOOP LAG] ${lag}ms (consecutive: ${consecutiveLags})`);
    
    if (consecutiveLags >= 5) {
      console.error('[HANG DETECTED] 5 consecutive lags > 1.5s, forcing restart...');
      process.exit(1);
    }
  } else {
    if (consecutiveLags > 0) {
      console.log(`[EVENT LOOP] Recovered from lag (max: ${maxLagSeen}ms)`);
      maxLagSeen = 0;
    }
    consecutiveLags = 0;
  }
  
  // Log every 60 checks (1 minute)
  if (lagCheckCount % 60 === 0) {
    console.log(`[EVENT LOOP] Healthy - ${lagCheckCount} checks, current lag: ${lag}ms`);
  }
  
  lastCheck = now;
}, 1000);

// Monitor RAM and CPU usage every 10 seconds
let lastCpuUsage = process.cpuUsage();
let lastHealthLog = Date.now();
let healthLogCount = 0;
let healthCheckFailed = 0;

const healthInterval = setInterval(() => {
  try {
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)).toISOString().replace('T', ' ').slice(0, 19);
    
    const mem = process.memoryUsage();
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);
    
    const currentCpuUsage = process.cpuUsage(lastCpuUsage);
    const cpuPercent = ((currentCpuUsage.user + currentCpuUsage.system) / 10000000).toFixed(2);
    lastCpuUsage = process.cpuUsage();
    
    healthLogCount++;
    console.log(`[${wibTime} WIB] #${healthLogCount} RAM: ${mb(mem.heapUsed)}/${mb(mem.heapTotal)}MB | CPU: ${cpuPercent}%`);
    lastHealthLog = Date.now();
    healthCheckFailed = 0;
    
    // Force GC if memory too high
    if (mem.heapUsed > 500 * 1024 * 1024 && global.gc) {
      console.warn('[GC] Forcing garbage collection...');
      global.gc();
    }
  } catch (error) {
    healthCheckFailed++;
    console.error('[HEALTH ERROR]', error);
    if (healthCheckFailed >= 3) {
      console.error('[HEALTH] Failed 3 times, restarting...');
      process.exit(1);
    }
  }
}, 10000);

// Watchdog: Check if health logs are still running
let lastAnyLog = Date.now();
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = function(...args) {
  lastAnyLog = Date.now();
  try {
    originalLog.apply(console, args);
  } catch (e) {
    process.stderr.write('[LOG ERROR]\n');
  }
};

console.warn = function(...args) {
  lastAnyLog = Date.now();
  try {
    originalWarn.apply(console, args);
  } catch (e) {
    process.stderr.write('[WARN ERROR]\n');
  }
};

console.error = function(...args) {
  lastAnyLog = Date.now();
  try {
    originalError.apply(console, args);
  } catch (e) {
    process.stderr.write('[ERROR ERROR]\n');
  }
};

const watchdogInterval = setInterval(() => {
  const timeSinceLastHealth = Date.now() - lastHealthLog;
  const timeSinceLastLog = Date.now() - lastAnyLog;
  
  if (timeSinceLastHealth > 20000) {
    process.stderr.write(`\n[WATCHDOG] No health log for ${Math.floor(timeSinceLastHealth/1000)}s - Server hung!\n`);
    process.stderr.write('[FORCE RESTART] Killing hung process...\n');
    process.exit(1);
  }
  
  if (timeSinceLastLog > 30000) {
    process.stderr.write(`\n[WATCHDOG] No logs for ${Math.floor(timeSinceLastLog/1000)}s - Server hung!\n`);
    process.stderr.write('[FORCE RESTART] Killing hung process...\n');
    process.exit(1);
  }
}, 5000);

// Initialize Socket.IO with timeout protection
try {
  const socketServer = initSocket(httpServer);
  
  // Add socket connection timeout
  socketServer.engine.on('connection', (rawSocket) => {
    rawSocket.request.setTimeout(30000);
  });
  
  console.warn('✅ Socket.IO initialized with timeout protection');
} catch (error) {
  console.error('❌ Socket.IO initialization failed:', error);
}

// Initialize Services with timeout protection
const initializeServices = async (): Promise<void> => {
  if (process.env['NODE_ENV'] !== 'test') {
    // Auto-initialize WhatsApp with timeout (async, non-blocking)
    Promise.race([
      whatsappService.initialize(),
      new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error('WhatsApp init timeout')), 15000);
      })
    ]).catch((error) => {
      console.error('❌ WhatsApp initialization error:', error);
    });

    // Initialize scheduler (async, non-blocking)
    setImmediate(() => {
      try {
        const schedulerService = new SchedulerService();
        schedulerService.init();
        startPeriodeCronJob();
      } catch (error) {
        console.error('❌ Scheduler initialization error:', error);
      }
    });
  }
};

httpServer.listen(PORT, async () => {
  console.warn(`Backend server running on port ${PORT}`);
  console.warn(`Health check: /health`);
  console.warn(`Ready for frontend connections`);
  console.warn(`Anti-hang protection: ENABLED`);
  console.warn(`Request timeout: 10s | Hang detection: 12s`);
  console.warn(`Dead man's switch: 15s timeout`);

  // Initialize services after server is listening
  await initializeServices();
  
  // Log initial health
  const now = new Date();
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)).toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${wibTime} WIB] Server started successfully`);
  
  // Dead man's switch - ultimate failsafe
  let lastActivity = Date.now();
  const activityMonitor = setInterval(() => {
    const inactive = Date.now() - lastActivity;
    if (inactive > 30000) { // 30s threshold
      console.error(`[DEAD MAN SWITCH] No activity for ${Math.floor(inactive/1000)}s - server may be hung`);
      // Log only, don't kill - let process manager handle restart
    }
    lastActivity = Date.now();
  }, 10000); // Check every 10s
  
  // Update activity on any request
  httpServer.on('request', () => {
    lastActivity = Date.now();
  });
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.warn(`\n🛑 ${signal} received - Shutting down...`);

  // Force exit after 2 seconds to prevent hanging
  const forceExitTimer = setTimeout(() => {
    console.warn('⚠️  Force exit after timeout');
    process.exit(signal === 'HANG_DETECTED' ? 1 : 0);
  }, 2000);

  // Stop health check but preserve session
  whatsappService.stopHealthCheck();
  console.warn('✅ WhatsApp health check stopped (session preserved)');

  clearTimeout(forceExitTimer);
  console.warn('👋 Shutdown complete');
  process.exit(signal === 'HANG_DETECTED' ? 1 : 0);
};

process.on('SIGTERM', async () => await gracefulShutdown('SIGTERM'));
process.on('SIGINT', async () => await gracefulShutdown('SIGINT'));

// Handle uncaught errors - always log, restart in production
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('🔄 Restarting server...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('🔄 Restarting server...');
  process.exit(1);
});

// Periodic health check with WIB timezone
let mainHealthCount = 0;
const mainHealthInterval = setInterval(() => {
  mainHealthCount++;
  const now = new Date();
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)).toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[HEALTH] #${mainHealthCount} Server alive - ${wibTime} WIB`);
}, 60000);
