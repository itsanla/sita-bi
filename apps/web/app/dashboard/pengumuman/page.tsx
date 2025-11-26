'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import request from '@/lib/api'; // Use request instead of api
import { useRouter } from 'next/navigation';

type Lampiran = {
  id: number;
  file_path: string;
  file_name: string;
};

type Pengumuman = {
  id: number;
  judul: string;
  isi: string;
  tanggal_dibuat: string;
  scheduled_at: string | null;
  prioritas: 'RENDAH' | 'MENENGAH' | 'TINGGI';
  kategori: string;
  lampiran: Lampiran[];
  pembuat: { name: string };
  pembaca?: { read_at: string }[];
};

export default function ViewPengumumanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterKategori, setFilterKategori] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;

    let endpoint = '/pengumuman/public';

    if (user) {
      const role = user.roles[0]?.name;
      if (role === 'admin') {
        router.replace('/dashboard/admin/pengumuman');
        return;
      } else if (role === 'dosen') {
        endpoint = '/pengumuman/dosen';
      } else if (role === 'mahasiswa') {
        endpoint = '/pengumuman/mahasiswa';
      }
    }

    if (filterKategori) {
      endpoint += `?kategori=${filterKategori}`;
    }

    const fetchPengumuman = async () => {
      try {
        const response = await request<{ data: { data: Pengumuman[] } }>(
          endpoint,
        );
        if (Array.isArray(response.data?.data)) {
          setPengumuman(response.data.data);
        }
      } catch {
        setError('Gagal memuat pengumuman.');
      } finally {
        setLoading(false);
      }
    };

    fetchPengumuman();
  }, [user, authLoading, router, filterKategori]);

  const markAsRead = async (id: number) => {
    try {
      await request(`/pengumuman/${id}/read`, { method: 'POST' });
      setPengumuman((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            return { ...p, pembaca: [{ read_at: new Date().toISOString() }] };
          }
          return p;
        }),
      );
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'TINGGI':
        return (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">
            PENTING
          </span>
        );
      case 'MENENGAH':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Info
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            Low
          </span>
        );
    }
  };

  if (loading || authLoading) return <div>Loading...</div>;
  if (error)
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pengumuman</h1>
        <select
          className="border border-gray-300 rounded-md p-2"
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          <option value="AKADEMIK">Akademik</option>
          <option value="ADMINISTRASI">Administrasi</option>
          <option value="KEMAHASISWAAN">Kemahasiswaan</option>
          <option value="LAINNYA">Lainnya</option>
        </select>
      </div>

      <div className="space-y-6">
        {pengumuman.length > 0 ? (
          pengumuman.map((p) => {
            const isRead = p.pembaca && p.pembaca.length > 0;
            return (
              <div
                key={p.id}
                className={`bg-white shadow-md rounded-lg p-6 border-l-4 ${isRead ? 'border-gray-200' : p.prioritas === 'TINGGI' ? 'border-red-500' : 'border-blue-500'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getPriorityBadge(p.prioritas)}
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {p.kategori}
                      </span>
                      {!isRead && !!user && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Baru
                        </span>
                      )}
                    </div>
                    <h2
                      className={`text-2xl font-semibold mb-2 ${isRead ? 'text-gray-700' : 'text-black'}`}
                    >
                      {p.judul}
                    </h2>
                    <p className="text-sm text-gray-500 mb-1">
                      Oleh: {p.pembuat?.name || 'Admin'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {new Date(
                        p.scheduled_at || p.tanggal_dibuat,
                      ).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!!user && !isRead && (
                    <button
                      onClick={() => markAsRead(p.id)}
                      className="text-xs text-blue-600 underline"
                    >
                      Tandai sudah dibaca
                    </button>
                  )}
                </div>

                <div className="prose max-w-none text-gray-800">
                  <p className="whitespace-pre-wrap">{p.isi}</p>
                </div>

                {p.lampiran && p.lampiran.length > 0 ? (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2">Lampiran:</h4>
                    <ul className="list-disc pl-5">
                      {p.lampiran.map((l) => (
                        <li key={l.id}>
                          <a
                            href={l.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {l.file_name || 'Dokumen Unduhan'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500">
            <p>Tidak ada pengumuman untuk kategori ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
