interface NotificationData {
  dosenPhone?: string;
  mahasiswaPhone?: string;
  recipientPhone?: string;
  tanggal?: string;
  mahasiswaNama?: string;
  dosenNama?: string;
  catatan?: string;
  feedback?: string;
  waktu?: string;
  ruangan?: string;
  judul?: string;
  pembimbing?: string;
  isi?: string;
  author?: string;
  peran?: string;
  acceptorName?: string;
  rejectorName?: string;
}

export class WahaWhatsAppService {
  private wahaUrl = process.env['WAHA_URL'] ?? 'http://localhost:3000';
  private apiKey = process.env['WAHA_API_KEY'] ?? '';
  private sessionName = 'default';
  private isReady = false;
  private qrCode: string | null = null;
  private isInitializing = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }
    return headers;
  }

  async initialize(): Promise<void> {
    // Retry up to 3 times to ensure session is ready
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(
          `${this.wahaUrl}/api/sessions/${this.sessionName}`,
          {
            headers: this.getHeaders(),
          },
        );
        if (response.ok) {
          const data = await response.json();
          this.isReady = data.status === 'WORKING';
          console.warn(
            `[DEBUG] initialize - status: ${data.status}, isReady: ${this.isReady}`,
          );
          if (data.status === 'SCAN_QR_CODE') {
            await this.fetchQR();
          }
          if (this.isReady) {
            console.warn('✅ WAHA session connected and ready');
            this.startHealthCheck();
            return;
          } else {
            console.warn(
              '🔄 WAHA session exists but not ready (status: ' +
                data.status +
                ')',
            );
            if (i < 2) {
              await this.delay(2000);
            }
          }
        } else {
          console.warn(
            '💬 No WAHA session found. Visit /api/whatsapp/qr to connect',
          );
          return;
        }
      } catch (error) {
        console.error('Failed to check WAHA session:', error);
        if (i < 2) {
          await this.delay(2000);
        }
      }
    }
  }

  private async fetchQR(): Promise<void> {
    try {
      const response = await fetch(
        `${this.wahaUrl}/api/${this.sessionName}/auth/qr`,
        {
          headers: this.getHeaders(),
        },
      );
      if (response.ok) {
        const data = await response.json();
        this.qrCode = data.qr || null;
        if (this.qrCode) {
          console.warn('📱 QR Code ready. Access at: GET /api/whatsapp/qr');
        }
      }
    } catch (error) {
      // QR might not be ready yet
    }
  }

  async forceInitialize(): Promise<void> {
    if (this.isInitializing) return;

    this.isInitializing = true;
    console.warn('🚀 Initializing WAHA session...');

    try {
      const response = await fetch(`${this.wahaUrl}/api/sessions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name: this.sessionName }),
      });

      if (response.ok) {
        console.warn('✅ WAHA session created');
        await this.waitForQR();
      } else {
        throw new Error('Failed to create WAHA session');
      }
    } catch (error) {
      console.error('❌ WAHA initialization failed:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  private async waitForQR(): Promise<void> {
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        const response = await fetch(
          `${this.wahaUrl}/api/sessions/${this.sessionName}`,
          {
            headers: this.getHeaders(),
          },
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'SCAN_QR_CODE') {
            await this.fetchQR();
            if (this.qrCode) {
              return;
            }
          }
          if (data.status === 'WORKING') {
            this.isReady = true;
            console.warn('✅ WhatsApp connected');
            return;
          }
        }
      } catch (error) {
        // Retry
      }
    }
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    console.warn(`[DEBUG] sendMessage called - isReady: ${this.isReady}`);

    // Auto-check session if not ready
    if (!this.isReady) {
      console.warn('[DEBUG] isReady false, checking WAHA session status...');
      try {
        const response = await fetch(
          `${this.wahaUrl}/api/sessions/${this.sessionName}`,
          {
            headers: this.getHeaders(),
          },
        );
        if (response.ok) {
          const data = await response.json();
          this.isReady = data.status === 'WORKING';
          console.warn(
            `[DEBUG] Session status: ${data.status}, isReady now: ${this.isReady}`,
          );
        }
      } catch (error) {
        console.error('[DEBUG] Failed to check session:', error);
      }
    }

    if (!this.isReady) {
      console.warn('WhatsApp client is not ready. Returning false.');
      return false;
    }

    try {
      const chatId = this.formatPhoneNumber(to);
      const response = await fetch(`${this.wahaUrl}/api/sendText`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          session: this.sessionName,
          chatId,
          text: message,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  async sendMessageWithMedia(
    to: string,
    message: string,
    mediaPath: string,
    caption?: string,
  ): Promise<boolean> {
    if (!this.isReady) {
      throw new Error(
        'WhatsApp client is not ready. Please scan QR code first.',
      );
    }

    try {
      const chatId = this.formatPhoneNumber(to);
      const fs = await import('fs');
      const fileBuffer = fs.readFileSync(mediaPath);
      const base64 = fileBuffer.toString('base64');
      const mimeType = this.getMimeType(mediaPath);

      const response = await fetch(`${this.wahaUrl}/api/sendFile`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          session: this.sessionName,
          chatId,
          file: {
            mimetype: mimeType,
            filename: mediaPath.split('/').pop(),
            data: base64,
          },
          caption: caption ?? message,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to send message with media:', error);
      throw error;
    }
  }

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
          message += `👨🏫 Pembimbing: ${data.pembimbing ?? '-'}\n`;
          break;

        case 'PENGUMUMAN_NEW':
          recipient = data.recipientPhone ?? '';
          message = `📢 *Pengumuman Baru*\n\n`;
          message += `${data.judul ?? 'Pengumuman'}\n\n`;
          message += `${data.isi ?? ''}\n\n`;
          message += `_Diumumkan oleh: ${data.author ?? 'Admin'}_`;
          break;

        case 'PENGAJUAN_PEMBIMBING':
          recipient = data.recipientPhone ?? '';
          message = `🔔 *Pengajuan Pembimbing*\n\n`;
          message += `Mahasiswa ${data.mahasiswaNama ?? '-'} mengajukan permohonan kepada Anda untuk menjadi ${data.peran ?? 'pembimbing'}.\n\n`;
          message += `Silahkan lihat detailnya pada link berikut:\n`;
          message += `${process.env['FRONTEND_URL'] || 'http://localhost:3001'}/dashboard/dosen/pengajuan`;
          break;

        case 'TAWARAN_PEMBIMBING':
          recipient = data.recipientPhone ?? '';
          message = `🔔 *Tawaran Pembimbing*\n\n`;
          message += `${data.dosenNama ?? 'Dosen'} menawarkan diri untuk menjadi ${data.peran ?? 'pembimbing'} Anda.\n\n`;
          message += `Silahkan lihat detailnya pada link berikut:\n`;
          message += `${process.env['FRONTEND_URL'] || 'http://localhost:3001'}/dashboard/mahasiswa/pengajuan`;
          break;

        case 'PENGAJUAN_DISETUJUI':
          recipient = data.recipientPhone ?? '';
          message = `✅ *Pengajuan Disetujui*\n\n`;
          message += `${data.acceptorName ?? 'Pihak terkait'} telah menyetujui pengajuan untuk menjadi ${data.peran ?? 'pembimbing'}.\n\n`;
          message += `Silahkan lihat detailnya pada dashboard Anda.`;
          break;

        case 'PENGAJUAN_DITOLAK':
          recipient = data.recipientPhone ?? '';
          message = `❌ *Pengajuan Ditolak*\n\n`;
          message += `${data.rejectorName ?? 'Pihak terkait'} telah menolak pengajuan untuk menjadi ${data.peran ?? 'pembimbing'}.\n\n`;
          message += `Silahkan lihat detailnya pada dashboard Anda.`;
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

  async broadcastMessage(recipients: string[], message: string): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    const results = { success: 0, failed: 0 };

    for (const recipient of recipients) {
      try {
        await this.sendMessage(recipient, message);
        results.success++;
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

  getStatus(): {
    isReady: boolean;
    hasQR: boolean;
    qrCode: string | null;
    isInitializing: boolean;
  } {
    return {
      isReady: this.isReady,
      hasQR: this.qrCode !== null,
      qrCode: this.qrCode,
      isInitializing: this.isInitializing,
    };
  }

  startHealthCheck(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${this.wahaUrl}/api/sessions/${this.sessionName}`,
          {
            headers: this.getHeaders(),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const wasReady = this.isReady;
          this.isReady = data.status === 'WORKING';

          if (!wasReady && this.isReady) {
            console.warn('✅ WAHA reconnected - WhatsApp is now ready');
          } else if (wasReady && !this.isReady) {
            console.warn(
              '⚠️  WAHA disconnected - WhatsApp not ready (status: ' +
                data.status +
                ')',
            );
          }
        } else {
          if (this.isReady) {
            console.warn('⚠️  WAHA is down - WhatsApp not available');
            this.isReady = false;
          }
        }
      } catch (error) {
        if (this.isReady) {
          console.warn('⚠️  Cannot reach WAHA - WhatsApp not available');
          this.isReady = false;
        }
      }
    }, 30000);

    console.warn('🔍 WAHA health check started (every 30s)');
  }

  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async logout(): Promise<void> {
    this.stopHealthCheck();
    try {
      await fetch(`${this.wahaUrl}/api/sessions/${this.sessionName}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      this.isReady = false;
      this.qrCode = null;
      console.warn('👋 WhatsApp logged out');
    } catch (error) {
      this.isReady = false;
      this.qrCode = null;
    }
  }

  async deleteSession(): Promise<void> {
    await this.logout();
    console.warn('🗑️  WhatsApp session deleted');
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned + '@c.us';
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  async isRegistered(phone: string): Promise<boolean> {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const chatId = this.formatPhoneNumber(phone);
      const response = await fetch(
        `${this.wahaUrl}/api/${this.sessionName}/contacts/check-exists`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ phone: chatId }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data.exists ?? false;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to check registration:', error);
      return false;
    }
  }

  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
    };
    return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
  }
}

export const whatsappService = new WahaWhatsAppService();
