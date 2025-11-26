'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import request from '@/lib/api';
import { Save, ArrowLeft, Trash2, Loader } from 'lucide-react';

const audienceOptions = [
  'guest',
  'registered_users',
  'all_users',
  'dosen',
  'mahasiswa',
];

export default function EditPengumumanPage() {
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [audiens, setAudiens] = useState('all_users');
  const [loading, setLoading] = useState(true); // Start with loading true
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (!id) return;

    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const response = await request<{
          data: { judul: string; isi: string; audiens: string };
        }>(`/pengumuman/${id}`);
        const pengumuman = response.data.data || response.data;
        if (pengumuman && 'judul' in pengumuman) {
          setJudul(pengumuman.judul);
          setIsi(pengumuman.isi);
          setAudiens(pengumuman.audiens);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch announcement');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await request(`/pengumuman/${id}`, {
        method: 'PATCH',
        data: { judul, isi, audiens },
      });
      alert('Pengumuman berhasil diperbarui!');
      router.push('/dashboard/admin/pengumuman');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Gagal memperbarui pengumuman');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm('Are you sure you want to delete this announcement permanently?')
    )
      return;
    try {
      await request(`/pengumuman/${id}`, { method: 'DELETE' });
      alert('Pengumuman berhasil dihapus.');
      router.push('/dashboard/admin/pengumuman');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Gagal menghapus pengumuman');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader className="animate-spin text-maroon-700" size={32} />
        <span className="ml-4 text-lg text-gray-600">
          Loading announcement...
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Edit Pengumuman</h1>
          <p className="text-gray-500 mt-1">
            Mengubah pengumuman dengan ID: {id}
          </p>
        </div>
        <Link
          href="/dashboard/admin/pengumuman"
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali ke Daftar
        </Link>
      </div>

      {error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-8"
      >
        <div className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Judul Pengumuman
            </label>
            <input
              type="text"
              id="title"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              required
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Isi Pengumuman
            </label>
            <textarea
              id="content"
              rows={10}
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              required
            ></textarea>
          </div>

          <div>
            <label
              htmlFor="audience"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Audiens
            </label>
            <select
              id="audience"
              value={audiens}
              onChange={(e) => setAudiens(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
            >
              {audienceOptions.map((opt) => (
                <option key={opt} value={opt} className="capitalize">
                  {opt.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition-colors duration-200 shadow-sm"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Hapus
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 transition-colors duration-200 disabled:bg-gray-400 shadow-sm"
          >
            {isSubmitting ? (
              <Loader className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
