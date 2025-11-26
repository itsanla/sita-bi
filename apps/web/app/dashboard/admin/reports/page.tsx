// apps/web/app/admin/reports/page.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api, { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import ExportButton from './components/ExportButton';
import { BookUp, FileText, Users, CalendarDays } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [sidangId, setSidangId] = useState('');

  const handleDownload = async (
    url: string,
    filename: string,
    params: Record<string, string | number> = {},
  ): Promise<void> => {
    try {
      const response = await api.get(url, {
        params,
        responseType: 'blob', // Important for file downloads
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      toast.success(`Berhasil mengunduh ${filename}`);
    } catch (error) {
      toast.error(`Gagal mengunduh file: ${handleApiError(error)}`);
    }
  };

  if (!user || !user.roles?.some((r) => r.name === 'admin')) {
    return <div className="p-8 text-center text-red-500">Akses Ditolak.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Pusat Laporan & Ekspor Data
        </h1>
        <p className="text-gray-600 mt-1">
          Unduh data penting sistem dalam format PDF atau Excel.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Jadwal Sidang */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center gap-4 mb-3">
            <CalendarDays className="w-8 h-8 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800">Jadwal Sidang</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Ekspor jadwal sidang tugas akhir dalam periode tertentu.
          </p>
          <div className="flex gap-4">
            <ExportButton
              onClick={() =>
                handleDownload(
                  '/reports/export/jadwal-sidang/pdf',
                  'jadwal-sidang.pdf',
                )
              }
              fileType="PDF"
            />
            <ExportButton
              onClick={() =>
                handleDownload(
                  '/reports/export/jadwal-sidang/excel',
                  'jadwal-sidang.xlsx',
                )
              }
              fileType="Excel"
            />
          </div>
        </div>

        {/* Rekap Nilai */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center gap-4 mb-3">
            <BookUp className="w-8 h-8 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-800">
              Rekap Nilai Sidang
            </h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Ekspor rekapitulasi nilai sidang mahasiswa.
          </p>
          <div className="flex gap-4">
            <ExportButton
              onClick={() =>
                handleDownload(
                  '/reports/export/nilai-sidang/excel',
                  'rekap-nilai.xlsx',
                )
              }
              fileType="Excel"
            />
          </div>
        </div>

        {/* Data User */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center gap-4 mb-3">
            <Users className="w-8 h-8 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-800">Data Pengguna</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Ekspor data master mahasiswa dan dosen.
          </p>
          <div className="flex gap-4">
            <ExportButton
              onClick={() =>
                handleDownload('/reports/export/users/excel', 'users.xlsx')
              }
              fileType="Excel"
            />
          </div>
        </div>

        {/* Berita Acara */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
          <div className="flex items-center gap-4 mb-3">
            <FileText className="w-8 h-8 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-800">
              Cetak Berita Acara
            </h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Cetak berita acara (PDF) untuk sidang tertentu.
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Masukkan ID Sidang"
              value={sidangId}
              onChange={(e) => setSidangId(e.target.value)}
              className="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-indigo-500"
            />
            <ExportButton
              onClick={() =>
                handleDownload(
                  `/reports/export/berita-acara/${sidangId}`,
                  `berita-acara-sidang-${sidangId}.pdf`,
                )
              }
              fileType="PDF"
              disabled={!sidangId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
