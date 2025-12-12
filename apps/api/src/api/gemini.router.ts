import { Router, type Request, type Response } from 'express';
import { geminiService } from '../services/gemini.service';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createRateLimiter } from '../middlewares/rate-limit.middleware';
import { ChatRequestSchema, ChatStreamRequestSchema } from '../dto/gemini.dto';
import asyncHandler from '../utils/asyncHandler';
import { logger } from '../utils/logger';

const router: Router = Router();

// Rate limiters
const publicRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
});

const authRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
});

// Chat endpoint with streaming - protected with authentication
router.post(
  '/chat/stream',
  authenticate,
  authRateLimit,
  validateRequest(ChatRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message } = req.body as { message: string };

    try {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

      // Send initial connected message
      res.write('data: {"type":"connected"}\n\n');

      logger.info('Starting authenticated stream', { userId: req.user?.id });

      try {
        // Stream the response with word-by-word splitting
        for await (const chunk of geminiService.streamGenerateContent(message)) {
          const parts = chunk.split(/(\s+)/); // Split but keep whitespace
          for (const part of parts) {
            if (part.length > 0) {
              res.write(
                `data: ${JSON.stringify({ type: 'chunk', text: part })}\n\n`,
              );
            }
          }
        }

        // Send completion message
        res.write('data: {"type":"done"}\n\n');
        logger.info('Stream completed successfully', { userId: req.user?.id });
      } catch (streamError) {
        const errorMessage = (streamError as Error).message;
        const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3001';
        logger.error('Stream error:', errorMessage);
        
        if (errorMessage.includes('All API keys exhausted') || errorMessage.includes('Anda sudah mencapai limit') || errorMessage.includes('API keys')) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: `Maaf, SitaBot sedang tidak dapat digunakan. Silakan baca dokumentasi yang sudah disediakan di ${frontendUrl}/dokumentasi` })}\n\n`,
          );
        } else {
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`,
          );
        }
      } finally {
        if (!res.writableEnded) {
          res.end();
        }
      }
    } catch (error) {
      logger.error('Outer catch - unexpected error:', error);
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: 'Maaf, terjadi kesalahan sistem.' })}\n\n`,
        );
        res.end();
      }
    }
  }),
);

// Public streaming endpoint
router.post(
  '/chat/stream/public',
  publicRateLimit,
  validateRequest(ChatStreamRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message, history } = req.body as {
      message: string;
      history: { role: string; content: string }[];
    };

    try {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Send initial connected message
      res.write('data: {"type":"connected"}\n\n');

      logger.info('Starting public stream', { historyLength: history.length });

      // Set timeout for the entire stream
      const streamTimeout = setTimeout(() => {
        logger.warn('Stream timeout - forcing close');
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: 'Request timeout' })}\n\n`,
        );
        res.end();
      }, 60000); // 60 seconds total timeout

      try {
        // Stream the response with history context word-by-word
        for await (const chunk of geminiService.streamGenerateContentWithHistory(
          message,
          history,
        )) {
          const parts = chunk.split(/(\s+)/); // Split but keep whitespace
          for (const part of parts) {
            if (part.length > 0) {
              res.write(
                `data: ${JSON.stringify({ type: 'chunk', text: part })}\n\n`,
              );
            }
          }
        }

        // Send completion message
        res.write('data: {"type":"done"}\n\n');
        logger.info('Public stream completed successfully');
      } catch (streamError) {
        const errorMessage = (streamError as Error).message;
        const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3001';
        logger.error('Stream error:', errorMessage);
        
        if (errorMessage.includes('All API keys exhausted') || errorMessage.includes('Anda sudah mencapai limit') || errorMessage.includes('API keys')) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: `Maaf, SitaBot sedang tidak dapat digunakan. Silakan baca dokumentasi yang sudah disediakan di ${frontendUrl}/dokumentasi` })}\n\n`,
          );
        } else {
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: 'Maaf, terjadi kesalahan. Silakan coba lagi.' })}\n\n`,
          );
        }
      } finally {
        clearTimeout(streamTimeout);
        if (!res.writableEnded) {
          res.end();
        }
      }
    } catch (error) {
      logger.error('Outer catch - unexpected error:', error);
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: 'Maaf, terjadi kesalahan sistem.' })}\n\n`,
        );
        res.end();
      }
    }
  }),
);

// Chat endpoint - protected with authentication (non-streaming fallback)
router.post(
  '/chat',
  authenticate,
  authRateLimit,
  validateRequest(ChatRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message } = req.body as { message: string };

    try {
      const response = await geminiService.chat(message);

      res.json({
        success: true,
        data: {
          message: response,
          apiKeyUsed: geminiService.getStatus().currentKeyNumber,
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      const frontendUrl = process.env['FRONTEND_URL'];

      // Check if it's the "all keys exhausted" error
      if (errorMessage.includes('All API keys exhausted') || errorMessage.includes('Anda sudah mencapai limit') || errorMessage.includes('API keys')) {
        res.status(429).json({
          success: false,
          error: `Maaf, SitaBot sedang tidak dapat digunakan. Silakan baca dokumentasi yang sudah disediakan di ${frontendUrl}/dokumentasi`,
        });
        return;
      }

      // Other errors
      res.status(500).json({
        success: false,
        error: 'Failed to generate response',
      });
    }
  }),
);

// Public endpoint for testing (no auth required)
router.post(
  '/chat/public',
  publicRateLimit,
  validateRequest(ChatRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message } = req.body as { message: string };

    try {
      const response = await geminiService.chat(message);

      res.json({
        success: true,
        data: {
          message: response,
          apiKeyUsed: geminiService.getStatus().currentKeyNumber,
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3001';

      if (errorMessage.includes('All API keys exhausted') || errorMessage.includes('Anda sudah mencapai limit') || errorMessage.includes('API keys')) {
        res.status(429).json({
          success: false,
          error: `Maaf, SitaBot sedang tidak dapat digunakan. Silakan baca dokumentasi yang sudah disediakan di ${frontendUrl}/dokumentasi`,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to generate response',
      });
    }
  }),
);

// Get API key status
router.get(
  '/status',
  authenticate,
  asyncHandler((_req: Request, res: Response): void => {
    const status = geminiService.getStatus();

    res.json({
      success: true,
      data: {
        totalApiKeys: status.totalKeys,
        currentApiKeyNumber: status.currentKeyNumber,
        message:
          status.totalKeys > 0
            ? `Currently using API key #${status.currentKeyNumber} out of ${status.totalKeys}`
            : 'No API keys configured',
      },
    });
  }),
);

// Reset to first API key (admin only)
router.post(
  '/reset',
  authenticate,
  asyncHandler((_req: Request, res: Response): void => {
    geminiService.resetToFirstKey();

    res.json({
      success: true,
      message: 'API key rotation reset to first key',
    });
  }),
);

export default router;
