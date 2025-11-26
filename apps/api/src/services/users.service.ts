import type { User } from '@repo/db';
import { PrismaClient, Prisma } from '@repo/db';
import * as bcrypt from 'bcrypt';
import type {
  CreateDosenDto,
  UpdateDosenDto,
  UpdateMahasiswaDto,
  CreateMahasiswaDto,
} from '../dto/users.dto';
import { Role } from '@repo/types';

export class UsersService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findOneByEmail(
    email: string,
  ): Promise<Prisma.UserGetPayload<{ include: { roles: true } }> | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
  }

  async findUserById(id: number): Promise<Prisma.UserGetPayload<{
    include: { roles: true; mahasiswa: true; dosen: true };
  }> | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: true, mahasiswa: true, dosen: true },
    });
  }

  async createMahasiswa(dto: CreateMahasiswaDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone_number: dto.phone_number ?? '', // Default empty string jika tidak ada
        roles: {
          connect: { name: Role.mahasiswa },
        },
        mahasiswa: {
          create: {
            nim: dto.nim,
            prodi: dto.prodi,
            kelas: dto.kelas,
          },
        },
      },
      include: {
        mahasiswa: true,
      },
    });
  }

  async createDosen(dto: CreateDosenDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Selalu tambahkan peran 'dosen' secara default
    const rolesToConnect = [{ name: Role.dosen }];

    // Tambahkan peran lain dari DTO jika ada dan valid
    if (dto.roles != null) {
      const validRoles = [Role.kajur, Role.kaprodi_d3, Role.kaprodi_d4];
      dto.roles.forEach((roleName) => {
        if (roleName !== Role.dosen && validRoles.includes(roleName)) {
          rolesToConnect.push({ name: roleName });
        }
      });
    }

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone_number: dto.phone_number ?? '', // Default empty string jika tidak ada
        roles: {
          connect: rolesToConnect,
        },
        dosen: {
          create: {
            nidn: dto.nidn,
            prodi: dto.prodi,
          },
        },
      },
      include: {
        dosen: true,
        roles: true,
      },
    });
  }

  async updateDosen(id: number, dto: UpdateDosenDto): Promise<User> {
    const userData: Prisma.UserUpdateInput = {};

    if (dto.name != null) userData.name = dto.name;
    if (dto.email != null) userData.email = dto.email;
    if (dto.password != null)
      userData.password = await bcrypt.hash(dto.password, 10);
    if (dto.roles != null) {
      userData.roles = {
        set: dto.roles.map((roleName) => ({ name: roleName })),
      };
    }
    if (dto.nidn != null || dto.prodi !== undefined) {
      const dosenUpdate: Prisma.DosenUpdateInput = {};
      if (dto.nidn != null) dosenUpdate.nidn = dto.nidn;
      if (dto.prodi !== undefined) dosenUpdate.prodi = dto.prodi;
      userData.dosen = {
        update: dosenUpdate,
      };
    }

    return this.prisma.user.update({
      where: { id },
      data: userData,
      include: { dosen: true, roles: true },
    });
  }

  async updateMahasiswa(id: number, dto: UpdateMahasiswaDto): Promise<User> {
    const userData: Prisma.UserUpdateInput = {};
    const mahasiswaData: Prisma.MahasiswaUpdateInput = {};

    if (dto.name != null) userData.name = dto.name;
    if (dto.email != null) userData.email = dto.email;
    if (dto.password != null)
      userData.password = await bcrypt.hash(dto.password, 10);

    if (dto.nim != null) mahasiswaData.nim = dto.nim;
    if (dto.prodi != null) mahasiswaData.prodi = dto.prodi;
    // angkatan field sudah tidak dipakai
    if (dto.kelas != null) mahasiswaData.kelas = dto.kelas;

    if (Object.keys(mahasiswaData).length > 0) {
      userData.mahasiswa = {
        update: mahasiswaData,
      };
    }

    return this.prisma.user.update({
      where: { id },
      data: userData,
      include: { mahasiswa: true, roles: true },
    });
  }

  async findAllMahasiswa(page = 1, limit = 50): Promise<unknown> {
    const skip = (page - 1) * limit;
    const take = limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        where: { mahasiswa: { isNot: null } },
        select: {
          id: true,
          name: true,
          email: true,
          mahasiswa: {
            select: {
              nim: true,
              prodi: true,
              // angkatan field sudah tidak dipakai
              kelas: true,
            },
          },
          roles: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      }),
      this.prisma.user.count({ where: { mahasiswa: { isNot: null } } }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllMahasiswaTanpaPembimbing(
    page = 1,
    limit = 50,
  ): Promise<{
    data: {
      id: number;
      user: { id: number; name: string; email: string };
      nim: string;
      prodi: string;
      kelas: string;
    }[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    // Cari mahasiswa yang belum punya tugas akhir dengan pembimbing
    const mahasiswaQuery = this.prisma.mahasiswa.findMany({
      where: {
        tugasAkhir: {
          is: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    const countQuery = this.prisma.mahasiswa.count({
      where: {
        tugasAkhir: {
          is: null,
        },
      },
    });

    const [mahasiswa, total] = await Promise.all([mahasiswaQuery, countQuery]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: mahasiswa, // Type assertion karena Prisma return type include semua field
      page,
      limit,
      total,
      totalPages,
    };
  }

  async findAllDosen(page = 1, limit = 50): Promise<unknown> {
    const skip = (page - 1) * limit;
    const take = limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        where: { dosen: { isNot: null } },
        select: {
          id: true,
          name: true,
          email: true,
          dosen: {
            select: {
              nidn: true,
            },
          },
          roles: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      }),
      this.prisma.user.count({ where: { dosen: { isNot: null } } }),
    ]);

    const data = users; // Return the nested structure directly

    return {
      data: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteUser(id: number): Promise<User> {
    const user = await this.findUserById(id);
    if (user === null) {
      throw new Error(`User with ID ${id} not found`);
    }
    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // Foreign key constraint violation
        if (e.code === 'P2003') {
          throw new Error(
            'Cannot delete this user. They are linked to other records (e.g., announcements, thesis topics). Please reassign or delete those records first.',
          );
        }
      }
      // Re-throw other errors
      throw e;
    }
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
