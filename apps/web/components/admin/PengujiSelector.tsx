'use client';

import { useState, useEffect } from 'react';
import { useDosenCapacity } from '@/hooks/useDosenCapacity';

interface PengujiSelectorProps {
  value: {
    penguji1Id: number | null;
    penguji2Id: number | null;
    penguji3Id: number | null;
  };
  onChange: (value: {
    penguji1Id: number | null;
    penguji2Id: number | null;
    penguji3Id: number | null;
  }) => void;
}

export function PengujiSelector({ value, onChange }: PengujiSelectorProps) {
  const { capacities, loading: isLoading } = useDosenCapacity();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ids = [value.penguji1Id, value.penguji2Id, value.penguji3Id].filter(
      Boolean,
    );
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      setError('Semua penguji harus berbeda');
    } else {
      setError(null);
    }
  }, [value]);

  if (isLoading) {
    return <div className="text-sm text-gray-500">Memuat data dosen...</div>;
  }

  const filteredDosen = capacities.map((c) => ({
    id: c.dosenId,
    name: c.name,
    nip: c.nip,
  }));

  const selectedIds = [
    value.penguji1Id,
    value.penguji2Id,
    value.penguji3Id,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Penguji 1 <span className="text-red-500">*</span>
        </label>
        <select
          value={value.penguji1Id || ''}
          onChange={(e) =>
            onChange({
              ...value,
              penguji1Id: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Pilih Penguji 1</option>
          {filteredDosen.map((dosen) => (
            <option key={dosen.id} value={dosen.id}>
              {dosen.name} ({dosen.nip})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Penguji 2</label>
        <select
          value={value.penguji2Id || ''}
          onChange={(e) =>
            onChange({
              ...value,
              penguji2Id: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Pilih Penguji 2 (Opsional)</option>
          {filteredDosen
            .filter((d) => !selectedIds.includes(d.id))
            .map((dosen) => (
              <option key={dosen.id} value={dosen.id}>
                {dosen.name} ({dosen.nip})
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Penguji 3</label>
        <select
          value={value.penguji3Id || ''}
          onChange={(e) =>
            onChange({
              ...value,
              penguji3Id: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Pilih Penguji 3 (Opsional)</option>
          {filteredDosen
            .filter((d) => !selectedIds.includes(d.id))
            .map((dosen) => (
              <option key={dosen.id} value={dosen.id}>
                {dosen.name} ({dosen.nip})
              </option>
            ))}
        </select>
      </div>

      {error ? (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      ) : null}

      <div className="text-xs text-gray-500">
        <p>* Minimal 1 penguji harus dipilih</p>
        <p>* Semua penguji harus berbeda</p>
        <p>* Tidak ada batasan kapasitas untuk penguji</p>
      </div>
    </div>
  );
}
