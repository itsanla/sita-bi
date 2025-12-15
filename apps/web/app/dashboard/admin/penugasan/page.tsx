'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import request from '@/lib/api';
import { Search, UserPlus, Loader, Info, X, AlertCircle } from 'lucide-react';
import { useDosenCapacity } from '@/hooks/useDosenCapacity';
import DosenCapacityBadge from '@/components/shared/DosenCapacityBadge';
import {
  validatePembimbingSelection,
  validatePengujiSelection,
} from '@/lib/rbac-utils';
import { toast } from 'sonner';

// --- Interfaces ---
interface TugasAkhir {
  id: number;
  judul: string;
  mahasiswa: {
    nim: string;
    prodi: string;
    user: { name: string };
  };
}

// Removed unused Dosen interface

interface DosenLoad {
  id: number;
  name: string;
  email: string;
  totalLoad: number;
  bimbinganLoad: number;
  pengujiLoad: number;
}

// --- Main Page Component ---
function PenugasanPageContent() {
  const [unassignedTAs, setUnassignedTAs] = useState<TugasAkhir[]>([]);
  const [dosenLoad, setDosenLoad] = useState<DosenLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAvailable, getCapacity } = useDosenCapacity();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<'pembimbing' | 'penguji'>(
    'pembimbing',
  );
  const [selectedTA, setSelectedTA] = useState<TugasAkhir | null>(null);
  const [dosen1Id, setDosen1Id] = useState<string>('');
  const [dosen2Id, setDosen2Id] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [taRes, dosenRes] = await Promise.all([
        request<{ data: { data: TugasAkhir[] } }>('/penugasan/unassigned'),
        request<{ data: DosenLoad[] }>('/penugasan/dosen-load'),
      ]);

      // Handle TA response
      if (taRes.data?.data?.data && Array.isArray(taRes.data.data.data)) {
        setUnassignedTAs(taRes.data.data.data);
      } else if (taRes.data?.data && Array.isArray(taRes.data.data)) {
        setUnassignedTAs(taRes.data.data);
      } else {
        setUnassignedTAs([]);
      }

      // Handle dosen response
      if (dosenRes.data?.data && Array.isArray(dosenRes.data.data)) {
        setDosenLoad(dosenRes.data.data);
      } else if (Array.isArray(dosenRes.data)) {
        setDosenLoad(dosenRes.data);
      } else {
        setDosenLoad([]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch data');
      }
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (ta: TugasAkhir, type: 'pembimbing' | 'penguji') => {
    setSelectedTA(ta);
    setAssignType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTA(null);
    setDosen1Id('');
    setDosen2Id('');
  };

  const handleAssignSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTA || !dosen1Id) {
      toast.error(
        `Pilih minimal ${assignType === 'pembimbing' ? 'Pembimbing' : 'Penguji'} 1`,
      );
      return;
    }

    const d1 = Number(dosen1Id);
    const d2 = dosen2Id ? Number(dosen2Id) : null;

    if (assignType === 'pembimbing') {
      const validation = validatePembimbingSelection(d1, d2);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Check kuota 4 mahasiswa per dosen
      const dosen1 = dosenLoad.find((d) => d.id === d1);
      if (dosen1 && dosen1.bimbinganLoad >= 4) {
        toast.error('Pembimbing 1 sudah membimbing 4 mahasiswa (kuota penuh)');
        return;
      }

      if (d2) {
        const dosen2 = dosenLoad.find((d) => d.id === d2);
        if (dosen2 && dosen2.bimbinganLoad >= 4) {
          toast.error(
            'Pembimbing 2 sudah membimbing 4 mahasiswa (kuota penuh)',
          );
          return;
        }
      }
    } else {
      const validation = validatePengujiSelection(d1, d2, null);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const endpoint =
        assignType === 'pembimbing' ? 'assign' : 'assign-penguji';
      const body: Record<string, number | undefined> = {};
      if (assignType === 'pembimbing') {
        body.pembimbing1Id = d1;
        body.pembimbing2Id = d2 || undefined;
      } else {
        body.penguji1Id = d1;
        body.penguji2Id = d2 || undefined;
      }

      await request(`/penugasan/${selectedTA.id}/${endpoint}`, {
        method: 'POST',
        data: body,
      });

      const dosenNames = [];
      if (d1) {
        const dosen1Name = dosenLoad.find((d) => d.id === d1)?.name;
        if (dosen1Name) dosenNames.push(dosen1Name);
      }
      if (d2) {
        const dosen2Name = dosenLoad.find((d) => d.id === d2)?.name;
        if (dosen2Name) dosenNames.push(dosen2Name);
      }

      toast.success(
        `${assignType === 'pembimbing' ? 'Pembimbing' : 'Penguji'} berhasil ditugaskan: ${dosenNames.join(' & ')}`,
      );
      handleCloseModal();
      await fetchData();
    } catch (err: unknown) {
      console.error('[PenugasanPage] Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed unused getLoadBadgeColor

  const renderDosenOption = (d: DosenLoad) => {
    const isFull = assignType === 'pembimbing' && d.bimbinganLoad >= 4;
    return (
      <option key={d.id} value={d.id} disabled={isFull}>
        {d.name} - Bimbingan: {d.bimbinganLoad}/4 | Penguji: {d.pengujiLoad}
        {isFull ? ' (PENUH)' : ''}
      </option>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader className="animate-spin text-maroon-700" size={32} />
        <span className="ml-4 text-lg text-gray-600">Loading data...</span>
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
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Penugasan Dosen</h1>
      </div>

      <div className="mb-6 flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Cari mahasiswa atau judul TA..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mahasiswa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Judul Tugas Akhir
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {unassignedTAs.length > 0 ? (
              unassignedTAs.map((ta) => (
                <tr key={ta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {ta.mahasiswa.user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      NIM: {ta.mahasiswa.nim || '-'} | Prodi:{' '}
                      {ta.mahasiswa.prodi || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{ta.judul}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(ta, 'pembimbing')}
                      className="inline-flex items-center text-red-800 hover:text-red-900 font-semibold mr-4"
                    >
                      <UserPlus className="w-5 h-5 mr-1" />
                      Assign Pembimbing
                    </button>
                    <button
                      onClick={() => handleOpenModal(ta, 'penguji')}
                      className="inline-flex items-center text-blue-800 hover:text-blue-900 font-semibold"
                    >
                      <UserPlus className="w-5 h-5 mr-1" />
                      Assign Penguji
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center py-10 text-gray-500">
                  <Info size={32} className="mx-auto mb-2" />
                  Tidak ada Tugas Akhir yang perlu penugasan saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {isModalOpen && selectedTA ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {assignType === 'pembimbing'
                  ? 'Tugaskan Pembimbing'
                  : 'Tugaskan Penguji'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Mahasiswa:{' '}
              <span className="font-semibold">
                {selectedTA.mahasiswa.user.name}
              </span>
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Judul: <span className="font-semibold">{selectedTA.judul}</span>
            </p>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4 text-xs text-yellow-800 flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Aturan Penugasan:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Setiap dosen maksimal membimbing{' '}
                    <strong>4 mahasiswa</strong>
                  </li>
                  <li>
                    Setiap mahasiswa memiliki <strong>2 pembimbing</strong>
                  </li>
                  <li>Format: Nama Dosen - Bimbingan: X/4 | Penguji: Y</li>
                  <li>
                    Dosen dengan status <strong>(PENUH)</strong> tidak dapat
                    dipilih
                  </li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="dosen1"
                  className="block text-sm font-medium text-gray-700"
                >
                  {assignType === 'pembimbing' ? 'Pembimbing 1' : 'Penguji 1'}
                </label>
                <select
                  id="dosen1"
                  value={dosen1Id}
                  onChange={(e) => setDosen1Id(e.target.value)}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-800 focus:border-red-800 sm:text-sm rounded-md"
                >
                  <option value="" disabled>
                    -- Pilih Dosen --
                  </option>
                  {dosenLoad.map(renderDosenOption)}
                </select>
                {dosen1Id ? (
                  <div className="mt-2">
                    <DosenCapacityBadge
                      current={
                        dosenLoad.find((d) => d.id === Number(dosen1Id))
                          ?.bimbinganLoad || 0
                      }
                      max={4}
                    />
                  </div>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="dosen2"
                  className="block text-sm font-medium text-gray-700"
                >
                  {assignType === 'pembimbing'
                    ? 'Pembimbing 2 (Opsional)'
                    : 'Penguji 2 (Opsional)'}
                </label>
                <select
                  id="dosen2"
                  value={dosen2Id}
                  onChange={(e) => setDosen2Id(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-800 focus:border-red-800 sm:text-sm rounded-md"
                >
                  <option value="">-- Tidak Ada --</option>
                  {dosenLoad
                    .filter((d) => d.id !== Number(dosen1Id))
                    .map(renderDosenOption)}
                </select>
                {dosen2Id ? (
                  <div className="mt-2">
                    <DosenCapacityBadge
                      current={
                        dosenLoad.find((d) => d.id === Number(dosen2Id))
                          ?.bimbinganLoad || 0
                      }
                      max={4}
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-800 text-white px-4 py-2 rounded-md hover:bg-red-900 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Penugasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PenugasanPage() {
  return <PenugasanPageContent />;
}
