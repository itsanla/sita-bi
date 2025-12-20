import type { Prisma, Mahasiswa, Dosen, Role } from '../prisma-client';
import type {
  UpdateDataDiriDto,
  UpdatePasswordDto,
  RequestEmailOtpDto,
  VerifyEmailOtpDto,
} from '../dto/data-diri.dto';
import { HttpError } from '../middlewares/error.middleware';
import prisma from '../config/database';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { whatsappService } from './waha-whatsapp.service';

interface DataDiriResponse {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  email_verified_at: Date | null;
  photo: string | null;
  alamat: string | null;
  tanggal_lahir: Date | null;
  tempat_lahir: string | null;
  jenis_kelamin: string | null;
  created_at: Date;
  updated_at: Date;
  mahasiswa: Mahasiswa | null;
  dosen: Dosen | null;
  roles: Role[];
}

const USER_NOT_FOUND_MESSAGE = 'User tidak ditemukan';

export class DataDiriService {
  async getDataDiri(userId: number): Promise<DataDiriResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mahasiswa: true,
        dosen: true,
        roles: true,
      },
    });

    if (user === null) {
      throw new HttpError(404, USER_NOT_FOUND_MESSAGE);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      email_verified_at: user.email_verified_at,
      photo: user.photo,
      alamat: user.alamat,
      tanggal_lahir: user.tanggal_lahir,
      tempat_lahir: user.tempat_lahir,
      jenis_kelamin: user.jenis_kelamin,
      created_at: user.created_at,
      updated_at: user.updated_at,
      mahasiswa: user.mahasiswa,
      dosen: user.dosen,
      roles: user.roles,
    };
  }

  async updateDataDiri(
    userId: number,
    dto: UpdateDataDiriDto,
  ): Promise<DataDiriResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mahasiswa: true,
        dosen: true,
        roles: true,
      },
    });

    if (user === null) {
      throw new HttpError(404, USER_NOT_FOUND_MESSAGE);
    }

    const userRole = user.roles[0]?.name;

    await this.updateUserData(userId, dto);
    await this.updateMahasiswaData(userRole, user.mahasiswa, dto);
    await this.updateDosenData(userRole, user.dosen, dto);

    return this.getDataDiri(userId);
  }

  private async updateUserData(
    userId: number,
    dto: UpdateDataDiriDto,
  ): Promise<void> {
    const userUpdateData: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined && dto.name.length > 0) {
      userUpdateData.name = dto.name;
    }
    if (dto.phone_number !== undefined && dto.phone_number.length > 0) {
      userUpdateData.phone_number = dto.phone_number;
    }
    if (dto.alamat !== undefined) {
      userUpdateData.alamat = dto.alamat;
    }
    if (dto.tanggal_lahir !== undefined && dto.tanggal_lahir.length > 0) {
      userUpdateData.tanggal_lahir = new Date(dto.tanggal_lahir);
    }
    if (dto.tempat_lahir !== undefined) {
      userUpdateData.tempat_lahir = dto.tempat_lahir;
    }
    if (dto.jenis_kelamin !== undefined) {
      userUpdateData.jenis_kelamin = dto.jenis_kelamin;
    }
    if (dto.photo !== undefined) {
      userUpdateData.photo = dto.photo;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }
  }

  private async updateMahasiswaData(
    userRole: string | undefined,
    mahasiswa: Mahasiswa | null,
    dto: UpdateDataDiriDto,
  ): Promise<void> {
    if (
      userRole === 'mahasiswa' &&
      mahasiswa !== null &&
      dto.ipk !== undefined
    ) {
      await prisma.mahasiswa.update({
        where: { id: mahasiswa.id },
        data: { ipk: dto.ipk },
      });
    }
  }

  private async updateDosenData(
    userRole: string | undefined,
    dosen: Dosen | null,
    dto: UpdateDataDiriDto,
  ): Promise<void> {
    if (dosen !== null) {
      const dosenUpdateData: Prisma.DosenUpdateInput = {};
      if (dto.bidang_keahlian !== undefined) {
        dosenUpdateData.bidang_keahlian = dto.bidang_keahlian;
      }
      if (dto.jabatan !== undefined) {
        dosenUpdateData.jabatan = dto.jabatan;
      }

      if (Object.keys(dosenUpdateData).length > 0) {
        await prisma.dosen.update({
          where: { id: dosen.id },
          data: dosenUpdateData,
        });
      }
    }
  }

  async updatePassword(userId: number, dto: UpdatePasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (user === null) {
      throw new HttpError(404, USER_NOT_FOUND_MESSAGE);
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password_lama,
      user.password,
    );

    if (!isPasswordValid) {
      throw new HttpError(400, 'Password lama tidak sesuai');
    }

    const hashedPassword = await bcrypt.hash(dto.password_baru, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async requestEmailOtp(
    userId: number,
    dto: RequestEmailOtpDto,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone_number: true },
    });

    if (user === null) {
      throw new HttpError(404, USER_NOT_FOUND_MESSAGE);
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: dto.email_baru },
    });

    if (existingEmail !== null) {
      throw new HttpError(409, 'Email sudah digunakan oleh user lain');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.$executeRaw`
      INSERT INTO email_change_otp (user_id, email_baru, otp, expires_at, created_at)
      VALUES (${userId}, ${dto.email_baru}, ${otp}, ${expiresAt}, ${new Date()})
      ON CONFLICT(user_id) DO UPDATE SET
        email_baru = ${dto.email_baru},
        otp = ${otp},
        expires_at = ${expiresAt},
        created_at = ${new Date()}
    `;

    const message = `Kode OTP untuk ubah email Anda adalah: *${otp}*\n\nKode berlaku selama 10 menit.\n\nJika Anda tidak meminta perubahan email, abaikan pesan ini.`;

    await whatsappService.sendMessage(user.phone_number, message);
  }

  async verifyEmailOtp(userId: number, dto: VerifyEmailOtpDto): Promise<void> {
    const otpRecord = await prisma.$queryRaw<
      {
        user_id: number;
        email_baru: string;
        otp: string;
        expires_at: Date;
      }[]
    >`
      SELECT user_id, email_baru, otp, expires_at
      FROM email_change_otp
      WHERE user_id = ${userId}
    `;

    if (otpRecord.length === 0) {
      throw new HttpError(404, 'OTP tidak ditemukan. Silakan request OTP baru');
    }

    const record = otpRecord[0];

    if (record.otp !== dto.otp) {
      throw new HttpError(400, 'Kode OTP tidak valid');
    }

    if (new Date() > record.expires_at) {
      throw new HttpError(410, 'Kode OTP sudah kedaluwarsa');
    }

    if (record.email_baru !== dto.email_baru) {
      throw new HttpError(400, 'Email tidak sesuai dengan request OTP');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: dto.email_baru },
    });

    await prisma.$executeRaw`
      DELETE FROM email_change_otp WHERE user_id = ${userId}
    `;
  }
}
