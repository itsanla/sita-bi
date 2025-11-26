import type { Request, Response, NextFunction } from 'express';

// Export a class for creating HTTP errors
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

// The existing error handler middleware, now updated to use HttpError
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Only log for upload routes or in development
  if (
    req.originalUrl.includes('/pendaftaran-sidang') ||
    process.env['NODE_ENV'] === 'development'
  ) {
    console.error('=== ERROR HANDLER ===');
    console.error('URL:', req.method, req.originalUrl);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('=====================');
  }

  // Check if it's an instance of our HttpError
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  } else if (err.name === 'MulterError') {
    // Handle Multer specific errors
    res.status(400).json({
      status: 'error',
      message: `File upload error: ${err.message}`,
    });
  } else {
    // Handle generic errors
    const statusCode = (err as any).statusCode || 500;
    res.status(statusCode).json({
      status: 'error',
      message: err.message || 'Internal Server Error',
    });
  }
};
