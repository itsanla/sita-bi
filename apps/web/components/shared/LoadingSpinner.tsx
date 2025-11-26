// apps/web/components/shared/LoadingSpinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );
}
