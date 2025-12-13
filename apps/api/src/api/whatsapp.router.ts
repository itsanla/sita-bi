import type { Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { whatsappService } from '../services/waha-whatsapp.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: ExpressRouter = Router();

/**
 * POST /api/whatsapp/initialize
 * Initialize WhatsApp client manually
 */
router.post(
  '/initialize',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    try {
      await whatsappService.forceInitialize();
      res.json({
        success: true,
        message: 'WhatsApp initialization started',
        qrUrl: '/api/whatsapp/qr',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize',
      });
    }
  }),
);

/**
 * GET /api/whatsapp/status
 * Get WhatsApp client status
 */
router.get('/status', authMiddleware, (_req: Request, res: Response): void => {
  const status = whatsappService.getStatus();
  res.json({
    success: true,
    data: status,
  });
});

/**
 * GET /api/whatsapp/health
 * Health check without auth (for testing)
 */
router.get('/health', (_req: Request, res: Response): void => {
  const status = whatsappService.getStatus();
  res.json({
    success: true,
    connected: status.isReady,
    data: status,
  });
});

/**
 * GET /api/whatsapp/qr
 * Get QR code for scanning (HTML page)
 */
router.get('/qr', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const status = whatsappService.getStatus();

  if (status.isReady) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Status</title>
        <style>
          body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .success { color: #25D366; font-size: 24px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅ WhatsApp Connected</div>
          <p>Your WhatsApp is already connected and ready to use.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  if (!status.hasQR && !status.isInitializing) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Setup</title>
        <style>
          body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; }
          .warning { color: #ff9800; font-size: 24px; margin-bottom: 20px; }
          .btn { background: #25D366; color: white; border: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; cursor: pointer; margin-top: 20px; }
          .btn:hover { background: #1fa855; }
          .info { color: #666; margin: 20px 0; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="warning">⚠️  WhatsApp Not Connected</div>
          <div class="info">
            <p>WhatsApp integration is not active.</p>
            <p>Click the button below to generate QR code and connect your WhatsApp account.</p>
          </div>
          <button class="btn" onclick="generateQR()">📱 Generate QR Code</button>
        </div>
        <script>
          function generateQR() {
            fetch('/api/whatsapp/initialize', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            .then(() => {
              setTimeout(() => location.reload(), 1000);
            });
          }
        </script>
      </body>
      </html>
    `);
    return;
  }
  
  if (status.isInitializing) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Setup</title>
        <style>
          body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .warning { color: #ff9800; font-size: 24px; margin-bottom: 20px; }
        </style>
        <meta http-equiv="refresh" content="2">
      </head>
      <body>
        <div class="container">
          <div class="warning">⏳ Initializing WhatsApp...</div>
          <p>Please wait while we generate the QR code.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp QR Code</title>
      <style>
        body { font-family: Arial; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f0f0; }
        .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; }
        h1 { color: #25D366; margin-bottom: 10px; }
        .instructions { color: #666; margin: 20px 0; line-height: 1.6; }
        #qrcode { margin: 20px 0; }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    </head>
    <body>
      <div class="container">
        <h1>📱 Scan QR Code</h1>
        <div class="instructions">
          <p><strong>Steps to connect:</strong></p>
          <ol style="text-align: left;">
            <li>Open WhatsApp on your phone</li>
            <li>Tap Menu or Settings</li>
            <li>Tap Linked Devices</li>
            <li>Tap Link a Device</li>
            <li>Scan this QR code</li>
          </ol>
        </div>
        <div id="qrcode"></div>
      </div>
      <script>
        new QRCode(document.getElementById('qrcode'), {
          text: ${JSON.stringify(status.qrCode)},
          width: 300,
          height: 300
        });
        setTimeout(() => location.reload(), 30000);
      </script>
    </body>
    </html>
  `);
}));

/**
 * POST /api/whatsapp/send
 * Send a message
 * Body: { to: "628xxx", message: "Hello" }
 */
router.post(
  '/send',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { to, message } = req.body as { to?: string; message?: string };

    if (to == null || message == null || to === '' || message === '') {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: to, message',
      });
      return;
    }

    try {
      await whatsappService.sendMessage(to, message);
      res.json({
        success: true,
        message: 'Message sent successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  }),
);

/**
 * POST /api/whatsapp/send-media
 * Send a message with media
 * Body: { to: "628xxx", message: "Caption", mediaPath: "/path/to/file" }
 */
router.post(
  '/send-media',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { to, message, mediaPath, caption } = req.body as {
      to?: string;
      message?: string;
      mediaPath?: string;
      caption?: string;
    };

    if (to == null || mediaPath == null || to === '' || mediaPath === '') {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: to, mediaPath',
      });
      return;
    }

    try {
      await whatsappService.sendMessageWithMedia(
        to,
        message ?? '',
        mediaPath,
        caption,
      );
      res.json({
        success: true,
        message: 'Message with media sent successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  }),
);

/**
 * POST /api/whatsapp/broadcast
 * Broadcast message to multiple recipients
 * Body: { recipients: ["628xxx", "628yyy"], message: "Hello" }
 */
router.post(
  '/broadcast',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { recipients, message } = req.body as {
      recipients?: string[];
      message?: string;
    };

    if (
      recipients == null ||
      !Array.isArray(recipients) ||
      message == null ||
      message === ''
    ) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: recipients (array), message',
      });
      return;
    }

    try {
      await whatsappService.broadcastMessage(recipients, message);
      res.json({
        success: true,
        message: `Broadcast sent to ${recipients.length} recipients`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to broadcast message',
      });
    }
  }),
);

/**
 * POST /api/whatsapp/check
 * Check if number is registered on WhatsApp
 * Body: { phone: "628xxx" }
 */
router.post(
  '/check',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { phone } = req.body as { phone?: string };

    if (phone == null || phone === '') {
      res.status(400).json({
        success: false,
        message: 'Missing required field: phone',
      });
      return;
    }

    try {
      const isRegistered = await whatsappService.isRegistered(phone);
      res.json({
        success: true,
        data: {
          phone,
          isRegistered,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to check number',
      });
    }
  }),
);

/**
 * POST /api/whatsapp/logout
 * Logout and destroy session
 */
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    try {
      await whatsappService.logout();
      res.json({
        success: true,
        message: 'WhatsApp logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to logout',
      });
    }
  }),
);

/**
 * DELETE /api/whatsapp/session
 * Delete WhatsApp session directory
 */
router.delete(
  '/session',
  authMiddleware,
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    try {
      await whatsappService.deleteSession();
      res.json({
        success: true,
        message: 'WhatsApp session deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete session',
      });
    }
  }),
);

export default router;
