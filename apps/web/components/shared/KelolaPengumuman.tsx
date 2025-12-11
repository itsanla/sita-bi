'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import request from '@/lib/api';
import { Plus, Trash2, Eye, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';

interface PengumumanData {
  id: number;
  judul: string;
  isi: string;
  tanggal_dibuat: string;
  scheduled_at: string | null;
  is_published: boolean;
  audiens: string;
  pembuat: { name: string };
  _count: { pembaca: number };
}

export default function KelolaPengumuman() {
  const [pengumuman, setPengumuman] = useState<PengumumanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    kategori: 'LAINNYA',
  });

  useEffect(() => {
    fetchPengumuman();
  }, []);

  const fetchPengumuman = async () => {
    try {
      const response = await api.get('/pengumuman/all?limit=100');
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
      }
    } catch (error) {
      toast.error('Gagal memuat data pengumuman');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

    try {
      await api.delete(`/pengumuman/${id}`);
      toast.success('Pengumuman berhasil dihapus');
      fetchPengumuman();
    } catch (error) {
      toast.error('Gagal menghapus pengumuman');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        audiens: 'all_users',
        prioritas: 'MENENGAH',
        is_published: true,
      };
      await request('/pengumuman', {
        method: 'POST',
        data: payload,
      });
      toast.success('Pengumuman berhasil dibuat');
      setShowCreateModal(false);
      setFormData({
        judul: '',
        isi: '',
        kategori: 'LAINNYA',
      });
      fetchPengumuman();
    } catch (error) {
      toast.error('Gagal membuat pengumuman');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">Memuat data...</p>
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
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Kelola Pengumuman</h2>
              <p className="text-red-100 text-sm">Buat dan kelola pengumuman</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-white text-red-800 px-5 py-2.5 rounded-lg hover:bg-red-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Buat Pengumuman
          </button>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Judul Pengumuman
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tanggal Dibuat
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Pembaca
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {pengumuman.length > 0 ? (
                pengumuman.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-red-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.judul}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        oleh {item.pembuat.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-full shadow-sm ${
                          item.is_published
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {item.is_published ? '✓ Dipublikasi' : '○ Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.scheduled_at ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-red-600" />
                          <span className="font-medium">
                            {new Date(item.scheduled_at).toLocaleDateString(
                              'id-ID',
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          Tidak ada jadwal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {item._count?.pembaca || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        Belum ada pengumuman
                      </p>
                      <p className="text-gray-400 text-sm">
                        Klik tombol &quot;Buat Pengumuman&quot; untuk memulai
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!!showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Buat Pengumuman Baru
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Judul
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2"
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData({ ...formData, judul: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Isi Pengumuman
                </label>
                <textarea
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2"
                  value={formData.isi}
                  onChange={(e) =>
                    setFormData({ ...formData, isi: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kategori
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2"
                  value={formData.kategori}
                  onChange={(e) =>
                    setFormData({ ...formData, kategori: e.target.value })
                  }
                >
                  <option value="AKADEMIK">Akademik</option>
                  <option value="ADMINISTRASI">Administrasi</option>
                  <option value="KEMAHASISWAAN">Kemahasiswaan</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-900"
                >
                  Simpan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
