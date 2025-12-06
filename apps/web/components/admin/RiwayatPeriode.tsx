'use client';

import { useEffect, useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { api } from '@/lib/api';

interface Riwayat {
  id: number;
  action: string;
  details: string | null;
  user: { name: string } | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  BUKA_PERIODE: 'Buka Periode',
  TUTUP_PERIODE: 'Tutup Periode',
  HAPUS_PERIODE: 'Hapus Periode',
  BUKA_PERIODE_SEKARANG: 'Buka Sekarang',
  BATALKAN_JADWAL_PERIODE: 'Batalkan Jadwal',
  ATUR_JADWAL_PERIODE: 'Atur Jadwal',
};

const ACTION_COLORS: Record<string, string> = {
  BUKA_PERIODE: 'bg-green-50 text-green-700 border-green-200',
  TUTUP_PERIODE: 'bg-red-50 text-red-700 border-red-200',
  HAPUS_PERIODE: 'bg-gray-50 text-gray-700 border-gray-200',
  BUKA_PERIODE_SEKARANG: 'bg-blue-50 text-blue-700 border-blue-200',
  BATALKAN_JADWAL_PERIODE: 'bg-amber-50 text-amber-700 border-amber-200',
  ATUR_JADWAL_PERIODE: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function RiwayatPeriode() {
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const itemsPerPage = 5;

  useEffect(() => {
    void fetchRiwayat();
  }, []);

  const fetchRiwayat = async () => {
    try {
      const response = await api.get('/periode/riwayat');
      setRiwayat(response.data.data);
    } catch {
      setRiwayat([]);
    } finally {
      setLoading(false);
    }
  };

  const formatBukaPeriode = (body: {
    tahun?: number;
    tanggal_buka?: string;
  }): string => {
    if (!body.tahun) return '';
    if (body.tanggal_buka) {
      const tanggal = new Date(body.tanggal_buka).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'long',
        timeStyle: 'short',
      });
      return `Periode TA ${body.tahun} dijadwalkan buka pada ${tanggal}`;
    }
    return `Periode TA ${body.tahun} dibuka langsung`;
  };

  const parseDetails = (details: string | null, action: string): string => {
    if (!details) return '';

    try {
      const data = JSON.parse(details);
      const body = data.body || {};
      const params = data.params || {};

      if (action === 'BUKA_PERIODE') return formatBukaPeriode(body);
      if (action === 'TUTUP_PERIODE')
        return body.catatan
          ? `Catatan: ${body.catatan}`
          : 'Periode ditutup tanpa catatan';
      if (action === 'HAPUS_PERIODE') return `Periode ID ${params.id} dihapus`;
      if (action === 'BUKA_PERIODE_SEKARANG')
        return `Periode ID ${params.id} dibuka sekarang`;
      if (action === 'BATALKAN_JADWAL_PERIODE')
        return `Jadwal periode ID ${params.id} dibatalkan`;

      return '';
    } catch {
      return '';
    }
  };

  const filteredRiwayat =
    startDate || endDate
      ? riwayat.filter((item) => {
          const itemDate = new Date(item.created_at)
            .toISOString()
            .split('T')[0];
          const start = startDate || '1970-01-01';
          const end = endDate || '2100-12-31';
          return itemDate >= start && itemDate <= end;
        })
      : riwayat;

  const totalPages = Math.ceil(filteredRiwayat.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredRiwayat.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Riwayat Aktivitas
        </h2>
        <p className="text-sm text-gray-500">Memuat riwayat...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Riwayat Aktivitas
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Dari"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon/20 focus:border-maroon"
            />
            <span className="text-gray-400 text-sm">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Sampai"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon/20 focus:border-maroon"
            />
          </div>
          {(!!startDate || !!endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg sm:w-auto w-full"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {filteredRiwayat.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {startDate || endDate
              ? 'Tidak ada riwayat pada rentang tanggal ini'
              : 'Belum ada riwayat'}
          </p>
        ) : (
          <>
            {paginatedData.map((item) => {
              const colorClass =
                ACTION_COLORS[item.action] ||
                'bg-gray-50 text-gray-700 border-gray-200';
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${colorClass}`}
                    >
                      {ACTION_LABELS[item.action] || item.action}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {!!parseDetails(item.details, item.action) && (
                      <p className="text-sm text-gray-700">
                        {parseDetails(item.details, item.action)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="font-medium">
                        {item.user?.name || 'Sistem'}
                      </span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(item.created_at).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
