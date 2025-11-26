'use client';

import { useEffect, useState } from 'react';
import request from '@/lib/api'; // Use named import request
import Link from 'next/link';

type Pengumuman = {
  id: number;
  judul: string;
  isi: string;
  tanggal_dibuat: string;
  scheduled_at: string | null;
  is_published: boolean;
  audiens: string;
  pembuat: { name: string };
  _count: { pembaca: number };
};

export default function AdminPengumumanPage() {
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPengumuman();
  }, []);

  const fetchPengumuman = async () => {
    try {
      const response = await request<{ data: { data: Pengumuman[] } }>(
        '/pengumuman/all?limit=100',
      );
      if (Array.isArray(response.data?.data)) {
        setPengumuman(response.data.data);
      }
    } catch (_err) {
      console.error(_err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await request(`/pengumuman/${id}`, { method: 'DELETE' });
      fetchPengumuman();
    } catch {
      alert('Gagal menghapus');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Pengumuman</h1>
        <Link
          href="/dashboard/admin/pengumuman/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Buat Pengumuman
        </Link>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Judul
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Audiens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jadwal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pembaca
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pengumuman.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {p.judul}
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  {p.audiens.replace('_', ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.scheduled_at
                    ? new Date(p.scheduled_at).toLocaleString('id-ID')
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p._count?.pembaca || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 hover:text-red-900 ml-4"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
