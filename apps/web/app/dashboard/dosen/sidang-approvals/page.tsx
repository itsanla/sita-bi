'use client';
import { Info } from 'lucide-react';

export default function SidangApprovalsPage() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Persetujuan Pendaftaran Sidang
      </h1>

      <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 p-12 rounded-lg">
        <Info size={48} className="mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold">Fitur Tidak Tersedia</h2>
        <p className="mt-2 max-w-md">
          Sistem persetujuan pendaftaran sidang telah dihapus. Mahasiswa dapat
          langsung mendaftar sidang setelah mengupload 5 dokumen yang
          diperlukan.
        </p>
      </div>
    </div>
  );
}
