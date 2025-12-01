'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  roles: { name: string }[];
  dosen?: {
    nip: string;
    prodi?: string | null;
    kuota_bimbingan?: number;
    assignedMahasiswa?: { id: number }[];
  };
  mahasiswa?: { nim: string; prodi: string; kelas: string };
  failed_login_attempts?: number;
  lockout_until?: string | null;
}

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
    confirmPassword: '',
    phone_number: '',
    nim: user?.mahasiswa?.nim || '',
    nip: user?.dosen?.nip || '',
    prodi: user?.mahasiswa?.prodi || user?.dosen?.prodi || 'D4',
    kelas: user?.mahasiswa?.kelas || 'A',
    roles: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (!isEditing && formData.password !== formData.confirmPassword) {
      setError('Kata sandi dan konfirmasi kata sandi tidak cocok');
      setIsSubmitting(false);
      return;
    }

    let endpoint = '';
    let body: Record<string, string | undefined> = {};
    const method = isEditing ? 'PATCH' : 'POST';

    if (
      formData.role === 'admin' ||
      formData.role === 'dosen' ||
      formData.role === 'jurusan' ||
      formData.role === 'prodi_d3' ||
      formData.role === 'prodi_d4'
    ) {
      endpoint = isEditing ? `/users/dosen/${user!.id}` : '/users/dosen';
      body = {
        name: formData.name,
        email: formData.email,
        nip: formData.nip,
        prodi: formData.prodi,
      };
      if (formData.phone_number) {
        body.phone_number = formData.phone_number;
      }
      if (!isEditing) {
        body.password = formData.password;
      }
      if (formData.roles.length > 0) {
        body.roles = JSON.stringify(formData.roles);
      }
    } else {
      endpoint = isEditing
        ? `/users/mahasiswa/${user!.id}`
        : '/users/mahasiswa';
      body = {
        name: formData.name,
        email: formData.email,
        nim: formData.nim,
        prodi: formData.prodi,
        kelas: formData.kelas,
      };
      if (formData.phone_number) {
        body.phone_number = formData.phone_number;
      }
      if (!isEditing) {
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
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        `Gagal ${isEditing ? 'update' : 'membuat'} user.`;
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg transform transition-all animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {user ? 'Edit User' : 'Tambah User Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent disabled:bg-gray-100 transition-all"
            >
              <option value="admin">Admin</option>
              <option value="jurusan">Kajur</option>
              <option value="prodi_d3">Kaprodi D3</option>
              <option value="prodi_d4">Kaprodi D4</option>
              <option value="dosen">Dosen</option>
              <option value="mahasiswa">Mahasiswa</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nama
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
            />
          </div>
          {!isEditing && (
            <>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
          <div>
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              No. HP
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="text"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
            />
          </div>
          {formData.role === 'mahasiswa' && (
            <>
              <div>
                <label
                  htmlFor="nim"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  NIM
                </label>
                <input
                  id="nim"
                  name="nim"
                  type="text"
                  value={formData.nim}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="prodi"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Prodi
                  </label>
                  <select
                    id="prodi"
                    name="prodi"
                    value={formData.prodi}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
                  >
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="kelas"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Kelas
                  </label>
                  <select
                    id="kelas"
                    name="kelas"
                    value={formData.kelas}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
              </div>
            </>
          )}
          {(formData.role === 'admin' ||
            formData.role === 'dosen' ||
            formData.role === 'jurusan' ||
            formData.role === 'prodi_d3' ||
            formData.role === 'prodi_d4') && (
            <>
              <div>
                <label
                  htmlFor="nip"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  NIP
                </label>
                <input
                  id="nip"
                  name="nip"
                  type="text"
                  value={formData.nip}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
                />
              </div>
              {(formData.role === 'prodi_d3' ||
                formData.role === 'prodi_d4') && (
                <div>
                  <label
                    htmlFor="prodi"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Prodi Scope
                  </label>
                  <select
                    id="prodi"
                    name="prodi"
                    value={formData.prodi}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
                  >
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                  </select>
                </div>
              )}
            </>
          )}
          <div className="flex justify-end pt-4 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all duration-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-maroon-700 text-white rounded-xl hover:bg-maroon-800 disabled:bg-gray-400 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function KelolaPenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUserId(userData.id);
    }
  }, []);

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
    if (!confirm(`Apakah Anda yakin ingin membuka kunci akun pengguna ini?`))
      return;
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

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus ${selectedUsers.length} user?`,
      )
    )
      return;
    try {
      await api.post('/users/bulk-delete', { ids: selectedUsers });
      toast.success(`${selectedUsers.length} user berhasil dihapus`);
      setSelectedUsers([]);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map((u) => u.id));
    }
  };

  const filteredUsers = users.filter((user) => {
    const roleMatch =
      roleFilter === 'all' || user.roles.some((r) => r.name === roleFilter);
    const searchMatch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.mahasiswa?.nim && user.mahasiswa.nim.includes(searchQuery)) ||
      (user.dosen?.nip && user.dosen.nip.includes(searchQuery));
    return roleMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  const RoleBadge = ({ roles }: { roles: { name: string }[] }) => {
    // Prioritas role: admin > jurusan > prodi > dosen > mahasiswa
    const roleHierarchy = [
      'admin',
      'jurusan',
      'prodi_d3',
      'prodi_d4',
      'dosen',
      'mahasiswa',
    ];
    const roleName =
      roles.find((r) => roleHierarchy.includes(r.name))?.name ||
      roles[0]?.name ||
      'unknown';
    const highestRole =
      roleHierarchy.find((r) => roles.some((role) => role.name === r)) ||
      roleName;

    const baseClasses =
      'px-3 py-1 text-xs font-semibold rounded-full capitalize';
    let roleClasses = '';
    switch (highestRole) {
      case 'admin':
      case 'jurusan':
        roleClasses = 'bg-purple-100 text-purple-800';
        break;
      case 'prodi_d3':
      case 'prodi_d4':
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
    return (
      <span className={`${baseClasses} ${roleClasses}`}>{highestRole}</span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader
            className="animate-spin text-maroon-700 mx-auto mb-4"
            size={40}
          />
          <span className="text-lg text-gray-600">Memuat data pengguna...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-xl">
        <p className="font-bold text-lg mb-2">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Kelola Pengguna
          </h1>
          <p className="text-gray-600">Manajemen akun dosen dan mahasiswa</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center bg-maroon-700 text-white px-6 py-3 rounded-xl hover:bg-maroon-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Pengguna
        </button>
      </div>

      {selectedUsers.length > 0 && (
        <div className="bg-maroon-50 border border-maroon-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-maroon-800 font-medium">
            {selectedUsers.length} user dipilih
          </span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Terpilih
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nama, email, NIM/NIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all"
            />
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:border-transparent transition-all bg-white"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="jurusan">Kajur</option>
            <option value="prodi_d3">Kaprodi D3</option>
            <option value="prodi_d4">Kaprodi D4</option>
            <option value="dosen">Dosen</option>
            <option value="mahasiswa">Mahasiswa</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === paginatedUsers.length &&
                      paginatedUsers.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-maroon-700 border-gray-300 rounded focus:ring-maroon-700"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  NIM/NIP
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Prodi
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Kapasitas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => {
                const isLocked =
                  user.lockout_until &&
                  new Date(user.lockout_until) > new Date();
                const isCurrentUser = currentUserId === user.id;
                const isAdmin = user.roles.some((r) => r.name === 'admin');
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="w-4 h-4 text-maroon-700 border-gray-300 rounded focus:ring-maroon-700"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {user.mahasiswa?.nim || user.dosen?.nip || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.mahasiswa?.prodi || user.dosen?.prodi || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.dosen ? (
                        <DosenCapacityBadge
                          current={user.dosen.assignedMahasiswa?.length || 0}
                          max={4}
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isLocked ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <Lock className="w-3 h-3 mr-1" /> Terkunci
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <Unlock className="w-3 h-3 mr-1" /> Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge roles={user.roles} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {isLocked && (
                          <button
                            onClick={() => handleUnlock(user.id)}
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-all duration-200"
                            title="Buka Kunci Akun"
                          >
                            <Unlock className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={isCurrentUser}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isCurrentUser
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                          }`}
                          title={
                            isCurrentUser
                              ? 'Tidak dapat menghapus akun sendiri'
                              : 'Hapus'
                          }
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada data pengguna</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex + 1} -{' '}
                {Math.min(startIndex + itemsPerPage, filteredUsers.length)} dari{' '}
                {filteredUsers.length} pengguna
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-maroon-700 text-white shadow-md'
                          : 'border border-gray-300 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
