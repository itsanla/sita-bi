'use client';

interface DosenCapacityBadgeProps {
  current: number;
  max?: number;
}

export default function DosenCapacityBadge({
  current,
  max = 4,
}: DosenCapacityBadgeProps) {
  const percentage = (current / max) * 100;

  let colorClass = 'bg-green-100 text-green-800';
  if (percentage >= 100) {
    colorClass = 'bg-red-100 text-red-800';
  } else if (percentage >= 75) {
    colorClass = 'bg-yellow-100 text-yellow-800';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {current}/{max}
    </span>
  );
}
