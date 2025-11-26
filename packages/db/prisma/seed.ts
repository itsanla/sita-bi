import {
  PrismaClient,
  AudiensPengumuman,
  Prisma,
  Prodi,
  StatusTugasAkhir,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding announcements...');

  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@sita.bi' },
  });

  if (!adminUser) {
    console.error(
      'Admin user not found. Please seed the admin user first by running `pnpm db:seed:admin`',
    );
    return;
  }

  const announcements = [];
  const audienceValues = Object.values(AudiensPengumuman);

  for (let i = 0; i < 200; i++) {
    const judul = faker.lorem.sentence();
    const isi = faker.lorem.paragraphs(3);
    const audiens = faker.helpers.arrayElement(audienceValues);
    const tanggal_dibuat = faker.date.past({ years: 2 });

    announcements.push({
      judul,
      isi,
      audiens,
      dibuat_oleh: adminUser.id,
      tanggal_dibuat,
    });
  }

  const result = await prisma.pengumuman.createMany({
    data: announcements,
  });

  console.log(`Seeding finished. ${result.count} announcements created.`);

  console.log('Start seeding 50 Dosen...');

  const dosenRole = await prisma.role.findUnique({ where: { name: 'dosen' } });

  if (!dosenRole) {
    console.error('Dosen role not found. Please ensure roles are seeded.');
    return;
  }

  const dosenToSeed = [];
  for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const email = faker.internet
      .email({ firstName, lastName })
      .toLowerCase()
      .replace('@', `.${i}@`);
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const nidn = `${faker.string.numeric(9)}${i}`;
    const phoneNumber = `+628${faker.string.numeric(10)}`;

    dosenToSeed.push({
      user: {
        create: {
          name: name,
          email: email,
          password: hashedPassword,
          phone_number: phoneNumber,
          roles: {
            connect: { id: dosenRole.id },
          },
        },
      },
      nidn: nidn,
    });

    if ((i + 1) % 100 === 0) {
      console.log(`Generated ${i + 1} dosen data...`);
    }
  }

  for (const dosenData of dosenToSeed) {
    try {
      await prisma.dosen.create({
        data: dosenData,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        console.warn(
          `Skipping duplicate entry for dosen: ${dosenData.user.create.email}`,
        );
      } else {
        console.error(`Error seeding dosen: ${(e as Error).message}`);
        throw e;
      }
    }
  }

  console.log('50 Dosen seeded successfully.');

  console.log('Start seeding 500 Mahasiswa...');
  const mahasiswaRole = await prisma.role.findUnique({
    where: { name: 'mahasiswa' },
  });
  if (!mahasiswaRole) {
    console.error('Mahasiswa role not found. Please ensure roles are seeded.');
    return;
  }

  const prodiValues = [Prodi.D3, Prodi.D4];
  const mahasiswaToSeed = [];
  for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const email = faker.internet
      .email({ firstName, lastName })
      .toLowerCase()
      .replace('@', `.${i + 50}@`);
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const nim = `M${faker.string.numeric(8)}${i}`;
    const phoneNumber = `+628${faker.string.numeric(10)}`;

    mahasiswaToSeed.push({
      user: {
        create: {
          name: name,
          email: email,
          password: hashedPassword,
          phone_number: phoneNumber,
          roles: { connect: { id: mahasiswaRole.id } },
        },
      },
      nim: nim,
      prodi: faker.helpers.arrayElement(prodiValues),
      kelas: faker.helpers.arrayElement(['A', 'B', 'C']),
    });
  }

  for (const mahasiswaData of mahasiswaToSeed) {
    try {
      await prisma.mahasiswa.create({ data: mahasiswaData });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        console.warn(
          `Skipping duplicate entry for mahasiswa: ${mahasiswaData.user.create.email}`,
        );
      } else {
        console.error(`Error seeding mahasiswa: ${(e as Error).message}`);
        throw e;
      }
    }
  }
  console.log('500 Mahasiswa seeded successfully.');

  console.log('Start seeding 500 Tugas Akhir...');
  const mahasiswaWithoutTA = await prisma.mahasiswa.findMany({
    where: { tugasAkhir: null },
    take: 500,
  });

  if (mahasiswaWithoutTA.length === 0) {
    console.warn(
      'No mahasiswa found without a Tugas Akhir. Skipping Tugas Akhir seeding.',
    );
  } else {
    const tugasAkhirToSeed = [];
    for (const mahasiswa of mahasiswaWithoutTA) {
      const title = faker.company.catchPhrase() + ' on ' + faker.hacker.noun();
      tugasAkhirToSeed.push({
        judul: title,
        mahasiswa_id: mahasiswa.id,
        status: StatusTugasAkhir.DIAJUKAN,
        tanggal_pengajuan: faker.date.past({ years: 1 }),
      });
    }
    await prisma.tugasAkhir.createMany({ data: tugasAkhirToSeed });
    console.log(
      `${mahasiswaWithoutTA.length} Tugas Akhir seeded successfully.`,
    );
  }

  console.log('Start seeding 500 Tawaran Topik...');
  const allDosen = await prisma.dosen.findMany({ include: { user: true } });
  if (allDosen.length === 0) {
    console.warn('No dosen found. Skipping Tawaran Topik seeding.');
  } else {
    const tawaranTopikToSeed = [];
    for (let i = 0; i < 20; i++) {
      const randomDosen = faker.helpers.arrayElement(allDosen);
      tawaranTopikToSeed.push({
        judul_topik: faker.commerce.productName() + ' Integration System',
        deskripsi: faker.lorem.paragraph(),
        kuota: faker.number.int({ min: 1, max: 5 }),
        user_id: randomDosen.user_id,
      });
    }
    await prisma.tawaranTopik.createMany({ data: tawaranTopikToSeed });
    console.log('500 Tawaran Topik seeded successfully.');
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
