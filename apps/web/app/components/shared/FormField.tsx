// apps/web/app/components/shared/FormField.tsx
import React, { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export default function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1">{children}</div>
      {!!error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
