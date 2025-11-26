// apps/web/app/components/shared/EmptyState.tsx
import React, { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  cta?: ReactNode;
}

export default function EmptyState({ message, cta }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">{message}</p>
      {!!cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
