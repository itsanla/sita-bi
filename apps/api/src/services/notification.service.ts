import {
  PrismaClient,
  NotificationChannel,
  type NotificationHistory,
} from '@prisma/client';
import { EmailService } from './email.service';
import { whatsappService } from './whatsapp.service';
import { getSocketIO } from '../socket';

const prisma = new PrismaClient();

interface SendNotificationParams {
  userId: number;
  recipientEmail?: string | undefined;
  recipientPhone?: string | undefined;
  subject?: string | undefined;
  message: string;
  channels?: NotificationChannel[] | undefined;
  // Optional data for specific channels
  whatsappData?: unknown | undefined;
}

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async send(params: SendNotificationParams): Promise<void> {
    const {
      userId,
      recipientEmail,
      recipientPhone,
      subject,
      message,
      channels,
    } = params;

    // Default to both if not specified
    const targetChannels = channels ?? [
      NotificationChannel.EMAIL,
      NotificationChannel.WHATSAPP,
    ];

    // 0. Send via Socket.IO (Real-time) - Always try to send if user is connected
    try {
      const io = getSocketIO();
      if (io != null) {
        io.to(`user_${userId}`).emit('notification', {
          subject,
          message,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to send socket notification:', error);
    }

    // 1. Send via Email
    if (
      targetChannels.includes(NotificationChannel.EMAIL) &&
      recipientEmail != null
    ) {
      try {
        await this.emailService.sendEmail(
          recipientEmail,
          subject ?? 'Notifikasi SITA-BI',
          `<div>${message}</div>`,
        );

        // Log success
        await this.logHistory(
          userId,
          NotificationChannel.EMAIL,
          recipientEmail,
          subject,
          message,
          'SENT',
        );
      } catch (error) {
        console.error('Failed to send email:', error);
        await this.logHistory(
          userId,
          NotificationChannel.EMAIL,
          recipientEmail,
          subject,
          message,
          'FAILED',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }

    // 2. Send via WhatsApp
    if (
      targetChannels.includes(NotificationChannel.WHATSAPP) &&
      recipientPhone != null
    ) {
      try {
        const sent = await whatsappService.sendMessage(recipientPhone, message);
        if (sent) {
          await this.logHistory(
            userId,
            NotificationChannel.WHATSAPP,
            recipientPhone,
            subject,
            message,
            'SENT',
          );
        } else {
          await this.logHistory(
            userId,
            NotificationChannel.WHATSAPP,
            recipientPhone,
            subject,
            message,
            'FAILED',
            'Whatsapp service returned false',
          );
        }
      } catch (error) {
        console.error('Failed to send whatsapp:', error);
        await this.logHistory(
          userId,
          NotificationChannel.WHATSAPP,
          recipientPhone,
          subject,
          message,
          'FAILED',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }
  }

  private async logHistory(
    userId: number,
    channel: NotificationChannel,
    recipient: string,
    subject: string | undefined,
    message: string,
    status: string,
    error?: string,
  ): Promise<void> {
    try {
      await prisma.notificationHistory.create({
        data: {
          user_id: userId,
          channel,
          recipient,
          subject: subject ?? null, // Fix for Prisma expecting string | null instead of string | undefined
          message,
          status,
          error: error ?? null, // Fix for Prisma expecting string | null instead of string | undefined
        },
      });
    } catch (logError) {
      console.error('Failed to log notification history:', logError);
    }
  }

  async getHistory(userId: number): Promise<NotificationHistory[]> {
    return await prisma.notificationHistory.findMany({
      where: { user_id: userId },
      orderBy: { sent_at: 'desc' },
    });
  }
}

export const notificationService = new NotificationService();
