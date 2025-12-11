'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRBAC } from '@/hooks/useRBAC';
import { Megaphone, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface PengumumanData {
  id: number;
  judul: string;
  isi: string;
  tanggal_dibuat: string;
  pembuat: {
    name: string;
    roles?: Array<{ name: string }>;
  };
}

const getPublisherLabel = (roles?: Array<{ name: string }>): string => {
  if (!roles) return 'Sistem';
  if (roles.some((r) => r.name === 'admin')) return 'Admin';
  if (roles.some((r) => r.name === 'jurusan')) return 'Jurusan';
  if (roles.some((r) => r.name === 'prodi_d3')) return 'Prodi D3';
  if (roles.some((r) => r.name === 'prodi_d4')) return 'Prodi D4';
  return 'Sistem';
};

export default function Pengumuman() {
  const { isMahasiswa, isDosen } = useRBAC();
  const [pengumuman, setPengumuman] = useState<PengumumanData[]>([]);
  const [filteredPengumuman, setFilteredPengumuman] = useState<
    PengumumanData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('semua');

  const fetchPengumuman = async () => {
    try {
      const endpoint = isMahasiswa
        ? '/pengumuman/mahasiswa'
        : '/pengumuman/dosen';
      const response = await api.get(endpoint);
      let data = response.data;
      if (data?.data?.data) {
        data = data.data.data;
      } else if (data?.data) {
        data = data.data;
      }
      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) =>
            new Date(b.tanggal_dibuat).getTime() -
            new Date(a.tanggal_dibuat).getTime(),
        );
        setPengumuman(sorted);
        setFilteredPengumuman(sorted);
      }
    } catch (error) {
      toast.error('Gagal memuat pengumuman');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengumuman();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMahasiswa, isDosen]);

  useEffect(() => {
    if (filter === 'semua') {
      setFilteredPengumuman(pengumuman);
    } else {
      const filtered = pengumuman.filter((item) => {
        const roles = item.pembuat.roles || [];
        return roles.some((r) => r.name === filter);
      });
      setFilteredPengumuman(filtered);
    }
  }, [filter, pengumuman]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">Memuat pengumuman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Pengumuman</h2>
              <p className="text-red-100 text-sm">
                Informasi terbaru untuk Anda
              </p>
            </div>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-white focus:border-white"
          >
            <option value="semua">Semua</option>
            <option value="admin">Admin</option>
            <option value="jurusan">Jurusan</option>
            <option value="prodi_d3">Prodi D3</option>
            <option value="prodi_d4">Prodi D4</option>
          </select>
        </div>
      </div>

      {filteredPengumuman.length > 0 ? (
        <div className="space-y-4">
          {filteredPengumuman.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
            >
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-100">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-gray-900 flex-1">
                    {item.judul}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-sm">
                    <Calendar className="h-3.5 w-3.5 text-red-600" />
                    {new Date(item.tanggal_dibuat).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <div
                  className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.isi }}
                />
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-end gap-2 text-xs text-gray-600">
                  <span className="font-medium">Dipublikasi oleh</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                    {getPublisherLabel(item.pembuat.roles)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Megaphone className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Belum Ada Pengumuman
          </h3>
          <p className="text-gray-500 text-sm">
            Pengumuman terbaru akan muncul di sini
          </p>
        </div>
      )}
    </div>
  );
}
