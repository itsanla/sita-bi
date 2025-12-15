'use client';

import { usePeriode } from '@/context/PeriodeContext';
import { Calendar } from 'lucide-react';

export function PeriodeSelector() {
  const {
    selectedPeriodeId,
    setSelectedPeriodeId,
    periodes,
    activePeriode,
    loading,
  } = usePeriode();

  console.log('PeriodeSelector Debug:', {
    selectedPeriodeId,
    periodes,
    activePeriode,
    loading,
  });

  if (loading) {
    return <div className="h-10 w-48 animate-pulse bg-gray-200 rounded-lg" />;
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
        <Calendar className="w-4 h-4 text-gray-500" />
        <select
          value={selectedPeriodeId ?? ''}
          onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
          className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
        >
          {periodes.map((periode) => (
            <option key={periode.id} value={periode.id}>
              {periode.nama} {periode.id === activePeriode?.id ? '(Aktif)' : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
