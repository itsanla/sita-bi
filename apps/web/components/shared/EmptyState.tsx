// apps/web/components/shared/EmptyState.tsx
import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center p-8 border rounded-lg bg-gray-50">
      <Inbox className="mx-auto text-gray-400" size={40} />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}
