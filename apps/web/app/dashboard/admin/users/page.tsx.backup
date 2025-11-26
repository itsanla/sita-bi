'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import DosenCapacityBadge from '@/components/shared/DosenCapacityBadge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader,
  X,
  Lock,
  Unlock,
} from 'lucide-react';

// --- Interfaces (Updated) ---
interface User {
  id: number;
  name: string;
  email: string;
  roles: { name: string }[];
  dosen?: { nidn: string; prodi?: string | null; kuota_bimbingan?: number; assignedMahasiswa?: { id: number }[] };
  mahasiswa?: { nim: string; prodi: string; kelas: string };
  failed_login_attempts?: number;
  lockout_until?: string | null;
}

// --- Modal Component ---
const UserModal = ({
  user,
  onClose,
  onSave,
}: {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}) => {
  const [formData, setFormData] = useState({
    role: user?.roles[0]?.name || 'mahasiswa',
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    phone_number: '',
    nim: user?.mahasiswa?.nim || '',
    nidn: user?.dosen?.nidn || '',
    prodi: user?.mahasiswa?.prodi || user?.dosen?.prodi || 'D4',
    kelas: user?.mahasiswa?.kelas || 'A',
    roles: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isEditing = user !== null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    let endpoint = '';
    let body: Record<string, string | undefined> = {};
    const method = isEditing ? 'PATCH' : 'POST';

    if (formData.role === 'dosen' || formData.role === 'kajur' || formData.role === 'kaprodi_d3' || formData.role === 'kaprodi_d4') {
      endpoint = isEditing ? `/users/dosen/${user!.id}` : '/users/dosen';
      body = {
        name: formData.name,
        email: formData.email,
        nidn: formData.nidn,
        phone_number: formData.phone_number,
        prodi: formData.prodi,
      };
      if (formData.password || !isEditing) {
        body.password = formData.password;
      }
      if (formData.roles.length > 0) {
        body.roles = JSON.stringify(formData.roles);
      }
    } else {
      endpoint = isEditing ? `/users/mahasiswa/${user!.id}` : '/users/mahasiswa';
      body = {
        name: formData.name,
        email: formData.email,
        nim: formData.nim,
        phone_number: formData.phone_number,
        prodi: formData.prodi,
        kelas: formData.kelas,
      };
      if (formData.password || !isEditing) {
        body.password = formData.password;
      }
    }

    try {
      if (method === 'POST') {
        await api.post(endpoint, body);
      } else {
        await api.patch(endpoint, body);
      }
      toast.success(`User berhasil ${isEditing ? 'diupdate' : 'dibuat'}!`);
      onSave();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || `Gagal ${isEditing ? 'update' : 'membuat'} user.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="bg-red-100 text-red-700 p-3 rounded-md">
              {error}
            </div>
          ) : null}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isEditing}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
            >
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
              <option value="kajur">Kajur</option>
              <option value="kaprodi_d3">Kaprodi D3</option>
              <option value="kaprodi_d4">Kaprodi D4</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isEditing ? 'Leave blank to keep unchanged' : ''}
              required={!isEditing}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
              No. HP
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="text"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="08xxxxxxxxxx"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          {formData.role === 'mahasiswa' && (
            <>
              <div>
                <label htmlFor="nim" className="block text-sm font-medium text-gray-700">
                  NIM
                </label>
                <input
                  id="nim"
                  name="nim"
                  type="text"
                  value={formData.nim}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="prodi" className="block text-sm font-medium text-gray-700">
                  Prodi
                </label>
                <select
                  id="prodi"
                  name="prodi"
                  value={formData.prodi}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                >
                  <option value="D3">D3</option>
                  <option value="D4">D4</option>
                </select>
              </div>
              <div>
                <label htmlFor="kelas" className="block text-sm font-medium text-gray-700">
                  Kelas
                </label>
                <input
                  id="kelas"
                  name="kelas"
                  type="text"
                  value={formData.kelas}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </>
          )}
          {(formData.role === 'dosen' || formData.role === 'kajur' || formData.role === 'kaprodi_d3' || formData.role === 'kaprodi_d4') && (
            <>
              <div>
                <label htmlFor="nidn" className="block text-sm font-medium text-gray-700">
                  NIDN
                </label>
                <input
                  id="nidn"
                  name="nidn"
                  type="text"
                  value={formData.nidn}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              {(formData.role === 'kaprodi_d3' || formData.role === 'kaprodi_d4') && (
                <div>
                  <label htmlFor="prodi" className="block text-sm font-medium text-gray-700">
                    Prodi Scope
                  </label>
                  <select
                    id="prodi"
                    name="prodi"
                    value={formData.prodi}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                  </select>
                </div>
              )}
            </>
          )}
          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-800 text-white px-4 py-2 rounded-md hover:bg-red-900 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function KelolaPenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dosenRes, mahasiswaRes] = await Promise.all([
        api.get('/users/dosen'),
        api.get('/users/mahasiswa'),
      ]);

      const mappedDosen = Array.isArray(dosenRes.data?.data?.data)
        ? dosenRes.data.data.data
        : [];
      const mappedMahasiswa = Array.isArray(mahasiswaRes.data?.data?.data)
        ? mahasiswaRes.data.data.data
        : [];

      const allUsers = [...mappedDosen, ...mappedMahasiswa];
      setUsers(allUsers);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Gagal memuat data pengguna');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user ini?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User berhasil dihapus');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };

  const handleUnlock = async (id: number) => {
    if (!confirm(`Apakah Anda yakin ingin membuka kunci akun pengguna ini?`)) return;
    try {
      await api.post(`/users/${id}/unlock`);
      toast.success('Akun berhasil dibuka');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };

  const handleOpenModal = (user: User | null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = () => {
    handleCloseModal();
    fetchData();
  };

  const filteredUsers = users.filter((user) => {
    const roleMatch =
      roleFilter === 'all' || user.roles.some((r) => r.name === roleFilter);
    const searchMatch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.mahasiswa?.nim && user.mahasiswa.nim.includes(searchQuery)) ||
      (user.dosen?.nidn && user.dosen.nidn.includes(searchQuery));
    return roleMatch && searchMatch;
  });

  const RoleBadge = ({ roles }: { roles: { name: string }[] }) => {
    const roleName = roles[0]?.name || 'unknown';
    const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full capitalize';
    let roleClasses = '';
    switch (roleName) {
      case 'admin':
      case 'kajur':
        roleClasses = 'bg-purple-100 text-purple-800';
        break;
      case 'kaprodi_d3':
      case 'kaprodi_d4':
        roleClasses = 'bg-indigo-100 text-indigo-800';
        break;
      case 'dosen':
        roleClasses = 'bg-blue-100 text-blue-800';
        break;
      case 'mahasiswa':
        roleClasses = 'bg-green-100 text-green-800';
        break;
      default:
        roleClasses = 'bg-gray-100 text-gray-800';
    }
    return <span className={`${baseClasses} ${roleClasses}`}>{roleName}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader className="animate-spin text-maroon-700" size={32} />
        <span className="ml-4 text-lg text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'kajur']}>
      <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Kelola Pengguna</h1>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-colors duration-200 shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Pengguna
        </button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Cari nama, email, NIM/NIDN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="kajur">Kajur</option>
            <option value="kaprodi_d3">Kaprodi D3</option>
            <option value="kaprodi_d4">Kaprodi D4</option>
            <option value="dosen">Dosen</option>
            <option value="mahasiswa">Mahasiswa</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NIM/NIDN
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prodi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kapasitas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => {
              const isLocked =
                user.lockout_until && new Date(user.lockout_until) > new Date();
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.mahasiswa?.nim || user.dosen?.nidn || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.mahasiswa?.prodi || user.dosen?.prodi || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.dosen ? (
                      <DosenCapacityBadge 
                        current={user.dosen.assignedMahasiswa?.length || 0} 
                        max={4} 
                      />
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isLocked ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Lock className="w-3 h-3 mr-1" /> Terkunci
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Unlock className="w-3 h-3 mr-1" /> Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge roles={user.roles} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isLocked ? (
                      <button
                        onClick={() => handleUnlock(user.id)}
                        className="text-orange-600 hover:text-orange-900 mr-4"
                        title="Buka Kunci Akun"
                      >
                        <Unlock className="w-5 h-5" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <UserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      ) : null}
      </div>
    </ProtectedRoute>
  );
}
