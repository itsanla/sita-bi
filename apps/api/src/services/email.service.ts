import * as nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Pastikan variabel environment sudah di-set
    if (
      process.env['EMAIL_USER'] == null ||
      process.env['EMAIL_PASS'] == null
    ) {
      // console.error('ERROR: EMAIL_USER and EMAIL_PASS environment variables must be set.');
      // In a real app, you might want to throw an error or have a fallback
      // For now, we create a non-functional transporter to avoid crashing.
      this.transporter = nodemailer.createTransport({});
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env['EMAIL_USER'], // 'sitabi.pnp@gmail.com'
        pass: process.env['EMAIL_PASS'], // App Password Anda
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const appName =
      process.env['APP_NAME'] ?? 'SITA-BI Politeknik Negeri Padang';

    const mailOptions = {
      from: `"${appName}" <${process.env['EMAIL_USER']}>`,
      to: to,
      subject: subject,
      html: html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (_error) {
      console.error(`Error sending email to ${to}:`, _error);
      throw new Error('Could not send email.');
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const frontendUrl = process.env['FRONTEND_URL'];
    const verificationLink = `${frontendUrl}/verify-otp?token=${token}`;

    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Selamat Datang di SITA-BI!</h2>
          <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda.</p>
          <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            Verifikasi Email
          </a>
          <p style="margin-top: 20px;">Jika tombol tidak berfungsi, Anda juga bisa menyalin dan menempelkan link berikut di browser Anda:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
        </div>
      `;

    await this.sendEmail(to, 'Verifikasi Alamat Email Anda', html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl = process.env['FRONTEND_URL'];
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const appName =
      process.env['APP_NAME'] ?? 'SITA-BI Politeknik Negeri Padang';

    const mailOptions = {
      from: `"${appName}" <${process.env['EMAIL_USER']}>`,
      to: to,
      subject: 'Reset Password Permintaan',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Permintaan Reset Password</h2>
          <p>Kami menerima permintaan untuk mereset password akun Anda. Jika Anda tidak memintanya, silakan abaikan email ini.</p>
          <p>Untuk mereset password Anda, klik tombol di bawah ini:</p>
          <a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            Reset Password
          </a>
          <p style="margin-top: 20px;">Atau salin link berikut:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (_error) {
      console.error('Failed to send password reset email:', _error);
      throw new Error('Could not send password reset email.');
    }
  }
}
