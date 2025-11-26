'use client';

import { useState, useEffect } from 'react';
import { DosenCapacityIndicator } from './DosenCapacityIndicator';
import { useDosenCapacity } from '@/hooks/useDosenCapacity';

interface PembimbingSelectorProps {
  value: {
    pembimbing1Id: number | null;
    pembimbing2Id: number | null;
  };
  onChange: (value: { pembimbing1Id: number | null; pembimbing2Id: number | null }) => void;
  mahasiswaProdi?: 'D3' | 'D4';
}

export function PembimbingSelector({ value, onChange }: PembimbingSelectorProps) {
  const { capacities, loading: isLoading } = useDosenCapacity();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value.pembimbing1Id && value.pembimbing2Id && value.pembimbing1Id === value.pembimbing2Id) {
      setError('Pembimbing 1 dan Pembimbing 2 harus berbeda');
    } else {
      setError(null);
    }
  }, [value]);

  if (isLoading) {
    return <div className="text-sm text-gray-500">Memuat data dosen...</div>;
  }

  const filteredDosen = capacities.map(c => ({
    id: c.dosenId,
    name: c.name,
    capacity: c.capacity,
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Pembimbing 1 <span className="text-red-500">*</span>
        </label>
        <select
          value={value.pembimbing1Id || ''}
          onChange={(e) => onChange({ ...value, pembimbing1Id: e.target.value ? parseInt(e.target.value) : null })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Pilih Pembimbing 1</option>
          {filteredDosen.map((dosen) => (
            <option
              key={dosen.id}
              value={dosen.id}
              disabled={dosen.capacity.current >= dosen.capacity.max}
            >
              {dosen.name} - {dosen.capacity.current}/{dosen.capacity.max}
              {dosen.capacity.current >= dosen.capacity.max ? ' (Penuh)' : ''}
            </option>
          ))}
        </select>
        {value.pembimbing1Id ? (
          <div className="mt-2">
            {(() => {
              const selected = filteredDosen.find(d => d.id === value.pembimbing1Id);
              return selected ? (
                <DosenCapacityIndicator
                  current={selected.capacity.current}
                  max={selected.capacity.max}
                />
              ) : null;
            })()}
          </div>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Pembimbing 2</label>
        <select
          value={value.pembimbing2Id || ''}
          onChange={(e) => onChange({ ...value, pembimbing2Id: e.target.value ? parseInt(e.target.value) : null })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Pilih Pembimbing 2 (Opsional)</option>
          {filteredDosen
            .filter(d => d.id !== value.pembimbing1Id)
            .map((dosen) => (
              <option
                key={dosen.id}
                value={dosen.id}
                disabled={dosen.capacity.current >= dosen.capacity.max}
              >
                {dosen.name} - {dosen.capacity.current}/{dosen.capacity.max}
                {dosen.capacity.current >= dosen.capacity.max ? ' (Penuh)' : ''}
              </option>
            ))}
        </select>
        {value.pembimbing2Id ? (
          <div className="mt-2">
            {(() => {
              const selected = filteredDosen.find(d => d.id === value.pembimbing2Id);
              return selected ? (
                <DosenCapacityIndicator
                  current={selected.capacity.current}
                  max={selected.capacity.max}
                />
              ) : null;
            })()}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      ) : null}
    </div>
  );
}
