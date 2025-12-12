import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { DocumentHeaderService } from './document-header.service';

interface JadwalExportData {
  mahasiswa: string;
  nim: string;
  ketua: string;
  sekretaris: string;
  anggota1: string;
  anggota2: string;
  hari_tanggal: string;
  pukul: string;
  ruangan: string;
}

export class ExportService {
  private headerService = new DocumentHeaderService();

  async generatePDF(data: JadwalExportData[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.headerService.addAcademicHeader(doc, 'Jadwal Sidang Tugas Akhir');

      const tableTop = doc.y;
      const colWidths = [30, 120, 70, 100, 80, 80, 80, 90, 60, 60];
      const headers = ['No', 'Mahasiswa', 'NIM', 'Ketua', 'Sekretaris', 'Anggota I', 'Anggota II', 'Hari/Tanggal', 'Pukul', 'Ruangan'];
      const tableLeft = 50;
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);

      // Draw header background
      doc.lineWidth(0.5).rect(tableLeft, tableTop - 3, tableWidth, 18).fillAndStroke('#f0f0f0', '#000000');

      // Header text
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x + 2, tableTop, { width: colWidths[i] - 4, align: 'center' });
        x += colWidths[i];
      });

      // Data
      doc.font('Helvetica').fontSize(8);
      let y = tableTop + 15;

      data.forEach((row, idx) => {
        const rowData = [
          (idx + 1).toString(),
          row.mahasiswa,
          row.nim,
          row.ketua,
          row.sekretaris,
          row.anggota1,
          row.anggota2,
          row.hari_tanggal,
          row.pukul,
          row.ruangan,
        ];

        // Calculate row height based on content
        let maxHeight = 0;
        rowData.forEach((text, i) => {
          const height = doc.heightOfString(text, { width: colWidths[i] - 4 });
          if (height > maxHeight) maxHeight = height;
        });
        const rowHeight = maxHeight + 6; // Add padding

        // Check if need new page
        if (y + rowHeight > doc.page.height - 80) {
          doc.addPage({ margin: 50, size: 'A4', layout: 'landscape' });
          y = 50;
          
          // Redraw header on new page
          doc.lineWidth(0.5).rect(tableLeft, y - 3, tableWidth, 18).fillAndStroke('#f0f0f0', '#000000');
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
          x = tableLeft;
          headers.forEach((header, i) => {
            doc.text(header, x + 2, y, { width: colWidths[i] - 4, align: 'center' });
            x += colWidths[i];
          });
          y += 15;
          doc.font('Helvetica').fontSize(8);
        }

        // Draw row border
        doc.lineWidth(0.5).rect(tableLeft, y, tableWidth, rowHeight).stroke('#000000');

        // Draw vertical lines
        x = tableLeft;
        colWidths.forEach((width) => {
          doc.lineWidth(0.5).moveTo(x, y).lineTo(x, y + rowHeight).stroke();
          x += width;
        });
        doc.lineWidth(0.5).moveTo(x, y).lineTo(x, y + rowHeight).stroke(); // Last vertical line

        // Draw row text
        x = tableLeft;
        rowData.forEach((text, i) => {
          doc.text(text, x + 2, y + 3, { width: colWidths[i] - 4, align: i === 0 ? 'center' : 'left' });
          x += colWidths[i];
        });

        y += rowHeight;
      });

      doc.end();
    });
  }

  async generateExcel(data: JadwalExportData[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Jadwal Sidang');

    // Header
    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = 'POLITEKNIK NEGERI PADANG';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').value = 'JURUSAN BAHASA INGGRIS';
    worksheet.getCell('A2').font = { bold: true, size: 12 };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:J3');
    worksheet.getCell('A3').value = 'JADWAL SIDANG TUGAS AKHIR';
    worksheet.getCell('A3').font = { bold: true, size: 14 };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // Table header
    const headerRow = worksheet.addRow([
      'No',
      'Mahasiswa',
      'NIM',
      'Ketua',
      'Sekretaris',
      'Anggota I',
      'Anggota II',
      'Hari/Tanggal',
      'Pukul',
      'Ruangan',
    ]);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data
    data.forEach((row, idx) => {
      const dataRow = worksheet.addRow([
        idx + 1,
        row.mahasiswa,
        row.nim,
        row.ketua,
        row.sekretaris,
        row.anggota1,
        row.anggota2,
        row.hari_tanggal,
        row.pukul,
        row.ruangan,
      ]);
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Column widths
    worksheet.columns = [
      { width: 5 },
      { width: 25 },
      { width: 15 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
    ];

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  async generatePDFJudulTA(data: Array<{no: number; nim: string; nama: string; judul: string}>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.headerService.addAcademicHeader(doc, 'Daftar Judul Tugas Akhir');

      const tableTop = doc.y;
      const colWidths = [40, 80, 180, 450];
      const headers = ['No', 'NIM', 'Nama', 'Judul'];
      const tableLeft = 50;
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);

      doc.lineWidth(0.5).rect(tableLeft, tableTop - 3, tableWidth, 18).fillAndStroke('#f0f0f0', '#000000');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x + 2, tableTop, { width: colWidths[i] - 4, align: 'center' });
        x += colWidths[i];
      });

      doc.font('Helvetica').fontSize(8);
      let y = tableTop + 15;

      data.forEach((row, idx) => {
        const rowData = [(idx + 1).toString(), row.nim, row.nama, row.judul];
        let maxHeight = 0;
        rowData.forEach((text, i) => {
          const height = doc.heightOfString(text, { width: colWidths[i] - 4 });
          if (height > maxHeight) maxHeight = height;
        });
        const rowHeight = maxHeight + 6;

        if (y + rowHeight > doc.page.height - 80) {
          doc.addPage({ margin: 50, size: 'A4', layout: 'landscape' });
          y = 50;
          doc.lineWidth(0.5).rect(tableLeft, y - 3, tableWidth, 18).fillAndStroke('#f0f0f0', '#000000');
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
          x = tableLeft;
          headers.forEach((header, i) => {
            doc.text(header, x + 2, y, { width: colWidths[i] - 4, align: 'center' });
            x += colWidths[i];
          });
          y += 15;
          doc.font('Helvetica').fontSize(8);
        }

        doc.lineWidth(0.5).rect(tableLeft, y, tableWidth, rowHeight).stroke('#000000');
        x = tableLeft;
        colWidths.forEach((width) => {
          doc.lineWidth(0.5).moveTo(x, y).lineTo(x, y + rowHeight).stroke();
          x += width;
        });
        doc.lineWidth(0.5).moveTo(x, y).lineTo(x, y + rowHeight).stroke();

        x = tableLeft;
        rowData.forEach((text, i) => {
          doc.text(text, x + 2, y + 3, { width: colWidths[i] - 4, align: i === 0 ? 'center' : 'left' });
          x += colWidths[i];
        });
        y += rowHeight;
      });

      doc.end();
    });
  }

  async generatePDFJadwalDosen(data: Array<{no: number; nama_dosen: string; tanggal: string; waktu: string; ruangan: string; mahasiswa: string; nim: string; peran: string}>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.headerService.addAcademicHeader(doc, 'Jadwal Tugas Akhir Dosen');

      const tableTop = doc.y;
      const colWidths = [30, 120, 90, 80, 70, 150, 80, 90];
      const headers = ['No', 'Dosen', 'Tanggal', 'Waktu', 'Ruangan', 'Mahasiswa', 'NIM', 'Peran'];
      const tableLeft = 50;
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);

      doc.lineWidth(0.5).rect(tableLeft, tableTop - 3, tableWidth, 18).fillAndStroke('#f0f0f0', '#000000');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x + 2, tableTop, { width: colWidths[i] - 4, align: 'center' });
        x += colWidths[i];
      });

      doc.font('Helvetica').fontSize(8);
      let y = tableTop + 15;

      data.forEach((row, idx) => {
        const rowData = [(idx + 1).toString(), row.nama_dosen, row.tanggal, row.waktu, row.ruangan, row.mahasiswa, row.nim, row.peran];
        let maxHeight = 0;
        rowData.forEach((text, i) => {
          const height = doc.heightOfString(text, { width: colWidths[i] - 4 });
          if (height > maxHeight) maxHeight = height;
        });
        const rowHeight = maxHeight + 6;

        if (y + rowHeight > doc.page.height - 80) {
          doc.addPage({ margin: 50, size: 'A4', layout: 'landscape' });
          y = 50;
          doc.lineWidth(0.5).rect(tableLeft, y - 3, tableWidth, 18).fillAndStroke('#f0f0f0', '#000000');
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
          x = tableLeft;
          headers.forEach((header, i) => {
            doc.text(header, x + 2, y, { width: colWidths[i] - 4, align: 'center' });
            x += colWidths[i];
          });
          y += 15;
          doc.font('Helvetica').fontSize(8);
        }

        doc.lineWidth(0.5).rect(tableLeft, y, tableWidth, rowHeight).stroke('#000000');
        x = tableLeft;
        colWidths.forEach((width) => {
          doc.lineWidth(0.5).moveTo(x, y).lineTo(x, y + rowHeight).stroke();
          x += width;
        });
        doc.lineWidth(0.5).moveTo(x, y).lineTo(x, y + rowHeight).stroke();

        x = tableLeft;
        rowData.forEach((text, i) => {
          doc.text(text, x + 2, y + 3, { width: colWidths[i] - 4, align: i === 0 ? 'center' : 'left' });
          x += colWidths[i];
        });
        y += rowHeight;
      });

      doc.end();
    });
  }

  async generatePDFGagalSidang(data: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.headerService.addAcademicHeader(doc, 'Daftar Mahasiswa Gagal Sidang');

      const tableTop = doc.y;
      const colWidths = [25, 110, 70, 45, 90, 155];
      const headers = ['No', 'Nama', 'NIM', 'Prodi', 'Status', 'Alasan'];
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);
      const pageWidth = doc.page.width;
      const tableLeft = (pageWidth - tableWidth) / 2;

      // Draw header
      doc.lineWidth(0.5).rect(tableLeft, tableTop - 3, tableWidth, 18).fillAndStroke('#f0f0f0', '#000000');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x + 2, tableTop, { width: colWidths[i] - 4, align: 'center' });
        x += colWidths[i];
      });

      // Data
      doc.font('Helvetica').fontSize(8);
      let y = tableTop + 15;

      data.forEach((row, idx) => {
        const rowData = [
          (idx + 1).toString(),
          row.nama,
          row.nim,
          row.prodi,
          row.status,
          row.alasan,
        ];

        let maxHeight = 0;
        rowData.forEach((text, i) => {
          const height = doc.heightOfString(text, { width: colWidths[i] - 4 });
          if (height > maxHeight) maxHeight = height;
        });
        const rowHeight = maxHeight + 6;

        if (y + rowHeight > doc.page.height - 80) {
          doc.addPage({ margin: 50, size: 'A4' });
          y = 50;
          
          doc.lineWidth(0.5).rect(tableLeft, y - 3, tableWidth, 18).fillAndStroke('#f0f0f0', '#000000');
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
          x = tableLeft;
          headers.forEach((header, i) => {
            doc.text(header, x + 2, y, { width: colWidths[i] - 4, align: 'center' });
            x += colWidths[i];
          });
          y += 15;
          doc.font('Helvetica').fontSize(8);
        }

        doc.lineWidth(0.5).rect(tableLeft, y, tableWidth, rowHeight).stroke('#000000');

        x = tableLeft;
        colWidths.forEach((width) => {
          doc.lineWidth(0.5).moveTo(x, y).lineTo(x, y + rowHeight).stroke();
          x += width;
        });
        doc.lineWidth(0.5).moveTo(x, y).lineTo(x, y + rowHeight).stroke();

        x = tableLeft;
        rowData.forEach((text, i) => {
          doc.text(text, x + 2, y + 3, { width: colWidths[i] - 4, align: i === 0 ? 'center' : 'left' });
          x += colWidths[i];
        });

        y += rowHeight;
      });

      doc.end();
    });
  }
}
