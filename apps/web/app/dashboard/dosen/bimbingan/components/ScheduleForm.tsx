// apps/web/app/dashboard/dosen/bimbingan/components/ScheduleForm.tsx
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const schema = z.object({
  tanggal_bimbingan: z.string().min(1, 'Tanggal harus diisi'),
  jam_bimbingan: z.string().min(1, 'Jam harus diisi'),
});

export default function ScheduleForm({
  tugasAkhirId,
}: {
  tugasAkhirId: number;
}) {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal_bimbingan: '',
      jam_bimbingan: '',
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: { tanggal_bimbingan: string; jam_bimbingan: string }) =>
      api.post(`/bimbingan/${tugasAkhirId}/jadwal`, data),
    onSuccess: () => {
      toast.success('Sesi bimbingan berhasil dijadwalkan.');
      queryClient.invalidateQueries({ queryKey: ['dosenBimbinganList'] });
    },
    onError: () => {
      toast.error('Gagal menjadwalkan sesi bimbingan.');
    },
  });

  const onSubmit = (data: {
    tanggal_bimbingan: string;
    jam_bimbingan: string;
  }) => {
    scheduleMutation.mutate(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 bg-gray-50 rounded-lg border mt-4"
    >
      <h4 className="font-semibold mb-2">Jadwalkan Sesi Baru</h4>
      <div className="flex gap-4">
        <div>
          <label>Tanggal</label>
          <Controller
            name="tanggal_bimbingan"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                {...field}
                className="w-full border p-2 rounded"
              />
            )}
          />
          {errors.tanggal_bimbingan ? (
            <p className="text-red-500 text-sm">
              {errors.tanggal_bimbingan.message}
            </p>
          ) : null}
        </div>
        <div>
          <label>Jam</label>
          <Controller
            name="jam_bimbingan"
            control={control}
            render={({ field }) => (
              <input
                type="time"
                {...field}
                className="w-full border p-2 rounded"
              />
            )}
          />
          {errors.jam_bimbingan ? (
            <p className="text-red-500 text-sm">
              {errors.jam_bimbingan.message}
            </p>
          ) : null}
        </div>
        <div className="self-end">
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded"
            disabled={scheduleMutation.isPending}
          >
            {scheduleMutation.isPending ? 'Menjadwalkan...' : 'Jadwalkan'}
          </button>
        </div>
      </div>
    </form>
  );
}
