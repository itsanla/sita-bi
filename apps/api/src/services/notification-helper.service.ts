import { whatsappService } from './waha-whatsapp.service';

export abstract class NotificationHelperService {
  private static readonly PEMBIMBING_1 = 'Pembimbing 1';
  private static readonly PEMBIMBING_2 = 'Pembimbing 2';
  private static readonly FAILED_TO_SEND =
    '❌ Failed to send WhatsApp notification:';

  private static getFrontendUrl(): string {
    return process.env['FRONTEND_URL'] ?? 'http://localhost:3001';
  }

  private static getPeranText(peran: 'pembimbing1' | 'pembimbing2'): string {
    return peran === 'pembimbing1' ? this.PEMBIMBING_1 : this.PEMBIMBING_2;
  }

  /**
   * Kirim notifikasi pengajuan pembimbing dari mahasiswa ke dosen
   */
  static async sendPengajuanPembimbingNotification(
    dosenPhone: string,
    mahasiswaNama: string,
    peran: 'pembimbing1' | 'pembimbing2',
  ): Promise<void> {
    try {
      const peranText = this.getPeranText(peran);
      const frontendUrl = this.getFrontendUrl();

      const message =
        `🔔 *Pengajuan Pembimbing*\n\n` +
        `Mahasiswa ${mahasiswaNama} mengajukan permohonan kepada Anda untuk menjadi ${peranText}.\n\n` +
        `Silahkan lihat detailnya pada link berikut:\n` +
        `${frontendUrl}/dashboard/dosen/pengajuan`;

      await whatsappService.sendMessage(dosenPhone, message);
    } catch (error) {
      console.error(this.FAILED_TO_SEND, error);
      // Tidak throw error agar proses utama tidak terganggu
    }
  }

  /**
   * Kirim notifikasi tawaran pembimbing dari dosen ke mahasiswa
   */
  static async sendTawaranPembimbingNotification(
    mahasiswaPhone: string,
    dosenNama: string,
    peran: 'pembimbing1' | 'pembimbing2',
  ): Promise<void> {
    try {
      const peranText = this.getPeranText(peran);
      const frontendUrl = this.getFrontendUrl();

      const message =
        `🔔 *Tawaran Pembimbing*\n\n` +
        `${dosenNama} menawarkan diri untuk menjadi ${peranText} Anda.\n\n` +
        `Silahkan lihat detailnya pada link berikut:\n` +
        `${frontendUrl}/dashboard/mahasiswa/pengajuan`;

      await whatsappService.sendMessage(mahasiswaPhone, message);
    } catch (error) {
      console.error(this.FAILED_TO_SEND, error);
    }
  }

  /**
   * Kirim notifikasi persetujuan pengajuan
   */
  static async sendPengajuanDisetujuiNotification(
    recipientPhone: string,
    acceptorName: string,
    peran: 'pembimbing1' | 'pembimbing2',
    isDosenAccepting: boolean,
  ): Promise<void> {
    try {
      const peranText = this.getPeranText(peran);
      const actionText = isDosenAccepting ? 'pengajuan' : 'tawaran';

      const message =
        `✅ *Pengajuan Disetujui*\n\n` +
        `${acceptorName} telah menyetujui ${actionText} untuk menjadi ${peranText}.\n\n` +
        `Silahkan lihat detailnya pada dashboard Anda.`;

      await whatsappService.sendMessage(recipientPhone, message);
    } catch (error) {
      console.error(this.FAILED_TO_SEND, error);
    }
  }

  /**
   * Kirim notifikasi penolakan pengajuan
   */
  static async sendPengajuanDitolakNotification(
    recipientPhone: string,
    rejectorName: string,
    peran: 'pembimbing1' | 'pembimbing2',
    isDosenRejecting: boolean,
  ): Promise<void> {
    try {
      const peranText = this.getPeranText(peran);
      const actionText = isDosenRejecting ? 'pengajuan' : 'tawaran';

      const message =
        `❌ *Pengajuan Ditolak*\n\n` +
        `${rejectorName} telah menolak ${actionText} untuk menjadi ${peranText}.\n\n` +
        `Silahkan lihat detailnya pada dashboard Anda.`;

      await whatsappService.sendMessage(recipientPhone, message);
    } catch (error) {
      console.error(this.FAILED_TO_SEND, error);
    }
  }

  /**
   * Kirim notifikasi pembatalan pengajuan
   */
  static async sendPengajuanDibatalkanNotification(
    recipientPhone: string,
    cancelerName: string,
    peran: 'pembimbing1' | 'pembimbing2',
    isStudentCanceling: boolean,
  ): Promise<void> {
    try {
      const peranText = this.getPeranText(peran);
      const actionText = isStudentCanceling ? 'pengajuan' : 'tawaran';

      const message =
        `🚫 *Pengajuan Dibatalkan*\n\n` +
        `${cancelerName} telah membatalkan ${actionText} untuk menjadi ${peranText}.\n\n` +
        `Silahkan lihat detailnya pada dashboard Anda.`;

      await whatsappService.sendMessage(recipientPhone, message);
    } catch (error) {
      console.error(this.FAILED_TO_SEND, error);
    }
  }

  /**
   * Kirim notifikasi pengajuan pelepasan bimbingan
   */
  static async sendPelepasanBimbinganNotification(
    recipientPhone: string,
    requesterName: string,
    peran: 'pembimbing1' | 'pembimbing2',
    isDosenRequesting: boolean,
  ): Promise<void> {
    try {
      const peranText = this.getPeranText(peran);
      const requesterType = isDosenRequesting ? 'Dosen' : 'Mahasiswa';
      const frontendUrl = this.getFrontendUrl();

      const message =
        `⚠️ *Pengajuan Pelepasan Bimbingan*\n\n` +
        `${requesterType} ${requesterName} mengajukan pelepasan hubungan ${peranText}.\n\n` +
        `Silahkan konfirmasi pada link berikut:\n` +
        `${frontendUrl}/dashboard/${isDosenRequesting ? 'mahasiswa' : 'dosen'}/pengajuan`;

      await whatsappService.sendMessage(recipientPhone, message);
    } catch (error) {
      console.error(this.FAILED_TO_SEND, error);
    }
  }

  /**
   * Kirim notifikasi pelepasan bimbingan dikonfirmasi
   */
  static async sendPelepasanDikonfirmasiNotification(
    recipientPhone: string,
    confirmerName: string,
    peran: 'pembimbing1' | 'pembimbing2',
  ): Promise<void> {
    try {
      const peranText = this.getPeranText(peran);

      const message =
        `✅ *Pelepasan Bimbingan Disetujui*\n\n` +
        `${confirmerName} menyetujui pelepasan hubungan ${peranText}.\n\n` +
        `Hubungan bimbingan telah berakhir.`;

      await whatsappService.sendMessage(recipientPhone, message);
    } catch (error) {
      console.error(this.FAILED_TO_SEND, error);
    }
  }

  /**
   * Kirim notifikasi pelepasan bimbingan ditolak
   */
  static async sendPelepasanDitolakNotification(
    recipientPhone: string,
    rejectorName: string,
    peran: 'pembimbing1' | 'pembimbing2',
  ): Promise<void> {
    try {
      const peranText = this.getPeranText(peran);

      const message =
        `❌ *Pelepasan Bimbingan Ditolak*\n\n` +
        `${rejectorName} menolak pengajuan pelepasan hubungan ${peranText}.\n\n` +
        `Hubungan bimbingan tetap berlanjut.`;

      await whatsappService.sendMessage(recipientPhone, message);
    } catch (error) {
      console.error(this.FAILED_TO_SEND, error);
    }
  }
}
