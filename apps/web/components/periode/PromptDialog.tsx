'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  title: string;
  description: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (_value: string) => void;
}

export default function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder = '',
  confirmText = 'Simpan',
  cancelText = 'Batal',
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    onConfirm(value);
    setValue('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setValue('');
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" style={{ zIndex: 9998 }} />
        <Dialog.Content className="DialogContent" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-md">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-blue-600" />
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

            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-maroon/10 focus:border-maroon transition-all duration-300 hover:border-gray-400 min-h-[100px] resize-none"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 bg-maroon text-white rounded-xl font-semibold hover:bg-maroon-800 transition-all shadow-md hover:shadow-lg"
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
