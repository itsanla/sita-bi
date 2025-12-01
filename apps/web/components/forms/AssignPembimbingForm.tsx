'use client';

import { useState } from 'react';
import { useDosenCapacity } from '../../hooks/useDosenCapacity';
import DosenCapacityBadge from '../shared/DosenCapacityBadge';
import { validatePembimbingSelection } from '../../lib/rbac-utils';
import { toast } from 'sonner';
import api from '../../lib/api';

interface AssignPembimbingFormProps {
  tugasAkhirId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AssignPembimbingForm({
  tugasAkhirId,
  onSuccess,
  onCancel,
}: AssignPembimbingFormProps) {
  const { capacities, loading, isAvailable, getCapacity } = useDosenCapacity();
  const [pembimbing1Id, setPembimbing1Id] = useState<number | null>(null);
  const [pembimbing2Id, setPembimbing2Id] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePembimbingSelection(
      pembimbing1Id,
      pembimbing2Id,
    );
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    if (pembimbing1Id && !isAvailable(pembimbing1Id)) {
      toast.error('Pembimbing 1 sudah mencapai kapasitas maksimal');
      return;
    }

    if (pembimbing2Id && !isAvailable(pembimbing2Id)) {
      toast.error('Pembimbing 2 sudah mencapai kapasitas maksimal');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/penugasan/${tugasAkhirId}/pembimbing`, {
        pembimbing1Id,
        pembimbing2Id,
      });

      toast.success('Pembimbing berhasil ditugaskan');
      onSuccess?.();
    } catch (error) {
      console.error('[AssignPembimbingForm] Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Pembimbing 1 <span className="text-red-500">*</span>
        </label>
        <select
          value={pembimbing1Id || ''}
          onChange={(e) => setPembimbing1Id(Number(e.target.value) || null)}
          className="w-full rounded-lg border border-gray-300 p-2"
          required
        >
          <option value="">Pilih Pembimbing 1</option>
          {capacities.map((c) => {
            const capacity = getCapacity(c.dosenId);
            const available = isAvailable(c.dosenId);

            return (
              <option key={c.dosenId} value={c.dosenId} disabled={!available}>
                {c.name} - {capacity?.current}/{capacity?.max} mahasiswa
                {!available
                  ? ' (PENUH)'
                  : capacity?.current === 3
                    ? ' (HAMPIR PENUH)'
                    : ''}
              </option>
            );
          })}
        </select>
        {pembimbing1Id ? (
          <div className="mt-2">
            <DosenCapacityBadge
              current={getCapacity(pembimbing1Id)?.current || 0}
              max={4}
            />
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Pembimbing 2
        </label>
        <select
          value={pembimbing2Id || ''}
          onChange={(e) => setPembimbing2Id(Number(e.target.value) || null)}
          className="w-full rounded-lg border border-gray-300 p-2"
        >
          <option value="">Pilih Pembimbing 2 (Opsional)</option>
          {capacities
            .filter((c) => c.dosenId !== pembimbing1Id)
            .map((c) => {
              const capacity = getCapacity(c.dosenId);
              const available = isAvailable(c.dosenId);

              return (
                <option key={c.dosenId} value={c.dosenId} disabled={!available}>
                  {c.name} - {capacity?.current}/{capacity?.max} mahasiswa
                  {!available
                    ? ' (PENUH)'
                    : capacity?.current === 3
                      ? ' (HAMPIR PENUH)'
                      : ''}
                </option>
              );
            })}
        </select>
        {pembimbing2Id ? (
          <div className="mt-2">
            <DosenCapacityBadge
              current={getCapacity(pembimbing2Id)?.current || 0}
              max={4}
            />
          </div>
        ) : null}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !pembimbing1Id}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? 'Menyimpan...' : 'Tugaskan Pembimbing'}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Batal
          </button>
        ) : null}
      </div>
    </form>
  );
}
