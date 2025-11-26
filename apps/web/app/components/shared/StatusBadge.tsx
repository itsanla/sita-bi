// apps/web/app/components/shared/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: 'pending' | 'disetujui' | 'ditolak' | 'selesai';
}

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  disetujui: 'bg-green-100 text-green-800',
  ditolak: 'bg-red-100 text-red-800',
  selesai: 'bg-blue-100 text-blue-800',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
