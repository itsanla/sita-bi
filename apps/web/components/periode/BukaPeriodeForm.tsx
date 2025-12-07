'use client';

import { useState } from 'react';
import { Sparkles, Play, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { PERIODE_MESSAGES } from '@/lib/constants/periode';

interface BukaPeriodeFormProps {
  onSubmit: (_tahun: number, _tanggalBukaISO?: string) => Promise<void>;
  processing: boolean;
}

export default function BukaPeriodeForm({
  onSubmit,
  processing,
}: BukaPeriodeFormProps) {
  const [tahunBaru, setTahunBaru] = useState(new Date().getFullYear() + 1);
  const [tanggalBuka, setTanggalBuka] = useState('');
  const [jamBuka, setJamBuka] = useState('08:00');

  const handleBukaPeriode = async (langsung: boolean) => {
    if (!tahunBaru || tahunBaru < 2000 || tahunBaru > 2100) {
      toast.error(PERIODE_MESSAGES.ERROR_INVALID_YEAR);
      return;
    }

    let tanggalBukaISO: string | undefined;
    if (!langsung && tanggalBuka) {
      const datetime = `${tanggalBuka}T${jamBuka || '08:00'}:00`;
      const tanggalBukaDate = new Date(datetime);
      if (tanggalBukaDate < new Date()) {
        toast.error(PERIODE_MESSAGES.ERROR_PAST_DATE);
        return;
      }
      tanggalBukaISO = datetime;
    }

    await onSubmit(tahunBaru, tanggalBukaISO);
    setTanggalBuka('');
    setJamBuka('08:00');
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-4 h-4 text-maroon" />
        <h2 className="text-base font-semibold text-gray-900">
          Buka Periode Baru
        </h2>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="group">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Tahun Akademik
            </label>
            <input
              type="number"
              value={tahunBaru}
              onChange={(e) => setTahunBaru(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition-all"
            />
          </div>
          <div className="group">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Tanggal Pembukaan (Opsional)
            </label>
            <input
              type="date"
              value={tanggalBuka}
              onChange={(e) => setTanggalBuka(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition-all"
            />
          </div>
          <div className="group">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Jam Pembukaan (Opsional)
            </label>
            <input
              type="time"
              value={jamBuka}
              onChange={(e) => setJamBuka(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition-all"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleBukaPeriode(true)}
            disabled={processing}
            className="flex items-center space-x-1.5 px-4 py-2 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#15803d' }}
          >
            <Play className="w-4 h-4" />
            <span>
              {processing ? 'Memproses...' : `Buka ${tahunBaru} Sekarang`}
            </span>
          </button>
          {!!tanggalBuka && (
            <button
              onClick={() => handleBukaPeriode(false)}
              disabled={processing}
              className="flex items-center space-x-1.5 px-4 py-2 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1e40af' }}
            >
              <Calendar className="w-4 h-4" />
              <span>{processing ? 'Memproses...' : 'Simpan Jadwal'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
