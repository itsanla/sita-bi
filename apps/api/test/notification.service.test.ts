import { NotificationService } from '../src/services/notification.service';
import { EmailService } from '../src/services/email.service';
import { whatsappService } from '../src/services/whatsapp.service';
import { PrismaClient, NotificationChannel } from '@prisma/client';
import { getSocketIO } from '../src/socket';

// Mock dependencies
jest.mock('../src/services/email.service');
jest.mock('../src/services/whatsapp.service');
jest.mock('../src/socket');
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    notificationHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
    NotificationChannel: {
      EMAIL: 'EMAIL',
      WHATSAPP: 'WHATSAPP',
    },
  };
});

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockPrisma: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize service
    notificationService = new NotificationService();

    // Get mock instances
    // @ts-ignore
    mockEmailService = EmailService.mock.instances[0];
    mockPrisma = new PrismaClient();
  });

  it('should send email and log history when channel is EMAIL', async () => {
    const params = {
      userId: 1,
      recipientEmail: 'test@example.com',
      message: 'Hello World',
      subject: 'Test Subject',
      channels: [NotificationChannel.EMAIL],
    };

    mockEmailService.sendEmail.mockResolvedValue(undefined);

    await notificationService.send(params);

    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      params.recipientEmail,
      params.subject,
      expect.stringContaining(params.message)
    );

    expect(mockPrisma.notificationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
            user_id: params.userId,
            channel: NotificationChannel.EMAIL,
            status: 'SENT'
        })
      })
    );
  });

  it('should send whatsapp and log history when channel is WHATSAPP', async () => {
    const params = {
      userId: 1,
      recipientPhone: '628123456789',
      message: 'Hello WhatsApp',
      channels: [NotificationChannel.WHATSAPP],
    };

    (whatsappService.sendMessage as jest.Mock).mockResolvedValue(true);

    await notificationService.send(params);

    expect(whatsappService.sendMessage).toHaveBeenCalledWith(
      params.recipientPhone,
      params.message
    );

    expect(mockPrisma.notificationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
            user_id: params.userId,
            channel: NotificationChannel.WHATSAPP,
            status: 'SENT'
        })
      })
    );
  });

  it('should try to emit socket notification', async () => {
     const mockIo = {
         to: jest.fn().mockReturnThis(),
         emit: jest.fn()
     };
     (getSocketIO as jest.Mock).mockReturnValue(mockIo);

     const params = {
      userId: 1,
      message: 'Socket Test',
      channels: [],
    };

    await notificationService.send(params);

    expect(mockIo.to).toHaveBeenCalledWith(`user_${params.userId}`);
    expect(mockIo.emit).toHaveBeenCalledWith('notification', expect.any(Object));
  });
});
