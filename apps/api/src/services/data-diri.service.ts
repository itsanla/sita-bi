import type { Prisma, Mahasiswa, Dosen, Role } from '@repo/db';
import type { UpdateDataDiriDto } from '../dto/data-diri.dto';
import { HttpError } from '../middlewares/error.middleware';
import prisma from '../config/database';

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
      throw new HttpError(404, 'User tidak ditemukan');
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
      throw new HttpError(404, 'User tidak ditemukan');
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
    if (userRole === 'dosen' && dosen !== null) {
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
}
