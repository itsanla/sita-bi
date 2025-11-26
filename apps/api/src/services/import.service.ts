import { PrismaClient, type Prodi } from '@repo/db';
import { parse } from 'csv-parse/sync';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailService } from './email.service';

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export class ImportService {
  private prisma: PrismaClient;
  private emailService: EmailService;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
  }

  async validateMahasiswaCsv(fileBuffer: Buffer): Promise<{
    valid: number;
    invalid: number;
    errors: { row: number; data: unknown; messages: string[] }[];
  }> {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
    });
    const errors: { row: number; data: unknown; messages: string[] }[] = [];
    let valid = 0;
    let invalid = 0;

    for (const [index, record] of records.entries()) {
      const rowNum = index + 1;
      const errorList = [];

      const nim = record.nim ?? '';
      const nama = record.nama ?? '';
      const email = record.email ?? '';
      const prodi = record.prodi ?? '';

      if (nim.length === 0) errorList.push('NIM is required');
      if (nama.length === 0) errorList.push('Nama is required');
      if (email.length === 0) errorList.push('Email is required');
      if (prodi.length === 0 || !['D3', 'D4'].includes(prodi.toUpperCase()))
        errorList.push('Prodi must be D3 or D4');

      if (email.length > 0) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });
        if (existingUser !== null)
          errorList.push(`Email ${email} already exists`);
      }
      if (nim.length > 0) {
        const existingMhs = await this.prisma.mahasiswa.findUnique({
          where: { nim },
        });
        if (existingMhs !== null) errorList.push(`NIM ${nim} already exists`);
      }

      if (errorList.length > 0) {
        invalid++;
        errors.push({ row: rowNum, data: record, messages: errorList });
      } else {
        valid++;
      }
    }

    return { valid, invalid, errors };
  }

  async validateDosenCsv(fileBuffer: Buffer): Promise<{
    valid: number;
    invalid: number;
    errors: { row: number; data: unknown; messages: string[] }[];
  }> {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
    });
    const errors: { row: number; data: unknown; messages: string[] }[] = [];
    let valid = 0;
    let invalid = 0;

    for (const [index, record] of records.entries()) {
      const rowNum = index + 1;
      const errorList = [];

      const nidn = record.nidn ?? '';
      const nama = record.nama ?? '';
      const email = record.email ?? '';

      if (nidn.length === 0) errorList.push('NIDN is required');
      if (nama.length === 0) errorList.push('Nama is required');
      if (email.length === 0) errorList.push('Email is required');

      if (email.length > 0) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });
        if (existingUser !== null)
          errorList.push(`Email ${email} already exists`);
      }
      if (nidn.length > 0) {
        const existingDosen = await this.prisma.dosen.findUnique({
          where: { nidn },
        });
        if (existingDosen !== null)
          errorList.push(`NIDN ${nidn} already exists`);
      }

      if (errorList.length > 0) {
        invalid++;
        errors.push({ row: rowNum, data: record, messages: errorList });
      } else {
        valid++;
      }
    }

    return { valid, invalid, errors };
  }

  async executeImportMahasiswa(fileBuffer: Buffer): Promise<ImportResult> {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
    });
    let success = 0;
    let failed = 0;
    const errors: { row: number; error: string }[] = [];

    const roleMhs = await this.prisma.role.findUnique({
      where: { name: 'mahasiswa' },
    });
    if (roleMhs === null) {
      throw new Error('Role mahasiswa not found');
    }

    for (const [index, record] of records.entries()) {
      const rowNum = index + 1;
      try {
        await this.prisma.$transaction(async (tx) => {
          const password = crypto.randomBytes(8).toString('hex');
          const hashedPassword = await bcrypt.hash(password, 10);

          const nama = record.nama ?? '';
          const email = record.email ?? '';
          const nim = record.nim ?? '';
          const prodi = record.prodi ?? '';
          const kelas = record.kelas ?? '';

          const user = await tx.user.create({
            data: {
              name: nama,
              email,
              password: hashedPassword,
              phone_number: `TEMP-${Date.now()}-${Math.random()}`,
              roles: {
                connect: { id: roleMhs.id },
              },
            },
          });

          await tx.mahasiswa.create({
            data: {
              user_id: user.id,
              nim,
              prodi: prodi.toUpperCase() as Prodi,
              kelas: kelas.length > 0 ? kelas : 'A',
            },
          });

          await this.emailService.sendEmail(
            email,
            'Akun SITA BI',
            `Selamat Datang. Password anda adalah: ${password}`,
          );
        });
        success++;
      } catch (e: unknown) {
        failed++;
        errors.push({
          row: rowNum,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return { total: records.length, success, failed, errors };
  }

  async executeImportDosen(fileBuffer: Buffer): Promise<ImportResult> {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
    });
    let success = 0;
    let failed = 0;
    const errors: { row: number; error: string }[] = [];

    const roleDosen = await this.prisma.role.findUnique({
      where: { name: 'dosen' },
    });
    if (roleDosen === null) {
      throw new Error('Role dosen not found');
    }

    for (const [index, record] of records.entries()) {
      const rowNum = index + 1;
      try {
        await this.prisma.$transaction(async (tx) => {
          const password = crypto.randomBytes(8).toString('hex');
          const hashedPassword = await bcrypt.hash(password, 10);

          const nama = record.nama ?? '';
          const email = record.email ?? '';
          const nidn = record.nidn ?? '';
          const prodiStr = record.prodi ?? '';

          const user = await tx.user.create({
            data: {
              name: nama,
              email,
              password: hashedPassword,
              phone_number: `TEMP-${Date.now()}-${Math.random()}`,
              roles: {
                connect: { id: roleDosen.id },
              },
            },
          });

          await tx.dosen.create({
            data: {
              user_id: user.id,
              nidn,
              prodi:
                prodiStr.length > 0 ? (prodiStr.toUpperCase() as Prodi) : null,
            },
          });

          await this.emailService.sendEmail(
            email,
            'Akun SITA BI - Dosen',
            `Selamat Datang. Password anda adalah: ${password}`,
          );
        });
        success++;
      } catch (e: unknown) {
        failed++;
        errors.push({
          row: rowNum,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return { total: records.length, success, failed, errors };
  }
}
