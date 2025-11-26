import { PrismaClient } from '@repo/db';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export class ExportService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async generateJadwalSidangPdf(): Promise<Buffer> {
    const jadwal = await this.prisma.jadwalSidang.findMany({
      include: {
        ruangan: true,
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                mahasiswa: { include: { user: true } },
                peranDosenTa: {
                  include: { dosen: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { tanggal: 'asc' },
    });

    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text('Jadwal Sidang Tugas Akhir', 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 26);

    const tableData = jadwal.map((j) => {
      const mhs = j.sidang.tugasAkhir.mahasiswa.user.name;
      const judul = j.sidang.tugasAkhir.judul;
      const pembimbing = j.sidang.tugasAkhir.peranDosenTa
        .filter((p) => p.peran.startsWith('pembimbing'))
        .map((p) => p.dosen.user.name)
        .join(', ');
      const penguji = j.sidang.tugasAkhir.peranDosenTa
        .filter((p) => p.peran.startsWith('penguji'))
        .map((p) => p.dosen.user.name)
        .join(', ');

      return [
        new Date(j.tanggal).toLocaleDateString('id-ID'),
        `${j.waktu_mulai} - ${j.waktu_selesai}`,
        j.ruangan.nama_ruangan,
        mhs,
        judul,
        pembimbing,
        penguji,
      ];
    });

    autoTable(doc, {
      startY: 32,
      head: [
        [
          'Tanggal',
          'Waktu',
          'Ruangan',
          'Mahasiswa',
          'Judul',
          'Pembimbing',
          'Penguji',
        ],
      ],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  async generateJadwalSidangExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Jadwal Sidang');

    sheet.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Waktu Mulai', key: 'mulai', width: 10 },
      { header: 'Waktu Selesai', key: 'selesai', width: 10 },
      { header: 'Ruangan', key: 'ruangan', width: 20 },
      { header: 'NIM', key: 'nim', width: 15 },
      { header: 'Mahasiswa', key: 'mahasiswa', width: 30 },
      { header: 'Judul', key: 'judul', width: 50 },
      { header: 'Pembimbing', key: 'pembimbing', width: 40 },
      { header: 'Penguji', key: 'penguji', width: 40 },
    ];

    const jadwal = await this.prisma.jadwalSidang.findMany({
      include: {
        ruangan: true,
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                mahasiswa: { include: { user: true } },
                peranDosenTa: {
                  include: { dosen: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { tanggal: 'asc' },
    });

    jadwal.forEach((j) => {
      const ta = j.sidang.tugasAkhir;
      const pembimbing = ta.peranDosenTa
        .filter((p) => p.peran.startsWith('pembimbing'))
        .map((p) => p.dosen.user.name)
        .join(', ');
      const penguji = ta.peranDosenTa
        .filter((p) => p.peran.startsWith('penguji'))
        .map((p) => p.dosen.user.name)
        .join(', ');

      sheet.addRow({
        tanggal: new Date(j.tanggal).toLocaleDateString('id-ID'),
        mulai: j.waktu_mulai,
        selesai: j.waktu_selesai,
        ruangan: j.ruangan.nama_ruangan,
        nim: ta.mahasiswa.nim,
        mahasiswa: ta.mahasiswa.user.name,
        judul: ta.judul,
        pembimbing,
        penguji,
      });
    });

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }

  async generateRekapNilaiExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rekap Nilai');

    sheet.columns = [
      { header: 'NIM', key: 'nim', width: 15 },
      { header: 'Mahasiswa', key: 'mahasiswa', width: 30 },
      { header: 'Judul', key: 'judul', width: 50 },
      { header: 'Pembimbing', key: 'pembimbing', width: 40 },
      { header: 'Penguji', key: 'penguji', width: 40 },
      { header: 'Status Kelulusan', key: 'status', width: 20 },
      { header: 'Tanggal Sidang', key: 'tanggal', width: 15 },
      // Assuming we calculate final grade or show detail
    ];

    const sidangs = await this.prisma.sidang.findMany({
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: { include: { user: true } },
            peranDosenTa: { include: { dosen: { include: { user: true } } } },
          },
        },
        jadwalSidang: true,
      },
      where: {
        status_hasil: { not: 'menunggu_penjadwalan' },
      },
    });

    sidangs.forEach((s) => {
      const ta = s.tugasAkhir;
      const pembimbing = ta.peranDosenTa
        .filter((p) => p.peran.startsWith('pembimbing'))
        .map((p) => p.dosen.user.name)
        .join(', ');
      const penguji = ta.peranDosenTa
        .filter((p) => p.peran.startsWith('penguji'))
        .map((p) => p.dosen.user.name)
        .join(', ');

      const tanggal =
        s.jadwalSidang[0] !== undefined
          ? new Date(s.jadwalSidang[0].tanggal).toLocaleDateString('id-ID')
          : '-';

      sheet.addRow({
        nim: ta.mahasiswa.nim,
        mahasiswa: ta.mahasiswa.user.name,
        judul: ta.judul,
        pembimbing,
        penguji,
        status: s.status_hasil.replace('_', ' ').toUpperCase(),
        tanggal,
      });
    });

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }

  async generateUsersExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Mahasiswa Sheet
    const sheetMhs = workbook.addWorksheet('Mahasiswa');
    sheetMhs.columns = [
      { header: 'NIM', key: 'nim', width: 15 },
      { header: 'Nama', key: 'nama', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Prodi', key: 'prodi', width: 10 },
      { header: 'Kelas', key: 'kelas', width: 10 },
    ];

    const mahasiswas = await this.prisma.mahasiswa.findMany({
      include: { user: true },
    });
    mahasiswas.forEach((m) => {
      sheetMhs.addRow({
        nim: m.nim,
        nama: m.user.name,
        email: m.user.email,
        prodi: m.prodi,
        kelas: m.kelas,
      });
    });

    // Dosen Sheet
    const sheetDosen = workbook.addWorksheet('Dosen');
    sheetDosen.columns = [
      { header: 'NIDN', key: 'nidn', width: 15 },
      { header: 'Nama', key: 'nama', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Prodi', key: 'prodi', width: 10 },
    ];

    const dosens = await this.prisma.dosen.findMany({
      include: { user: true },
    });
    dosens.forEach((d) => {
      sheetDosen.addRow({
        nidn: d.nidn,
        nama: d.user.name,
        email: d.user.email,
        prodi: d.prodi !== null && d.prodi !== '' ? d.prodi : '-',
      });
    });

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }

  async generateBeritaAcaraPdf(sidangId: number): Promise<Buffer> {
    const sidang = await this.prisma.sidang.findUnique({
      where: { id: sidangId },
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: { include: { user: true } },
            peranDosenTa: { include: { dosen: { include: { user: true } } } },
          },
        },
        jadwalSidang: { include: { ruangan: true } },
        nilaiSidang: { include: { dosen: { include: { user: true } } } },
      },
    });

    if (sidang === null) throw new Error('Sidang not found');

    const doc = new jsPDF();
    const ta = sidang.tugasAkhir;
    const jadwal = sidang.jadwalSidang[0];

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BERITA ACARA SIDANG TUGAS AKHIR', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Politeknik Negeri Padang', 105, 26, { align: 'center' });

    doc.line(20, 30, 190, 30);

    // Data Sidang
    doc.setFontSize(11);
    const startY = 40;
    doc.text(`Nama Mahasiswa: ${ta.mahasiswa.user.name}`, 20, startY);
    doc.text(`NIM: ${ta.mahasiswa.nim}`, 20, startY + 6);
    doc.text(`Judul TA: ${ta.judul}`, 20, startY + 12);
    if (jadwal !== undefined) {
      doc.text(
        `Hari/Tanggal: ${new Date(jadwal.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        20,
        startY + 24,
      );
      doc.text(
        `Waktu: ${jadwal.waktu_mulai} - ${jadwal.waktu_selesai}`,
        20,
        startY + 30,
      );
      doc.text(`Ruangan: ${jadwal.ruangan.nama_ruangan}`, 20, startY + 36);
    }

    // Nilai
    const nilaiData = sidang.nilaiSidang.map((n) => [
      n.dosen.user.name,
      n.aspek,
      String(n.skor),
    ]);

    let finalY = startY + 50;

    autoTable(doc, {
      startY: finalY,
      head: [['Dosen Penguji', 'Aspek Penilaian', 'Skor']],
      body: nilaiData,
    });

    finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? finalY;
    finalY += 20;

    // Hasil
    doc.text(
      `Keputusan Sidang: ${sidang.status_hasil.replace('_', ' ').toUpperCase()}`,
      20,
      finalY,
    );

    // Tanda Tangan
    finalY += 30;
    const ttdY = finalY;

    // Assuming first 3 dosens for signature
    const signers = ta.peranDosenTa.slice(0, 3);
    signers.forEach((p, i) => {
      const x = 20 + i * 60;
      doc.text(p.dosen.user.name, x, ttdY);
      doc.text('(...........................)', x, ttdY + 20);
    });

    return Buffer.from(doc.output('arraybuffer'));
  }
}
