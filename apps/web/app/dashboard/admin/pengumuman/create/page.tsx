'use client';

import { useState } from 'react';
import request from '@/lib/api'; // Gunakan request, bukan default export 'api' karena api.ts export default function request
import { useRouter } from 'next/navigation';

export default function CreatePengumumanPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    audiens: 'all_users',
    prioritas: 'MENENGAH',
    kategori: 'LAINNYA',
    is_published: false,
    scheduled_at: '',
    berakhir_pada: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        scheduled_at: formData.scheduled_at
          ? new Date(formData.scheduled_at).toISOString()
          : null,
        berakhir_pada: formData.berakhir_pada
          ? new Date(formData.berakhir_pada).toISOString()
          : null,
      };
      // Ganti api.post dengan request
      await request('/pengumuman', {
        method: 'POST',
        data: payload,
      });
      router.push('/dashboard/admin/pengumuman');
    } catch (err) {
      console.error('[CreatePengumuman] Error:', err);
      alert('Gagal membuat pengumuman');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow mt-10">
      <h1 className="text-2xl font-bold mb-6">Buat Pengumuman Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Judul
          </label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            value={formData.isi}
            onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prioritas
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={formData.prioritas}
              onChange={(e) =>
                setFormData({ ...formData, prioritas: e.target.value })
              }
            >
              <option value="RENDAH">Rendah</option>
              <option value="MENENGAH">Menengah</option>
              <option value="TINGGI">Tinggi (Penting)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kategori
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Audiens
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={formData.audiens}
              onChange={(e) =>
                setFormData({ ...formData, audiens: e.target.value })
              }
            >
              <option value="all_users">Semua User</option>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
              <option value="registered_users">User Terdaftar</option>
              <option value="guest">Tamu</option>
            </select>
          </div>
          <div>{/* Empty space or additional field */}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Jadwal Tayang (Opsional)
            </label>
            <input
              type="datetime-local"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={formData.scheduled_at}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_at: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Berakhir Pada (Opsional)
            </label>
            <input
              type="datetime-local"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={formData.berakhir_pada}
              onChange={(e) =>
                setFormData({ ...formData, berakhir_pada: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="publish"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={formData.is_published}
            onChange={(e) =>
              setFormData({ ...formData, is_published: e.target.checked })
            }
          />
          <label htmlFor="publish" className="ml-2 block text-sm text-gray-900">
            Langsung Publikasikan (Atau set Status Ready jika terjadwal)
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Simpan Pengumuman
          </button>
        </div>
      </form>
    </div>
  );
}
