import { Router, type Request, type Response } from 'express';
import { geminiService } from '../services/gemini.service';
import { authenticate } from '../middlewares/auth.middleware';
import asyncHandler from 'express-async-handler';

const router: Router = Router();

// Chat endpoint with streaming - protected with authentication
router.post(
  '/chat/stream',
  authenticate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message } = req.body as { message?: unknown };

    if (typeof message !== 'string' || message.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
      return;
    }

    if (message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message cannot be empty',
      });
      return;
    }

    if (message.length > 10000) {
      res.status(400).json({
        success: false,
        error: 'Message is too long. Maximum 10000 characters',
      });
      return;
    }

    try {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

      // Send initial connected message
      res.write('data: {"type":"connected"}\n\n');

      // Stream the response
      for await (const chunk of geminiService.streamGenerateContent(message)) {
        res.write(
          `data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`,
        );
      }

      // Send completion message
      res.write('data: {"type":"done"}\n\n');
      res.end();
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('Anda sudah mencapai limit')) {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`,
        );
      } else {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`,
        );
      }
      res.end();
    }
  }),
);

// Public streaming endpoint
router.post(
  '/chat/stream/public',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message, history } = req.body as {
      message?: unknown;
      history?: { role: string; content: string }[];
    };

    if (typeof message !== 'string' || message.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
      return;
    }

    if (message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message cannot be empty',
      });
      return;
    }

    if (message.length > 10000) {
      res.status(400).json({
        success: false,
        error: 'Message is too long. Maximum 10000 characters',
      });
      return;
    }

    try {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Send initial connected message
      res.write('data: {"type":"connected"}\n\n');

      // Stream the response with history context
      for await (const chunk of geminiService.streamGenerateContentWithHistory(
        message,
        history ?? [],
      )) {
        res.write(
          `data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`,
        );
      }

      // Send completion message
      res.write('data: {"type":"done"}\n\n');
      res.end();
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('Anda sudah mencapai limit')) {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`,
        );
      } else {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`,
        );
      }
      res.end();
    }
  }),
);

// Chat endpoint - protected with authentication (non-streaming fallback)
router.post(
  '/chat',
  authenticate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message } = req.body as { message?: unknown };

    if (typeof message !== 'string' || message.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
      return;
    }

    if (message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message cannot be empty',
      });
      return;
    }

    if (message.length > 10000) {
      res.status(400).json({
        success: false,
        error: 'Message is too long. Maximum 10000 characters',
      });
      return;
    }

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

      // Check if it's the "all keys exhausted" error
      if (errorMessage.includes('Anda sudah mencapai limit')) {
        res.status(429).json({
          success: false,
          error: errorMessage,
        });
        return;
      }

      // Other errors
      res.status(500).json({
        success: false,
        error: 'Failed to generate response',
        details: errorMessage,
      });
    }
  }),
);

// Public endpoint for testing (no auth required)
router.post(
  '/chat/public',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message } = req.body as { message?: unknown };

    if (typeof message !== 'string' || message.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
      return;
    }

    if (message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message cannot be empty',
      });
      return;
    }

    if (message.length > 10000) {
      res.status(400).json({
        success: false,
        error: 'Message is too long. Maximum 10000 characters',
      });
      return;
    }

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

      if (errorMessage.includes('Anda sudah mencapai limit')) {
        res.status(429).json({
          success: false,
          error: errorMessage,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to generate response',
        details: errorMessage,
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
