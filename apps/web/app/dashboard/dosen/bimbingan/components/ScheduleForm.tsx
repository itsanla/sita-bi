'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useScheduleBimbingan } from '@/hooks/useBimbingan';

const schema = z.object({
  tanggal_bimbingan: z.string().min(1, 'Tanggal harus diisi'),
  jam_bimbingan: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Format jam tidak valid (HH:mm)',
    ),
});

export default function ScheduleForm({
  tugasAkhirId,
}: {
  tugasAkhirId: number;
}) {
  const scheduleMutation = useScheduleBimbingan();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal_bimbingan: '',
      jam_bimbingan: '',
    },
  });

  const onSubmit = (data: {
    tanggal_bimbingan: string;
    jam_bimbingan: string;
  }) => {
    scheduleMutation.mutate(
      { tugasAkhirId, ...data },
      {
        onSuccess: () => {
          reset();
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 bg-gray-50 rounded-lg border mt-4"
    >
      <h4 className="font-semibold mb-2">Jadwalkan Sesi Baru</h4>
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal
          </label>
          <Controller
            name="tanggal_bimbingan"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                {...field}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          />
          {errors.tanggal_bimbingan && (
            <p className="text-red-500 text-xs mt-1">
              {errors.tanggal_bimbingan.message}
            </p>
          )}
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jam
          </label>
          <Controller
            name="jam_bimbingan"
            control={control}
            render={({ field }) => (
              <input
                type="time"
                {...field}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          />
          {errors.jam_bimbingan && (
            <p className="text-red-500 text-xs mt-1">
              {errors.jam_bimbingan.message}
            </p>
          )}
        </div>
        <div className="self-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={scheduleMutation.isPending}
          >
            {scheduleMutation.isPending ? 'Menjadwalkan...' : 'Jadwalkan'}
          </button>
        </div>
      </div>
    </form>
  );
}
