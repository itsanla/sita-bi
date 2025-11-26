'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Loader,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useDebounce } from 'use-debounce';

const schema = z.object({
  sidang_id: z.coerce.number().min(1, 'Sidang harus dipilih'),
  tanggal: z.string().min(1, 'Tanggal harus diisi'),
  waktu_mulai: z.string().min(1, 'Waktu mulai harus diisi'),
  waktu_selesai: z.string().min(1, 'Waktu selesai harus diisi'),
  ruangan_id: z.coerce.number().min(1, 'Ruangan harus dipilih'),
});

type FormData = z.infer<typeof schema>;

export default function KelolaSidangPage() {
  const queryClient = useQueryClient();
  const [conflictResult, setConflictResult] = useState<any>(null);
  const [pengujiIds, setPengujiIds] = useState<number[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sidang_id: 0,
      tanggal: '',
      waktu_mulai: '',
      waktu_selesai: '',
      ruangan_id: 0,
    },
  });

  const watchedFields = watch();
  const [debouncedFields] = useDebounce(watchedFields, 500);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['jadwal-sidang'],
    queryFn: () => api.get('/jadwal-sidang').then((res) => res.data.data),
  });

  const { data: unscheduled } = useQuery({
    queryKey: ['sidang-unscheduled'],
    queryFn: () => api.get('/sidang/unscheduled').then((res) => res.data.data),
  });

  const { data: rooms } = useQuery({
    queryKey: ['ruangan'],
    queryFn: () => api.get('/ruangan').then((res) => res.data.data),
  });

  const { data: dosens } = useQuery({
    queryKey: ['dosens'],
    queryFn: () =>
      api.get('/users/dosen').then((res) => res.data.data?.data || []),
  });

  const conflictCheckMutation = useMutation({
    mutationFn: (data: any) =>
      api
        .post('/jadwal-sidang/check-conflict', data)
        .then((res) => res.data.data),
    onSuccess: (data) => setConflictResult(data),
  });

  useEffect(() => {
    const { tanggal, waktu_mulai, waktu_selesai, ruangan_id } = debouncedFields;
    if (tanggal && waktu_mulai && waktu_selesai && ruangan_id > 0) {
      conflictCheckMutation.mutate({
        tanggal,
        waktu_mulai,
        waktu_selesai,
        ruangan_id,
      });
    }
  }, [debouncedFields]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/jadwal-sidang', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal-sidang'] });
      queryClient.invalidateQueries({ queryKey: ['sidang-unscheduled'] });
      reset();
      setPengujiIds([]);
      setConflictResult(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/jadwal-sidang/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['jadwal-sidang'] }),
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({ ...data, pengujiIds });
  };

  const togglePenguji = (id: number) => {
    setPengujiIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Kelola Jadwal Sidang
        </h1>
        <p className="text-gray-600 mt-1">
          Buat dan kelola jadwal sidang dengan pengecekan konflik otomatis
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-xl shadow-md border space-y-6"
      >
        <h2 className="text-xl font-semibold text-gray-800">
          Buat Jadwal Baru
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Sidang
            </label>
            <Controller
              name="sidang_id"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                >
                  <option value={0}>-- Pilih Mahasiswa & Judul --</option>
                  {unscheduled?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.tugasAkhir.mahasiswa.user.name} - {s.tugasAkhir.judul}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.sidang_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.sidang_id.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <Controller
              name="tanggal"
              control={control}
              render={({ field }) => (
                <input
                  type="date"
                  {...field}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                />
              )}
            />
            {errors.tanggal && (
              <p className="text-red-500 text-sm mt-1">
                {errors.tanggal.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ruangan
            </label>
            <Controller
              name="ruangan_id"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                >
                  <option value={0}>-- Pilih Ruangan --</option>
                  {rooms?.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.nama_ruangan}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.ruangan_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.ruangan_id.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waktu Mulai
            </label>
            <Controller
              name="waktu_mulai"
              control={control}
              render={({ field }) => (
                <input
                  type="time"
                  {...field}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                />
              )}
            />
            {errors.waktu_mulai && (
              <p className="text-red-500 text-sm mt-1">
                {errors.waktu_mulai.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waktu Selesai
            </label>
            <Controller
              name="waktu_selesai"
              control={control}
              render={({ field }) => (
                <input
                  type="time"
                  {...field}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                />
              )}
            />
            {errors.waktu_selesai && (
              <p className="text-red-500 text-sm mt-1">
                {errors.waktu_selesai.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Penguji
          </label>
          <div className="h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 grid grid-cols-2 gap-2">
            {dosens?.length > 0 ? (
              dosens.map((d: any) => (
                <label
                  key={d.id}
                  className="flex items-center space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={pengujiIds.includes(d.id)}
                    onChange={() => togglePenguji(d.id)}
                  />
                  <span>{d.user?.name || d.nama || 'Dosen'}</span>
                </label>
              ))
            ) : (
              <p className="text-gray-500 text-sm col-span-2">
                Tidak ada data dosen
              </p>
            )}
          </div>
        </div>

        {conflictCheckMutation.isPending && (
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Memeriksa konflik...</span>
          </div>
        )}
        {conflictResult && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${conflictResult.hasConflict ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
          >
            {conflictResult.hasConflict ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {conflictResult.message}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={createMutation.isPending || conflictResult?.hasConflict}
          className="w-full flex items-center justify-center bg-red-900 text-white px-4 py-3 rounded-lg hover:bg-red-800 disabled:bg-gray-400 transition-colors font-semibold"
        >
          {createMutation.isPending ? (
            <Loader className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Plus className="w-5 h-5 mr-2" />
          )}
          {createMutation.isPending ? 'Menyimpan...' : 'Tambah Jadwal'}
        </button>
      </form>

      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Jadwal Terpublikasi
        </h2>
        {isLoading ? (
          <div className="text-center p-8">
            <Loader className="animate-spin mx-auto text-red-900" />
          </div>
        ) : schedules?.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule: any) => (
              <div
                key={schedule.id}
                className="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-start"
              >
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    {schedule.sidang.tugasAkhir.mahasiswa.user.name}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {schedule.sidang.tugasAkhir.judul}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(schedule.tanggal).toLocaleDateString('id-ID')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {schedule.waktu_mulai} - {schedule.waktu_selesai}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {schedule.ruangan.nama_ruangan}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(schedule.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 bg-white p-12 rounded-xl shadow-sm">
            Belum ada jadwal
          </div>
        )}
      </div>
    </div>
  );
}
