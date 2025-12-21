import type { Request, Response, NextFunction } from 'express';
import { LogService } from '../services/log.service';
import type { LogLevel } from '../prisma-client';

let logServiceInstance: LogService | null = null;

const getLogService = (): LogService => {
  if (!logServiceInstance) {
    logServiceInstance = new LogService();
  }
  return logServiceInstance;
};

export const activityLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    const userId = (req as any).user?.id as number | undefined;

    if (req.method === 'GET' && !req.url.includes('/api/auth')) return;
    if (req.url.includes('/logs')) return;

    const logLevel: LogLevel = res.statusCode >= 400 ? 'WARN' : 'INFO';

    const logService = getLogService();
    logService
      .create({
        user_id: userId ?? undefined, // Pass undefined if not present, handled in service
        action: `${req.method} ${req.url}`,
        method: req.method,
        url: req.originalUrl,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        module: 'HTTP',
        details: JSON.stringify({
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          body: req.method !== 'GET' ? req.body : undefined,
          query: req.query,
        }),
        level: logLevel,
      })
      .catch((err: unknown) => {
        console.error('Logging failed', err);
      });
  });

  next();
};
