// apps/web/app/dashboard/dosen/bimbingan/components/SessionCard.tsx
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { BimbinganSession } from '../types';
import StatusBadge from '@/components/shared/StatusBadge';
import AddNoteForm from './AddNoteForm';
import { CheckCircle, XCircle } from 'lucide-react';

interface SessionCardProps {
  session: BimbinganSession;
}

export default function SessionCard({ session }: SessionCardProps) {
  const queryClient = useQueryClient();
  const sessionActionMutation = useMutation({
    mutationFn: (action: 'cancel' | 'selesaikan') =>
      api.post(`/bimbingan/sesi/${session.id}/${action}`),
    onSuccess: () => {
      toast.success('Status sesi berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['dosenBimbinganList'] });
    },
    onError: () => {
      toast.error('Gagal memperbarui status sesi.');
    },
  });

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">
            {new Date(session.tanggal_bimbingan).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">{session.jam_bimbingan}</p>
        </div>
        <StatusBadge status={session.status_bimbingan} />
      </div>
      <div className="mt-4">
        <h5 className="font-semibold">Catatan</h5>
        <div className="space-y-2 mt-2">
          {session.catatan.map((c) => (
            <div key={c.id} className="text-sm bg-white p-2 rounded shadow-sm">
              <strong>{c.author.name}:</strong> {c.catatan}
            </div>
          ))}
          {session.catatan.length === 0 && (
            <p className="text-xs text-gray-500">Belum ada catatan.</p>
          )}
        </div>
        <AddNoteForm sessionId={session.id} />
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => sessionActionMutation.mutate('selesaikan')}
          className="flex items-center gap-1 text-sm bg-green-500 text-white p-2 rounded"
        >
          <CheckCircle size={14} /> Selesaikan
        </button>
        <button
          onClick={() => sessionActionMutation.mutate('cancel')}
          className="flex items-center gap-1 text-sm bg-red-500 text-white p-2 rounded"
        >
          <XCircle size={14} /> Batalkan
        </button>
      </div>
    </div>
  );
}
