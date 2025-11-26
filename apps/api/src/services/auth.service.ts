import type { Dosen, Mahasiswa, Role, User } from '@repo/db';
import type {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { HttpError } from '../middlewares/error.middleware';
import { EmailService } from './email.service';
import prisma from '../config/database';

export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async login(
    dto: LoginDto,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<{
    userId: number;
    user: Omit<
      User & {
        roles: Role[];
        mahasiswa: Mahasiswa | null;
        dosen: Dosen | null;
      },
      'password'
    >;
  }> {
    const { identifier, password } = dto;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { mahasiswa: { nim: identifier } },
          { dosen: { nidn: identifier } },
        ],
      },
      include: {
        roles: true,
        mahasiswa: true,
        dosen: true,
      },
    });

    if (user == null) {
      throw new HttpError(401, 'Email atau password salah.');
    }

    // Check lockout
    if (user.lockout_until != null && user.lockout_until > new Date()) {
      const timeLeft = Math.ceil(
        (user.lockout_until.getTime() - new Date().getTime()) / 60000,
      );
      throw new HttpError(
        403,
        `Akun Anda terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${timeLeft} menit.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed attempts
      const attempts = Number(user.failed_login_attempts ?? 0) + 1;
      let lockoutUntil = user.lockout_until;

      // Lock if attempts > 5
      if (attempts >= 5) {
        lockoutUntil = new Date(new Date().getTime() + 15 * 60000); // Lock for 15 mins
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: attempts,
          lockout_until: lockoutUntil,
        },
      });

      throw new HttpError(401, 'Email atau password salah.');
    }

    // Reset failed attempts on success
    if ((user.failed_login_attempts ?? 0) > 0 || user.lockout_until != null) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: 0,
          lockout_until: null,
        },
      });
    }

    const isDosen = user.roles.some(
      (role: { name: string }) => role.name === 'dosen',
    );

    // Bypass email verification for dosen
    if (isDosen === false && user.email_verified_at === null) {
      throw new HttpError(401, 'Email belum diverifikasi.');
    }

    // Log login activity
    await prisma.log.create({
      data: {
        user_id: user.id,
        action: 'LOGIN',
        ip_address: meta?.ip ?? null,
        user_agent: meta?.userAgent ?? null,
        method: 'POST',
        url: '/auth/login',
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    // Return userId instead of JWT token
    return { userId: user.id, user: userWithoutPassword };
  }

  async register(dto: RegisterDto): Promise<void> {
    const { name, email, password, phone_number, nim, prodi, kelas } = dto;

    const formatPhoneNumber = (phone: string): string => {
      if (phone.startsWith('08')) {
        return `+628${phone.substring(2)}`;
      }
      return phone;
    };

    const formattedPhoneNumber = formatPhoneNumber(phone_number);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { mahasiswa: { nim } },
          { phone_number: formattedPhoneNumber },
        ],
      },
    });

    if (existingUser !== null) {
      throw new HttpError(
        409,
        'User dengan email, NIM, atau nomor HP tersebut sudah ada.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone_number: formattedPhoneNumber,
        roles: {
          connect: { name: 'mahasiswa' },
        },
        mahasiswa: {
          create: {
            nim,
            prodi,
            kelas,
          },
        },
      },
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.upsert({
      where: { email: user.email },
      update: { token: verificationToken, created_at: new Date() },
      create: { email: user.email, token: verificationToken },
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );
  }

  async verifyEmail(dto: { token: string }): Promise<void> {
    const { token } = dto;

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (verificationToken === null) {
      throw new HttpError(
        404,
        'Token verifikasi tidak valid atau sudah digunakan.',
      );
    }

    const oneHour = 60 * 60 * 1000;
    if (
      new Date().getTime() - verificationToken.created_at.getTime() >
      oneHour
    ) {
      await prisma.emailVerificationToken.delete({ where: { token } });
      throw new HttpError(410, 'Token verifikasi sudah kedaluwarsa.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { email: verificationToken.email },
        data: { email_verified_at: new Date() },
      });

      await tx.emailVerificationToken.delete({
        where: { token },
      });
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const { email } = dto;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user === null) {
      // Don't reveal if user exists
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');

    const existingToken = await prisma.passwordResetToken.findFirst({
      where: { email },
    });

    if (existingToken !== null) {
      await prisma.passwordResetToken.update({
        where: { id: existingToken.id },
        data: { token, created_at: new Date() },
      });
    } else {
      await prisma.passwordResetToken.create({
        data: { email, token },
      });
    }

    await this.emailService.sendPasswordResetEmail(email, token);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = dto;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (resetToken === null) {
      throw new HttpError(404, 'Token tidak valid atau sudah kedaluwarsa.');
    }

    // Check expiration (e.g. 1 hour)
    const oneHour = 60 * 60 * 1000;
    if (new Date().getTime() - resetToken.created_at.getTime() > oneHour) {
      await prisma.passwordResetToken.delete({ where: { token } });
      throw new HttpError(410, 'Token sudah kedaluwarsa.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      });

      await tx.passwordResetToken.delete({
        where: { token },
      });
    });
  }

  async getCurrentUser(
    userId: number,
  ): Promise<
    Omit<
      User & {
        roles: Role[];
        mahasiswa: Mahasiswa | null;
        dosen: (Dosen & { assignedMahasiswa?: { id: number; nim: string; name: string; prodi: string }[] }) | null;
      },
      'password'
    >
  > {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        mahasiswa: true,
        dosen: {
          include: {
            peranDosenTa: {
              where: {
                tugasAkhir: {
                  status: {
                    in: ['BIMBINGAN', 'REVISI', 'DISETUJUI'],
                  },
                },
              },
              include: {
                tugasAkhir: {
                  include: {
                    mahasiswa: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (user === null) {
      throw new HttpError(404, 'User tidak ditemukan.');
    }

    const { password: _, ...userWithoutPassword } = user;

    // Transform dosen data to include assigned mahasiswa
    if (userWithoutPassword.dosen) {
      const assignedMahasiswa = userWithoutPassword.dosen.peranDosenTa.map((peran) => ({
        id: peran.tugasAkhir.mahasiswa.id,
        nim: peran.tugasAkhir.mahasiswa.nim,
        name: peran.tugasAkhir.mahasiswa.user.name,
        prodi: peran.tugasAkhir.mahasiswa.prodi,
      }));

      // Remove duplicates
      const uniqueMahasiswa = Array.from(
        new Map(assignedMahasiswa.map((m) => [m.id, m])).values(),
      );

      return {
        ...userWithoutPassword,
        dosen: {
          ...userWithoutPassword.dosen,
          assignedMahasiswa: uniqueMahasiswa,
        },
      };
    }

    return userWithoutPassword;
  }
}
