import type { User } from '@repo/db';
import { PrismaClient, Prisma } from '@repo/db';
import * as bcrypt from 'bcrypt';
import type {
  CreateDosenDto,
  UpdateDosenDto,
  UpdateMahasiswaDto,
  CreateMahasiswaDto,
} from '../dto/users.dto';
import { Role } from '../middlewares/auth.middleware';

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

    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          phone_number: dto.phone_number || '',
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.['target'] as string[]) || [];
          const err: any = new Error();
          err.statusCode = 409;
          if (target.includes('email')) {
            err.message = 'Email sudah digunakan oleh user lain';
          } else if (target.includes('phone_number')) {
            err.message = 'Nomor HP sudah digunakan oleh user lain';
          } else if (target.includes('nim')) {
            err.message = 'NIM sudah digunakan oleh mahasiswa lain';
          } else {
            err.message = 'Data sudah ada di sistem';
          }
          throw err;
        }
      }
      throw error;
    }
  }

  async createDosen(dto: CreateDosenDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Selalu tambahkan peran 'dosen' secara default
    const rolesToConnect = [{ name: Role.dosen }];

    // Tambahkan peran lain dari DTO jika ada dan valid
    if (dto.roles != null) {
      const validRoles = [Role.jurusan, Role.prodi_d3, Role.prodi_d4];
      dto.roles.forEach((roleName) => {
        if (roleName !== Role.dosen && validRoles.includes(roleName)) {
          rolesToConnect.push({ name: roleName });
        }
      });
    }

    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          phone_number: dto.phone_number || '',
          roles: {
            connect: rolesToConnect,
          },
          dosen: {
            create: {
              nip: dto.nip,
              prodi: dto.prodi ?? null,
            },
          },
        },
        include: {
          dosen: true,
          roles: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.['target'] as string[]) || [];
          const err: any = new Error();
          err.statusCode = 409;
          if (target.includes('email')) {
            err.message = 'Email sudah digunakan oleh user lain';
          } else if (target.includes('phone_number')) {
            err.message = 'Nomor HP sudah digunakan oleh user lain';
          } else if (target.includes('nip')) {
            err.message = 'NIP sudah digunakan oleh dosen lain';
          } else {
            err.message = 'Data sudah ada di sistem';
          }
          throw err;
        }
      }
      throw error;
    }
  }

  async updateDosen(id: number, dto: UpdateDosenDto): Promise<User> {
    const userData: Prisma.UserUpdateInput = {};

    if (dto.name != null) userData.name = dto.name;
    if (dto.email != null) userData.email = dto.email;
    // Password tidak bisa diubah oleh admin, hanya user sendiri yang bisa mengubah password
    if (dto.roles != null) {
      userData.roles = {
        set: dto.roles.map((roleName) => ({ name: roleName })),
      };
    }
    if (dto.nip != null || dto.prodi !== undefined) {
      const dosenUpdate: Prisma.DosenUpdateInput = {};
      if (dto.nip != null) dosenUpdate.nip = dto.nip;
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
    // Password tidak bisa diubah oleh admin, hanya user sendiri yang bisa mengubah password

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
              kelas: true,
              tugasAkhir: {
                select: {
                  periode_ta_id: true,
                },
              },
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
              nip: true,
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

  async deleteUser(id: number, currentUserId?: number): Promise<User> {
    const user = await this.findUserById(id);
    if (user === null) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Proteksi 1: Tidak bisa hapus diri sendiri
    if (currentUserId && id === currentUserId) {
      const err: any = new Error(
        'Anda tidak dapat menghapus akun Anda sendiri',
      );
      err.statusCode = 403;
      throw err;
    }

    // Proteksi 2: Cek apakah user adalah admin
    const isAdmin = user.roles.some((role) => role.name === 'admin');
    if (isAdmin) {
      // Hitung jumlah admin yang ada
      const adminCount = await this.prisma.user.count({
        where: {
          roles: {
            some: {
              name: 'admin',
            },
          },
        },
      });

      // Proteksi 3: Minimal harus ada 1 admin
      if (adminCount <= 1) {
        const err: any = new Error(
          'Tidak dapat menghapus admin terakhir. Sistem harus memiliki minimal 1 admin.',
        );
        err.statusCode = 403;
        throw err;
      }
    }

    // Hapus dalam transaction untuk memastikan konsistensi
    return await this.prisma.$transaction(async (tx) => {
      // Jika mahasiswa, hapus semua data terkait
      if (user.mahasiswa) {
        const mahasiswaId = user.mahasiswa.id;
        
        // Cari tugas akhir
        const tugasAkhir = await tx.tugasAkhir.findUnique({
          where: { mahasiswa_id: mahasiswaId },
        });

        if (tugasAkhir) {
          // Cari sidang untuk hapus relasi
          const sidangList = await tx.sidang.findMany({
            where: { tugas_akhir_id: tugasAkhir.id },
          });

          for (const sidang of sidangList) {
            // Hapus jadwal sidang
            await tx.jadwalSidang.deleteMany({
              where: { sidang_id: sidang.id },
            });

            // Hapus nilai sidang
            await tx.nilaiSidang.deleteMany({
              where: { sidang_id: sidang.id },
            });
          }

          // Hapus sidang
          await tx.sidang.deleteMany({
            where: { tugas_akhir_id: tugasAkhir.id },
          });

          // Hapus bimbingan
          await tx.bimbinganTA.deleteMany({
            where: { tugas_akhir_id: tugasAkhir.id },
          });

          // Hapus dokumen TA
          await tx.dokumenTa.deleteMany({
            where: { tugas_akhir_id: tugasAkhir.id },
          });

          // Hapus peran dosen
          await tx.peranDosenTa.deleteMany({
            where: { tugas_akhir_id: tugasAkhir.id },
          });

          // Hapus tugas akhir
          await tx.tugasAkhir.delete({
            where: { id: tugasAkhir.id },
          });
        }

        // Hapus pengajuan bimbingan
        await tx.pengajuanBimbingan.deleteMany({
          where: { mahasiswa_id: mahasiswaId },
        });

        // Hapus history topik
        await tx.historyTopikMahasiswa.deleteMany({
          where: { mahasiswa_id: mahasiswaId },
        });
      }

      // Jika dosen, update/hapus referensi
      if (user.dosen) {
        const dosenId = user.dosen.id;
        
        // Hapus peran dosen di tugas akhir
        await tx.peranDosenTa.deleteMany({
          where: { dosen_id: dosenId },
        });
        
        // Hapus tawaran topik
        await tx.tawaranTopik.deleteMany({
          where: { user_id: user.id },
        });
      }

      // Hapus user (cascade akan handle mahasiswa/dosen profile)
      return await tx.user.delete({ where: { id } });
    });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async bulkDeleteUsers(
    ids: number[],
  ): Promise<{ count: number; failed: number[] }> {
    const results = { count: 0, failed: [] as number[] };

    for (const id of ids) {
      try {
        await this.prisma.user.delete({ where: { id } });
        results.count++;
      } catch (e) {
        results.failed.push(id);
      }
    }

    return results;
  }

  async checkUserRelations(id: number): Promise<{
    hasData: boolean;
    details: {
      tugasAkhir: boolean;
      bimbingan: number;
      jadwalSidang: boolean;
      periode?: string;
    };
  }> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const details = {
      tugasAkhir: false,
      bimbingan: 0,
      jadwalSidang: false,
      periode: undefined as string | undefined,
    };

    if (user.mahasiswa) {
      const tugasAkhir = await this.prisma.tugasAkhir.findUnique({
        where: { mahasiswa_id: user.mahasiswa.id },
        include: {
          bimbinganTa: true,
          sidang: {
            include: {
              jadwalSidang: true,
            },
          },
          periodeTa: true,
        },
      });

      if (tugasAkhir) {
        details.tugasAkhir = true;
        details.bimbingan = tugasAkhir.bimbinganTa.length;
        details.jadwalSidang = tugasAkhir.sidang.some(
          (s) => s.jadwalSidang.length > 0,
        );
        details.periode = tugasAkhir.periodeTa?.nama;
      }
    }

    const hasData = details.tugasAkhir || details.bimbingan > 0 || details.jadwalSidang;

    return { hasData, details };
  }

  async findAllMahasiswaWithTA(): Promise<unknown[]> {
    const mahasiswa = await this.prisma.mahasiswa.findMany({
      where: {
        tugasAkhir: {
          periodeTa: {
            status: 'AKTIF',
          },
        },
      },
      select: {
        id: true,
        nim: true,
        prodi: true,
        kelas: true,
        siap_sidang: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        tugasAkhir: {
          include: {
            peranDosenTa: {
              include: {
                dosen: {
                  include: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            bimbinganTa: {
              select: {
                id: true,
                sesi_ke: true,
                status_bimbingan: true,
                tanggal_bimbingan: true,
                peran: true,
              },
              orderBy: {
                sesi_ke: 'asc',
              },
            },
            dokumenTa: {
              select: {
                divalidasi_oleh_p1: true,
                divalidasi_oleh_p2: true,
              },
              orderBy: {
                version: 'desc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        nim: 'asc',
      },
    });

    return mahasiswa;
  }
}
