// apps/web/components/shared/StatusBadge.tsx
import React from 'react';

const statusStyles = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
};

export default function StatusBadge({ status }: { status: string }) {
  const style =
    statusStyles[status as keyof typeof statusStyles] ||
    statusStyles['COMPLETED'];
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
