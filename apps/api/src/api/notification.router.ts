import { Router, type Request, type Response } from 'express';
import { notificationService } from '../services/notification.service';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { type NotificationChannel } from '@prisma/client';

const router: Router = Router();

// Get notification history for the logged-in user
router.get('/history', authenticateJWT, (req: Request, res: Response) => {
  void (async (): Promise<void> => {
    try {
      if (req.user == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const userId = req.user.id;
      const history = await notificationService.getHistory(userId);
      res.json(history);
    } catch (error) {
      console.error('Failed to fetch notification history:', error);
      res.status(500).json({ error: 'Failed to fetch notification history' });
    }
  })();
});

// Test endpoint to trigger a notification (for development)
router.post('/test', authenticateJWT, (req: Request, res: Response) => {
  void (async (): Promise<void> => {
    try {
      if (req.user == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const userId = req.user.id;
      const { message, channel } = req.body as {
        message?: string;
        channel?: NotificationChannel;
      };

      await notificationService.send({
        userId,
        recipientEmail: req.user.email,
        recipientPhone: req.user.phone_number,
        subject: 'Test Notification',
        message: message ?? 'This is a test notification',
        channels: channel != null ? [channel] : undefined,
      });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  })();
});

export default router;
