'use client';

import { Calendar, CheckCircle, StopCircle, Play, XCircle } from 'lucide-react';
import { PERIODE_STATUS } from '@/lib/constants/periode';

interface Periode {
  id: number;
  tahun: number;
  nama: string;
  status: string;
  tanggal_buka: string | null;
  tanggal_tutup: string | null;
}

interface PeriodeCardProps {
  periode: Periode;
  processing: boolean;
  onTutup: () => void;
  onBukaSekarang: () => void;
  onBatalkan: () => void;
  onHapus: () => void;
}

const getStatusConfig = (status: string) => {
  if (status === PERIODE_STATUS.AKTIF) {
    return {
      border: 'border-green-500',
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      iconBg: 'bg-green-100',
      statusColor: 'text-green-700',
      pulse: 'animate-pulse',
    };
  }
  if (status === PERIODE_STATUS.SELESAI) {
    return {
      border: 'border-gray-300',
      bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
      icon: <StopCircle className="w-8 h-8 text-gray-500" />,
      iconBg: 'bg-gray-100',
      statusColor: 'text-gray-700',
      pulse: '',
    };
  }
  if (status === PERIODE_STATUS.PERSIAPAN) {
    return {
      border: 'border-amber-400',
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      icon: <Calendar className="w-8 h-8 text-amber-600" />,
      iconBg: 'bg-amber-100',
      statusColor: 'text-amber-700',
      pulse: 'animate-pulse',
    };
  }
  return {
    border: 'border-gray-300',
    bg: 'bg-gray-50',
    icon: <StopCircle className="w-8 h-8 text-gray-400" />,
    iconBg: 'bg-gray-100',
    statusColor: 'text-gray-600',
    pulse: '',
  };
};

export default function PeriodeCard({
  periode,
  processing,
  onTutup,
  onBukaSekarang,
  onBatalkan,
  onHapus,
}: PeriodeCardProps) {
  const config = getStatusConfig(periode.status);

  return (
    <div
      className={`${config.bg} ${config.border} border-2 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div
            className={`${config.iconBg} p-2 rounded-lg ${config.pulse} flex-shrink-0`}
          >
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              {periode.nama}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Status:{' '}
              <span className={`font-bold ${config.statusColor}`}>
                {periode.status}
              </span>
            </p>
            {!!periode.tanggal_buka && (
              <p className="text-xs text-gray-500 mt-0.5">
                📅{' '}
                {new Date(periode.tanggal_buka).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
            {!!periode.tanggal_tutup && (
              <p className="text-xs text-gray-500 mt-0.5">
                🔒{' '}
                {new Date(periode.tanggal_tutup).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {periode.status === PERIODE_STATUS.AKTIF && (
            <button
              onClick={onTutup}
              disabled={processing}
              className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <StopCircle className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          )}
          {periode.status === PERIODE_STATUS.PERSIAPAN && (
            <>
              <button
                onClick={onBukaSekarang}
                disabled={processing}
                className="flex items-center space-x-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>Buka</span>
              </button>
              <button
                onClick={onBatalkan}
                disabled={processing}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" />
                <span>Batal</span>
              </button>
            </>
          )}
          {periode.status === PERIODE_STATUS.SELESAI && (
            <button
              onClick={onHapus}
              disabled={processing}
              className="flex items-center space-x-1.5 px-4 py-2 bg-maroon text-white rounded-lg text-sm font-semibold hover:bg-maroon-800 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
