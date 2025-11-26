import React from 'react';
import { BimbinganSession } from '../types';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  useSelesaikanBimbingan,
  useCancelBimbingan,
} from '@/hooks/useBimbingan';

interface SessionCardProps {
  session: BimbinganSession;
}

export default function SessionCard({ session }: SessionCardProps) {
  const selesaikanMutation = useSelesaikanBimbingan();
  const cancelMutation = useCancelBimbingan();

  const handleSelesaikan = () => {
    if (confirm('Tandai sesi ini sebagai selesai?')) {
      selesaikanMutation.mutate(session.id);
    }
  };

  const handleCancel = () => {
    if (confirm('Batalkan sesi bimbingan ini?')) {
      cancelMutation.mutate(session.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'bg-green-100 text-green-800';
      case 'dibatalkan':
        return 'bg-red-100 text-red-800';
      case 'dijadwalkan':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>
              {session.tanggal_bimbingan
                ? new Date(session.tanggal_bimbingan).toLocaleDateString(
                    'id-ID',
                  )
                : 'Belum ditentukan'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>{session.jam_bimbingan || '-'}</span>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status_bimbingan)}`}
        >
          {session.status_bimbingan}
        </span>
      </div>

      {session.catatan && session.catatan.length > 0 && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Catatan:</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {session.catatan.map((note) => (
              <div key={note.id} className="text-sm bg-gray-50 p-2 rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-800">
                    {note.author.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {note.catatan}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {session.status_bimbingan === 'dijadwalkan' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSelesaikan}
            disabled={selesaikanMutation.isPending}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle size={14} />
            Selesaikan
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle size={14} />
            Batalkan
          </button>
        </div>
      )}
    </div>
  );
}
