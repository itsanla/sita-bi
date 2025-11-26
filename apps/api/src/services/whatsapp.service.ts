import { Client, LocalAuth, type Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';

export interface WhatsAppMessage {
  to: string; // Format: 628xxxx (tanpa +)
  message: string;
}

export interface WhatsAppMessageWithMedia extends WhatsAppMessage {
  mediaPath?: string;
  caption?: string;
}

interface NotificationData {
  dosenPhone?: string;
  mahasiswaPhone?: string;
  recipientPhone?: string;
  tanggal?: string;
  mahasiswaNama?: string;
  catatan?: string;
  feedback?: string;
  waktu?: string;
  ruangan?: string;
  judul?: string;
  pembimbing?: string;
  isi?: string;
  author?: string;
}

export class WhatsAppService {
  private client: Client | null = null;
  private isReady = false;
  private qrCode: string | null = null;
  private readonly sessionDir: string;

  constructor() {
    // Simpan session di directory dalam project, bukan di root system
    // Menggunakan process.cwd() yang biasanya adalah apps/api saat dijalankan via pnpm dev
    this.sessionDir = path.join(process.cwd(), '.wwebjs_auth');

    // Ensure session directory exists
    // Use try-catch to handle permission issues during tests or dev
    try {
      if (!fs.existsSync(this.sessionDir)) {
        fs.mkdirSync(this.sessionDir, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create session directory:', err);
    }
  }

  /**
   * Initialize WhatsApp Client
   */
  async initialize(): Promise<void> {
    if (this.client != null) {
      console.warn('WhatsApp client already initialized');
      return;
    }

    console.warn('🚀 Initializing WhatsApp Web.js client...');
    console.warn(`📁 Session directory: ${this.sessionDir}`);

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: this.sessionDir,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    // Event: QR Code received
    this.client.on('qr', (qr) => {
      console.warn(
        '📱 QR Code received! Scan this QR code with your WhatsApp:',
      );
      qrcode.generate(qr, { small: true });
      this.qrCode = qr;
      console.warn(
        '\n⚠️  QR Code juga tersedia di endpoint: GET /api/whatsapp/qr\n',
      );
    });

    // Event: Client is ready
    this.client.on('ready', () => {
      console.warn('✅ WhatsApp Client is ready!');
      this.isReady = true;
      this.qrCode = null;
    });

    // Event: Authentication successful
    this.client.on('authenticated', () => {
      console.warn('🔐 WhatsApp authenticated successfully!');
    });

    // Event: Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication failed:', msg);
      this.isReady = false;
    });

    // Event: Client disconnected
    this.client.on('disconnected', (reason) => {
      console.warn('⚠️  WhatsApp client disconnected:', reason);
      this.isReady = false;
      this.client = null;
    });

    // Event: Incoming message
    this.client.on('message', (msg: Message) => {
      void (async (): Promise<void> => {
        console.warn(`📨 Received message from ${msg.from}: ${msg.body}`);

        // Auto-reply untuk testing (optional)
        if (msg.body.toLowerCase() === 'ping') {
          await msg.reply('pong 🏓');
        }
      })();
    });

    // Initialize the client
    await this.client.initialize();
  }

  /**
   * Send text message
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.isReady || this.client == null) {
      // For testing purposes or when not initialized, we might throw or return false
      // throw new Error('WhatsApp client is not ready. Please scan QR code first.');
      console.warn('WhatsApp client is not ready. Returning false.');
      return false;
    }

    try {
      // Format nomor telepon: 628xxx@c.us
      const chatId = this.formatPhoneNumber(to);

      await this.client.sendMessage(chatId, message);
      console.warn(`✅ Message sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send message with media (image, document, etc.)
   */
  async sendMessageWithMedia(
    to: string,
    message: string,
    mediaPath: string,
    caption?: string,
  ): Promise<boolean> {
    if (!this.isReady || this.client == null) {
      throw new Error(
        'WhatsApp client is not ready. Please scan QR code first.',
      );
    }

    try {
      const chatId = this.formatPhoneNumber(to);

      // Import MessageMedia from whatsapp-web.js
      const { MessageMedia } = await import('whatsapp-web.js');

      // Load media file
      const media = MessageMedia.fromFilePath(mediaPath);

      await this.client.sendMessage(chatId, media, {
        caption: caption ?? message,
      });

      console.warn(`✅ Message with media sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send message with media:', error);
      throw error;
    }
  }

  /**
   * Send notification untuk berbagai event
   */
  async sendNotification(
    type: string,
    data: NotificationData,
  ): Promise<boolean> {
    if (!this.isReady) {
      console.warn('⚠️  WhatsApp client not ready. Notification skipped.');
      return false;
    }

    try {
      let message = '';
      let recipient = data.recipientPhone ?? '';

      switch (type) {
        case 'BIMBINGAN_CREATED':
          recipient = data.dosenPhone ?? data.mahasiswaPhone ?? '';
          message = `🔔 *Notifikasi Bimbingan*\n\n`;
          message += `Bimbingan baru telah dibuat:\n`;
          message += `📅 Tanggal: ${data.tanggal ?? '-'}\n`;
          message += `👤 Mahasiswa: ${data.mahasiswaNama ?? '-'}\n`;
          message += `📝 Catatan: ${data.catatan ?? '-'}\n`;
          break;

        case 'BIMBINGAN_APPROVED':
          recipient = data.mahasiswaPhone ?? '';
          message = `✅ *Bimbingan Disetujui*\n\n`;
          message += `Bimbingan Anda telah disetujui oleh dosen.\n`;
          message += `📅 Tanggal: ${data.tanggal ?? '-'}\n`;
          message += `💬 Feedback: ${data.feedback ?? '-'}\n`;
          break;

        case 'SIDANG_SCHEDULED':
          recipient = data.mahasiswaPhone ?? '';
          message = `📋 *Jadwal Sidang*\n\n`;
          message += `Sidang Anda telah dijadwalkan:\n`;
          message += `📅 Tanggal: ${data.tanggal ?? '-'}\n`;
          message += `🕐 Waktu: ${data.waktu ?? '-'}\n`;
          message += `📍 Ruangan: ${data.ruangan ?? '-'}\n`;
          break;

        case 'TUGAS_AKHIR_APPROVED':
          recipient = data.mahasiswaPhone ?? '';
          message = `🎉 *Tugas Akhir Disetujui*\n\n`;
          message += `Selamat! Tugas Akhir Anda telah disetujui.\n`;
          message += `📚 Judul: ${data.judul ?? '-'}\n`;
          message += `👨‍🏫 Pembimbing: ${data.pembimbing ?? '-'}\n`;
          break;

        case 'PENGUMUMAN_NEW':
          recipient = data.recipientPhone ?? '';
          message = `📢 *Pengumuman Baru*\n\n`;
          message += `${data.judul ?? 'Pengumuman'}\n\n`;
          message += `${data.isi ?? ''}\n\n`;
          message += `_Diumumkan oleh: ${data.author ?? 'Admin'}_`;
          break;

        default:
          console.warn(`Unknown notification type: ${type}`);
          return false;
      }

      if (recipient === '') {
        console.warn('⚠️  No recipient phone number provided');
        return false;
      }

      await this.sendMessage(recipient, message);
      return true;
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Broadcast message to multiple recipients
   */
  async broadcastMessage(recipients: string[], message: string): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    const results = {
      success: 0,
      failed: 0,
    };

    for (const recipient of recipients) {
      try {
        await this.sendMessage(recipient, message);
        results.success++;

        // Delay to avoid rate limiting
        await this.delay(2000);
      } catch (error) {
        console.error(`Failed to send message to ${recipient}:`, error);
        results.failed++;
      }
    }

    console.warn(
      `📊 Broadcast results: ${results.success} sent, ${results.failed} failed`,
    );
  }

  /**
   * Get client status
   */
  getStatus(): {
    isReady: boolean;
    hasQR: boolean;
    qrCode: string | null;
  } {
    return {
      isReady: this.isReady,
      hasQR: this.qrCode !== null,
      qrCode: this.qrCode,
    };
  }

  /**
   * Logout and destroy session
   */
  async logout(): Promise<void> {
    if (this.client != null) {
      await this.client.logout();
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      this.qrCode = null;
      console.warn('👋 WhatsApp client logged out');
    }
  }

  /**
   * Format phone number to WhatsApp format
   * Input: 628xxx or +628xxx or 08xxx
   * Output: 628xxx@c.us
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Convert 08xxx to 628xxx
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }

    // Remove leading + if exists
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // Ensure starts with 62
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    return cleaned + '@c.us';
  }

  /**
   * Helper: Delay function
   */
  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if number is registered on WhatsApp
   */
  async isRegistered(phone: string): Promise<boolean> {
    if (!this.isReady || this.client == null) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const chatId = this.formatPhoneNumber(phone);
      const isRegistered = await this.client.isRegisteredUser(chatId);
      return isRegistered;
    } catch (error) {
      console.error('❌ Failed to check registration:', error);
      return false;
    }
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
