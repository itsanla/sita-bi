'use client';

import React from 'react';
import { useBimbinganDosen } from '@/hooks/useBimbingan';
import { useAuth } from '@/context/AuthContext';
import BimbinganCard from './BimbinganCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

interface Dosen {
  user: { name: string; id: number };
}

interface Lampiran {
  id: number;
  file_name: string;
  created_at: string;
}

interface Catatan {
  id: number;
  catatan: string;
  created_at: string;
  author: { name: string };
}

interface BimbinganSession {
  id: number;
  sesi_ke: number;
  tanggal_bimbingan: string | null;
  jam_bimbingan: string | null;
  jam_selesai: string | null;
  status_bimbingan: string;
  peran: string;
  lampiran: Lampiran[];
  catatan: Catatan[];
}

interface DokumenTA {
  id: number;
  file_path: string;
  divalidasi_oleh_p1: number | null;
  divalidasi_oleh_p2: number | null;
}

interface TugasAkhir {
  id: number;
  judul: string;
  status: string;
  mahasiswa: {
    user: { name: string; email: string };
  };
  peranDosenTa: { peran: string; dosen: Dosen }[];
  bimbinganTa: BimbinganSession[];
  dokumenTa: DokumenTA[];
}

export default function BimbinganList() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useBimbinganDosen();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !data?.data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Gagal memuat daftar bimbingan.</p>
      </div>
    );
  }

  const responseData = data.data as { data?: TugasAkhir[] };
  const bimbinganList = Array.isArray(responseData.data)
    ? responseData.data
    : [];

  if (!Array.isArray(bimbinganList) || bimbinganList.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={24} />
          <div>
            <h3 className="font-bold text-yellow-800">
              Belum Ada Mahasiswa Bimbingan
            </h3>
            <p className="text-yellow-700 text-sm">
              Anda belum memiliki mahasiswa bimbingan saat ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bimbinganList.map((ta) => {
        const currentDosenPeran =
          ta.peranDosenTa.find((p) => p.dosen.user.id === user?.id)?.peran ||
          '';

        return (
          <BimbinganCard
            key={ta.id}
            tugasAkhir={ta}
            onRefresh={() => refetch()}
            currentDosenPeran={currentDosenPeran}
          />
        );
      })}
    </div>
  );
}
