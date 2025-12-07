'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { Calendar, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import io from 'socket.io-client';
import {
  PERIODE_STATUS,
  PERIODE_MESSAGES,
  PERIODE_UPDATED_EVENT,
} from '@/lib/constants/periode';
import { usePeriodeActions } from '@/hooks/periode/usePeriodeActions';

const PeriodeCard = dynamic(() => import('@/components/periode/PeriodeCard'), {
  ssr: false,
});
const BukaPeriodeForm = dynamic(
  () => import('@/components/periode/BukaPeriodeForm'),
  { ssr: false },
);
const ConfirmDialog = dynamic(() => import('@/components/ConfirmDialog'), {
  ssr: false,
});
const PromptDialog = dynamic(
  () => import('@/components/periode/PromptDialog'),
  { ssr: false },
);
const RiwayatPeriode = dynamic(
  () => import('@/components/admin/RiwayatPeriode'),
  { ssr: false },
);

interface Periode {
  id: number;
  tahun: number;
  nama: string;
  status: string;
  tanggal_buka: string | null;
  tanggal_tutup: string | null;
}

export default function KelolaPeriodePage() {
  const { isJurusan, role } = useRBAC();
  const [loading, setLoading] = useState(true);
  const [periodes, setPeriodes] = useState<Periode[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const [promptDialog, setPromptDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: (_value: string) => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const fetchPeriodes = async () => {
    try {
      const response = await api.get<Periode[]>('/periode');
      setPeriodes(response.data.data ?? []);
    } catch {
      toast.error(PERIODE_MESSAGES.ERROR_LOAD);
    } finally {
      setLoading(false);
    }
  };

  const {
    processing,
    bukaPeriode,
    tutupPeriode,
    hapusPeriode,
    bukaSekarang,
    batalkanJadwal,
  } = usePeriodeActions(fetchPeriodes);

  useEffect(() => {
    if (isJurusan) {
      fetchPeriodes().catch(() => {});
    }
  }, [isJurusan]);

  useEffect(() => {
    if (!isJurusan || periodes.length === 0) return;

    const persiapan = periodes.find(
      (p) => p.status === PERIODE_STATUS.PERSIAPAN,
    );
    if (!persiapan?.tanggal_buka) return;

    const targetTime = new Date(persiapan.tanggal_buka).getTime();
    const now = Date.now();
    const timeUntilOpen = targetTime - now;

    if (timeUntilOpen <= 0) {
      fetchPeriodes().catch(() => {});
      return;
    }

    if (timeUntilOpen > 3600000) return;

    const timeoutId = setTimeout(() => {
      fetchPeriodes().catch(() => {});
    }, timeUntilOpen);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isJurusan, periodes]);

  useEffect(() => {
    const handlePeriodeUpdate = () => {
      fetchPeriodes().catch(() => {});
    };

    window.addEventListener(PERIODE_UPDATED_EVENT, handlePeriodeUpdate);
    return () =>
      window.removeEventListener(PERIODE_UPDATED_EVENT, handlePeriodeUpdate);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.warn('[WebSocket] Terhubung ke pembaruan periode');
    });

    socket.on('periode:updated', () => {
      console.warn('[WebSocket] Periode diperbarui, memuat ulang...');
      fetchPeriodes().catch(() => {});
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTutupPeriode = (id: number, tahun: number) => {
    setPromptDialog({
      open: true,
      title: 'Tutup Periode',
      description: PERIODE_MESSAGES.CONFIRM_CLOSE(tahun),
      onConfirm: (catatan: string) => {
        tutupPeriode(id, tahun, catatan).catch(() => {});
      },
    });
  };

  const handleHapusPeriode = (id: number, tahun: number) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Periode',
      description: PERIODE_MESSAGES.CONFIRM_DELETE(tahun),
      onConfirm: () => {
        hapusPeriode(id, tahun).catch(() => {});
      },
    });
  };

  const handleBukaSekarang = (id: number, tahun: number) => {
    setConfirmDialog({
      open: true,
      title: 'Buka Periode',
      description: PERIODE_MESSAGES.CONFIRM_OPEN_NOW(tahun),
      onConfirm: () => {
        bukaSekarang(id, tahun).catch(() => {});
      },
    });
  };

  const handleBatalkanJadwal = (id: number, tahun: number) => {
    setConfirmDialog({
      open: true,
      title: 'Batalkan Jadwal',
      description: PERIODE_MESSAGES.CONFIRM_CANCEL(tahun),
      onConfirm: () => {
        batalkanJadwal(id).catch(() => {});
      },
    });
  };

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-maroon-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-maroon border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-600">
            Memuat data pengguna...
          </p>
        </div>
      </div>
    );
  }

  if (!isJurusan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-maroon-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-maroon" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Fitur ini hanya dapat diakses oleh Ketua Jurusan
          </p>
          <a
            href="/dashboard/dosen"
            className="inline-block px-4 py-2 bg-maroon text-white rounded-lg hover:bg-maroon-800 transition-all duration-300"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-maroon-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-maroon border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-600">Memuat periode...</p>
        </div>
      </div>
    );
  }

  const activePeriode = periodes.find((p) => p.status === PERIODE_STATUS.AKTIF);

  return (
    <div className="max-w-6xl mx-auto px-2 py-3 sm:p-4 lg:p-6 space-y-4">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-maroon to-maroon-800 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-gray-900">
              Kelola Periode Tugas Akhir
            </h1>
            <p className="text-xs text-gray-600 hidden sm:block">
              Buka dan tutup periode TA per tahun akademik
            </p>
          </div>
        </div>
      </div>

      {!activePeriode && (
        <BukaPeriodeForm onSubmit={bukaPeriode} processing={processing} />
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-300">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Daftar Periode
        </h2>
        <div className="space-y-3">
          {periodes.map((periode) => (
            <PeriodeCard
              key={periode.id}
              periode={periode}
              processing={processing}
              onTutup={() => handleTutupPeriode(periode.id, periode.tahun)}
              onBukaSekarang={() =>
                handleBukaSekarang(periode.id, periode.tahun)
              }
              onBatalkan={() => handleBatalkanJadwal(periode.id, periode.tahun)}
              onHapus={() => handleHapusPeriode(periode.id, periode.tahun)}
            />
          ))}
        </div>
      </div>

      <RiwayatPeriode />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="warning"
      />

      <PromptDialog
        open={promptDialog.open}
        onOpenChange={(open) => setPromptDialog({ ...promptDialog, open })}
        title={promptDialog.title}
        description={promptDialog.description}
        placeholder="Catatan penutupan (opsional)"
        onConfirm={promptDialog.onConfirm}
      />
    </div>
  );
}
