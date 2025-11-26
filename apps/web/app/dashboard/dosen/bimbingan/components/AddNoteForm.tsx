// apps/web/app/dashboard/dosen/bimbingan/components/AddNoteForm.tsx
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

const schema = z.object({
  catatan: z.string().min(1, 'Catatan tidak boleh kosong'),
});

export default function AddNoteForm({ sessionId }: { sessionId: number }) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      catatan: '',
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (data: { catatan: string }) =>
      api.post('/bimbingan/catatan', { bimbingan_ta_id: sessionId, ...data }),
    onSuccess: () => {
      toast.success('Catatan berhasil ditambahkan.');
      queryClient.invalidateQueries({ queryKey: ['dosenBimbinganList'] });
      reset();
    },
    onError: () => {
      toast.error('Gagal menambahkan catatan.');
    },
  });

  const onSubmit = (data: { catatan: string }) => {
    addNoteMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 mt-3">
      <Controller
        name="catatan"
        control={control}
        render={({ field }) => (
          <input
            {...field}
            type="text"
            placeholder="Tambah catatan..."
            className="flex-grow p-2 border rounded-md text-sm"
          />
        )}
      />
      <button
        type="submit"
        className="p-2 bg-blue-600 text-white rounded"
        disabled={addNoteMutation.isPending}
      >
        <Send size={16} />
      </button>
    </form>
  );
}
