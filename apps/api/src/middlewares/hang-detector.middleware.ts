import type { Request, Response, NextFunction } from 'express';

// Middleware untuk detect potential hang
export const hangDetector = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log setiap 5 detik jika request masih berjalan
  const checkInterval = setInterval(() => {
    const duration = Date.now() - startTime;
    if (!res.headersSent) {
      console.warn(`[HANG DETECTOR] [${requestId}] Request still processing: ${req.method} ${req.path} - ${duration}ms`);
      
      // Log stack trace jika > 15 detik
      if (duration > 15000) {
        console.error(`[HANG DETECTOR] [${requestId}] POTENTIAL HANG DETECTED! ${req.method} ${req.path} - ${duration}ms`);
        console.error(`[HANG DETECTOR] Request body:`, JSON.stringify(req.body));
        console.error(`[HANG DETECTOR] Query params:`, JSON.stringify(req.query));
      }
    }
  }, 5000);
  
  // Clear interval saat response selesai
  res.on('finish', () => {
    clearInterval(checkInterval);
  });
  
  res.on('close', () => {
    clearInterval(checkInterval);
  });
  
  next();
};
