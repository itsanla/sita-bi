import { AuthService } from './auth.service';
import prisma from '../config/database';
// import { EmailService } from './email.service'; // Removed unused import
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Mock dependencies
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    log: {
      create: jest.fn(),
    },
    emailVerificationToken: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    passwordResetToken: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('./email.service');
jest.mock('bcrypt');
jest.mock('crypto');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        email_verified_at: new Date(),
        roles: [{ name: 'mahasiswa' }],
        mahasiswa: { nim: '12345' },
        dosen: null,
        failed_login_attempts: 0,
        lockout_until: null,
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(
        { identifier: 'test@example.com', password: 'password' },
        { ip: '127.0.0.1', userAgent: 'Jest' },
      );

      expect(result.userId).toBe(1);
      expect(prisma.log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 1,
            action: 'LOGIN',
            ip_address: '127.0.0.1',
          }),
        }),
      );
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({
          identifier: 'wrong@example.com',
          password: 'password',
        }),
      ).rejects.toThrow('Email atau password salah.');
    });

    it('should throw error if password incorrect and increment attempts', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        email_verified_at: new Date(),
        roles: [{ name: 'mahasiswa' }],
        failed_login_attempts: 0,
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          identifier: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow('Email atau password salah.');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ failed_login_attempts: 1 }),
        }),
      );
    });

    it('should throw lockout error if locked', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        email_verified_at: new Date(),
        roles: [{ name: 'mahasiswa' }],
        failed_login_attempts: 5,
        lockout_until: new Date(Date.now() + 100000), // Locked future
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.login({
          identifier: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow('Akun Anda terkunci');
    });
  });

  describe('forgotPassword', () => {
    it('should create reset token and send email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => 'resetToken',
      });
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await authService.forgotPassword({ email: 'test@example.com' });

      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockToken = {
        email: 'test@example.com',
        token: 'validToken',
        created_at: new Date(),
      };

      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken,
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      await authService.resetPassword({
        token: 'validToken',
        newPassword: 'newPassword',
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'test@example.com' },
          data: { password: 'newHashedPassword' },
        }),
      );
      expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { token: 'validToken' },
      });
    });
  });
});
