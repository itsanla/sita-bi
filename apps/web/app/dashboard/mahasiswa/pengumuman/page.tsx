'use client';

import React, { useState, useEffect } from 'react';
import request from '@/lib/api';
import { Megaphone } from 'lucide-react';

// Interface for Announcement data
interface Pengumuman {
  id: number;
  judul: string;
  isi: string;
  tanggal_dibuat: string;
  pembuat: {
    name: string;
  };
}

// Component for a single announcement card
const PengumumanCard = ({ pengumuman }: { pengumuman: Pengumuman }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-800">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-800">{pengumuman.judul}</h2>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {new Date(pengumuman.tanggal_dibuat).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
      <p
        className="text-gray-600 mb-4"
        dangerouslySetInnerHTML={{ __html: pengumuman.isi }}
      />
      <div className="text-right text-sm text-gray-500">
        - {pengumuman.pembuat.name}
      </div>
    </div>
  );
};

// Main page component
const PengumumanPage = () => {
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPengumuman = async () => {
      try {
        const response = await request<{ data: Pengumuman[] }>(
          '/pengumuman/mahasiswa',
        );
        if (Array.isArray(response.data)) {
          setPengumuman(response.data);
        }
      } catch (err) {
        setError('Gagal memuat pengumuman.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPengumuman();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Megaphone className="h-8 w-8 text-red-800" />
        <h1 className="text-3xl font-bold text-gray-800">Pengumuman</h1>
      </div>

      {!!loading && <p className="text-center text-gray-500">Memuat...</p>}
      {!!error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && pengumuman.length > 0 && (
        <div className="space-y-6">
          {pengumuman.map((item) => (
            <PengumumanCard key={item.id} pengumuman={item} />
          ))}
        </div>
      )}

      {!loading && !error && pengumuman.length === 0 && (
        <div className="text-center py-12 px-6 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">Tidak ada pengumuman saat ini.</p>
        </div>
      )}
    </div>
  );
};

export default PengumumanPage;
