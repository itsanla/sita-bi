'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface ProfileUpdateData extends Record<string, unknown> {
  name: string;
  mahasiswa?: {
    nim: string;
  };
  dosen?: {
    nidn: string;
  };
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();

  // State for form fields
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [nidn, setNidn] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.nama);
      if (user.nim) {
        setNim(user.nim);
      }
      if (user.nidn) {
        setNidn(user.nidn);
      }
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const profileData: ProfileUpdateData = { name };
    if (user?.nim) {
      profileData.mahasiswa = { nim };
    }
    if (user?.nidn) {
      profileData.dosen = { nidn };
    }

    try {
      await api('/profile', { method: 'PATCH', data: profileData });
      setSuccess(
        'Profil berhasil diperbarui. Data akan ter-refresh pada login berikutnya.',
      );
      setIsEditing(false);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!user) return <div>Gagal memuat profil pengguna.</div>;

  const isMahasiswa = user.roles?.some((r) => r.name === 'mahasiswa');
  const isDosen = user.roles?.some((r) => r.name === 'dosen');

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profil Pengguna</h1>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {!!error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        {!!success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nama
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              ) : (
                <p className="mt-1 text-lg">{user.nama}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-lg text-gray-500">{user.email}</p>
            </div>
            {!!isMahasiswa && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    NIM
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  ) : (
                    <p className="mt-1 text-lg">{user.nim}</p>
                  )}
                </div>
              </>
            )}
            {!!isDosen && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  NIDN
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={nidn}
                    onChange={(e) => setNidn(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                ) : (
                  <p className="mt-1 text-lg">{user.nidn}</p>
                )}
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-4">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg disabled:bg-blue-300"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 py-2 px-4 rounded-lg"
                >
                  Batal
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg"
              >
                Edit Profil
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
