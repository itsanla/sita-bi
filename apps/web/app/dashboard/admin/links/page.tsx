'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import request from '@/lib/api';
import {
  Plus,
  Edit,
  Trash2,
  Link as LinkIcon,
  Loader,
  Info,
  X,
} from 'lucide-react';

// --- Interfaces ---
interface Link {
  id: number;
  title: string;
  url: string;
}

// --- Modal Component ---
const LinkModal = ({
  link,
  onClose,
  onSave,
}: {
  link: Partial<Link> | null;
  onClose: () => void;
  onSave: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: link?.title || '',
    url: link?.url || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const isEditing = link && link.id;
    const endpoint = isEditing ? `/links/${link.id}` : '/links';
    const method = isEditing ? 'PATCH' : 'POST';

    try {
      await request(endpoint, {
        method,
        data: formData,
      });
      alert(`Link successfully ${isEditing ? 'updated' : 'created'}!`);
      onSave();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {link?.id ? 'Edit Tautan' : 'Tambah Tautan Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700"
            >
              URL
            </label>
            <input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              required
              placeholder="https://example.com"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-800 text-white px-4 py-2 rounded-md hover:bg-red-900 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function KelolaTautanPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await request<{ data: { data: Link[] } }>('/links');
      if (response.data?.data && Array.isArray(response.data.data)) {
        setLinks(response.data.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch links');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    try {
      await request(`/links/${id}`, { method: 'DELETE' });
      alert('Link deleted successfully');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleOpenModal = (link: Link | null = null) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
  };

  const handleSave = () => {
    handleCloseModal();
    fetchData();
  };

  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Kelola Tautan</h1>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-colors duration-200 shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Tautan
        </button>
      </div>

      {loading ? (
        <div className="text-center p-8">
          <Loader className="animate-spin mx-auto text-red-800" />
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {links.length > 0 ? (
              links.map((link) => (
                <li
                  key={link.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <LinkIcon className="w-5 h-5 mr-4 text-gray-400" />
                    <div>
                      <p className="text-md font-semibold text-gray-800">
                        {link.title}
                      </p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleOpenModal(link)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-center text-gray-500 p-12">
                <Info size={40} className="mx-auto mb-4 text-gray-400" />
                Tidak ada tautan yang ditemukan.
              </li>
            )}
          </ul>
        </div>
      )}

      {isModalOpen ? (
        <LinkModal
          link={editingLink}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
