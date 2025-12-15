import path from 'path';

const WEBSITE_URL = 'sitabi.pnp.ac.id';

export class DocumentHeaderService {
  addAcademicHeader(doc: PDFKit.PDFDocument, title: string): void {
    const startY = doc.y;
    const pageWidth = doc.page.width;
    const logoSize = 60;
    const logoMargin = 60;

    try {
      const logoPNPPath = path.join(
        __dirname,
        '../../public/logos/logo-pnp.png',
      );
      const logoBingPath = path.join(
        __dirname,
        '../../public/logos/logo-bing.png',
      );

      // Left logo (PNP)
      doc.image(logoPNPPath, logoMargin, startY, {
        width: logoSize,
        height: logoSize,
      });

      // Right logo (Bahasa Inggris)
      doc.image(logoBingPath, pageWidth - logoMargin - logoSize, startY, {
        width: logoSize,
        height: logoSize,
      });
    } catch (error) {
      console.error('Failed to load logos:', error);
    }

    // Center text - sesuai format dokumen kampus
    const textStartY = startY;

    // Baris 1: POLITEKNIK NEGERI PADANG (Bold)
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('POLITEKNIK NEGERI PADANG', 50, textStartY, {
        width: pageWidth - 100,
        align: 'center',
      });

    // Baris 2: JURUSAN BAHASA INGGRIS (Bold)
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('JURUSAN BAHASA INGGRIS', 50, textStartY + 15, {
        width: pageWidth - 100,
        align: 'center',
      });

    // Baris 3: Alamat lengkap
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        'Kampus Politeknik Negeri Padang, Limau Manis, Padang, Sumatera Barat',
        50,
        textStartY + 29,
        { width: pageWidth - 100, align: 'center' },
      );

    // Baris 4: Telepon dan Faks
    doc.text('Telepon (0751) 72590, Faks. (0751) 72576', 50, textStartY + 41, {
      width: pageWidth - 100,
      align: 'center',
    });

    // Baris 5: Website dan Email
    const centerX = pageWidth / 2;
    const websiteText = 'Laman : ';
    const websiteUrl = WEBSITE_URL;
    const emailText = '        Surel : ';
    const emailUrl = WEBSITE_URL;

    doc.fontSize(10).font('Helvetica');

    // Calculate text widths for proper alignment
    const websiteWidth = doc.widthOfString(websiteText);
    const urlWidth = doc.widthOfString(websiteUrl);
    const emailTextWidth = doc.widthOfString(emailText);
    const emailUrlWidth = doc.widthOfString(emailUrl);

    const totalWidth = websiteWidth + urlWidth + emailTextWidth + emailUrlWidth;
    const startX = centerX - totalWidth / 2;

    doc
      .text(websiteText, startX, textStartY + 53, { continued: true })
      .fillColor('blue')
      .text(websiteUrl, { continued: true })
      .fillColor('black')
      .text(emailText, { continued: true })
      .fillColor('blue')
      .text(emailUrl)
      .fillColor('black');

    // Line separator (garis horizontal tebal)
    const lineY = startY + 68;
    doc
      .moveTo(50, lineY)
      .lineTo(pageWidth - 50, lineY)
      .lineWidth(2)
      .stroke();

    // Title below line (PENGUMUMAN dengan nomor)
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(title.toUpperCase(), 50, lineY + 15, {
        width: pageWidth - 100,
        align: 'center',
      })
      .moveDown(1.5);

    // Reset y position for content
    doc.y = lineY + 40;
  }
}
