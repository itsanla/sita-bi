import type { Request, Response, NextFunction } from 'express';

export const timeoutMiddleware = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`⏱️ REQUEST TIMEOUT: ${req.method} ${req.url} exceeded ${timeoutMs}ms`);
        res.status(504).json({
          status: 'error',
          message: 'Request timeout - server took too long to respond',
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};
