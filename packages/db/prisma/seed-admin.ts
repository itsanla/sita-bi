import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding essential data...');

  // 1. Seed all essential roles
  console.log('Seeding roles...');
  const rolesToSeed: string[] = [
    'admin',
    'dosen',
    'mahasiswa',
    'kajur',
    'kaprodi_d3',
    'kaprodi_d4',
  ];
  for (const roleName of rolesToSeed) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, guard_name: 'api' },
    });
  }
  console.log('Roles seeded.');

  // 2. Seed the admin user
  console.log('Seeding admin user...');
  const adminEmail = 'admin@sita.bi';
  const adminPassword = 'password123';
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  if (adminRole) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        email_verified_at: new Date(),
        roles: {
          connect: { id: adminRole.id },
        },
      },
      create: {
        email: adminEmail,
        name: 'Super Admin',
        phone_number: '+6281100000001',
        password: hashedPassword,
        email_verified_at: new Date(),
        roles: {
          connect: { id: adminRole.id },
        },
      },
    });
    console.log(`Admin user seeded successfully:`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminPassword}`);
  } else {
    console.error('Could not find admin role to seed admin user.');
  }

  // 3. Seed the Dosen user
  console.log('Seeding dosen user...');
  const dosenEmail = 'dosen@sita.bi';
  const dosenPassword = 'password123';
  const dosenRole = await prisma.role.findUnique({ where: { name: 'dosen' } });

  if (dosenRole) {
    const hashedPassword = await bcrypt.hash(dosenPassword, 10);
    const dosenUser = await prisma.user.upsert({
      where: { email: dosenEmail },
      update: {
        password: hashedPassword,
        email_verified_at: new Date(),
      },
      create: {
        email: dosenEmail,
        name: 'Dosen Pengampu',
        phone_number: '+6281100000002',
        password: hashedPassword,
        email_verified_at: new Date(),
        roles: {
          connect: { id: dosenRole.id },
        },
        dosen: {
          create: {
            nidn: '1234567890', // Placeholder NIDN
          },
        },
      },
    });
    console.log(`Dosen user seeded successfully:`);
    console.log(`Email: ${dosenUser.email}`);
    console.log(`Password: ${dosenPassword}`);
  } else {
    console.error('Could not find dosen role to seed dosen user.');
  }

  // 4. Seed the Mahasiswa user
  console.log('Seeding mahasiswa user...');
  const mahasiswaEmail = 'sitabi.pnp@gmail.com';
  const mahasiswaPassword = 'password123';
  const mahasiswaRole = await prisma.role.findUnique({
    where: { name: 'mahasiswa' },
  });

  if (mahasiswaRole) {
    const hashedPassword = await bcrypt.hash(mahasiswaPassword, 10);
    const mahasiswaUser = await prisma.user.upsert({
      where: { email: mahasiswaEmail },
      update: {
        password: hashedPassword,
        email_verified_at: new Date(),
      },
      create: {
        email: mahasiswaEmail,
        name: 'Mahasiswa Uji',
        phone_number: '+6281100000003',
        password: hashedPassword,
        email_verified_at: new Date(),
        roles: {
          connect: { id: mahasiswaRole.id },
        },
        mahasiswa: {
          create: {
            nim: '2201012023', // Placeholder NIM
            prodi: 'D4', // Placeholder Prodi
            kelas: 'TI-1A',
          },
        },
      },
    });
    console.log(`Mahasiswa user seeded successfully:`);
    console.log(`Email: ${mahasiswaUser.email}`);
    console.log(`Password: ${mahasiswaPassword}`);
  } else {
    console.error('Could not find mahasiswa role to seed mahasiswa user.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
