// apps/web/app/components/shared/LoadingSpinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}
