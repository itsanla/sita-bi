import { Metadata } from 'next';
import DocumentationContent from './DocumentationContent';

export const metadata: Metadata = {
  title: 'Dokumentasi - SITA-BI',
  description:
    'Dokumentasi lengkap sistem SITA-BI untuk mahasiswa dan dosen. Panduan penggunaan untuk mahasiswa, dosen, dan informasi tim pengembang.',
  keywords: 'SITA-BI, dokumentasi, tugas akhir, sistem informasi, panduan',
};

export const dynamic = 'force-dynamic';

export default function DokumentasiPage() {
  return <DocumentationContent />;
}
