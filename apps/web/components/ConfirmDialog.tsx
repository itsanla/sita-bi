'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Ya',
  cancelText = 'Batal',
  onConfirm,
  variant = 'warning'
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-[#7f1d1d] hover:bg-[#991b1b]',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="DialogOverlay" 
          style={{ zIndex: 9998 }}
        />
        <Dialog.Content 
          className="DialogContent" 
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-gray-600 text-sm">
                  {description}
                </Dialog.Description>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg ${variantStyles[variant]}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}