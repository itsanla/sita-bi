// apps/web/app/dashboard/dosen/bimbingan/components/BimbinganCard.tsx
import React from 'react';
import { TugasAkhir } from '../types';
import ScheduleForm from './ScheduleForm';
import SessionList from './SessionList';
import StatusBadge from '@/components/shared/StatusBadge';

interface BimbinganCardProps {
  tugasAkhir: TugasAkhir;
}

export default function BimbinganCard({ tugasAkhir }: BimbinganCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{tugasAkhir.mahasiswa.user.name}</h2>
        <p className="text-gray-600">{tugasAkhir.judul}</p>
        <div className="mt-2">
          <StatusBadge status={tugasAkhir.status} />
        </div>
      </div>
      <ScheduleForm tugasAkhirId={tugasAkhir.id} />
      <SessionList sessions={tugasAkhir.bimbinganTa} />
    </div>
  );
}
