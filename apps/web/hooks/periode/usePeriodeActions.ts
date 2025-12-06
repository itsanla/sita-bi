import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  PERIODE_MESSAGES,
  PERIODE_UPDATED_EVENT,
} from '@/lib/constants/periode';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export function usePeriodeActions(onSuccess: () => void) {
  const [processing, setProcessing] = useState(false);

  const dispatchUpdate = () => {
    window.dispatchEvent(new Event(PERIODE_UPDATED_EVENT));
  };

  const bukaPeriode = async (
    tahun: number,
    tanggalBukaISO?: string,
  ): Promise<void> => {
    setProcessing(true);
    try {
      await api.post('/periode/buka', {
        tahun,
        tanggal_buka: tanggalBukaISO,
      });
      toast.success(
        tanggalBukaISO
          ? PERIODE_MESSAGES.SUCCESS_SCHEDULE
          : PERIODE_MESSAGES.SUCCESS_OPEN(tahun),
      );
      onSuccess();
      dispatchUpdate();
    } catch (error) {
      const err = error as ApiError;
      toast.error(
        err.response?.data?.message ?? PERIODE_MESSAGES.ERROR_DEFAULT,
      );
    } finally {
      setProcessing(false);
    }
  };

  const tutupPeriode = async (id: number, tahun: number, catatan: string) => {
    setProcessing(true);
    try {
      await api.post(`/periode/${id}/tutup`, { catatan });
      toast.success(PERIODE_MESSAGES.SUCCESS_CLOSE(tahun));
      onSuccess();
      dispatchUpdate();
    } catch (error) {
      const err = error as ApiError;
      toast.error(
        err.response?.data?.message ?? PERIODE_MESSAGES.ERROR_DEFAULT,
      );
    } finally {
      setProcessing(false);
    }
  };

  const hapusPeriode = async (id: number, tahun: number) => {
    setProcessing(true);
    try {
      await api.delete(`/periode/${id}`);
      toast.success(PERIODE_MESSAGES.SUCCESS_DELETE(tahun));
      onSuccess();
      dispatchUpdate();
    } catch (error) {
      const err = error as ApiError;
      toast.error(
        err.response?.data?.message ?? PERIODE_MESSAGES.ERROR_DEFAULT,
      );
    } finally {
      setProcessing(false);
    }
  };

  const bukaSekarang = async (id: number, tahun: number) => {
    setProcessing(true);
    try {
      await api.post(`/periode/${id}/buka-sekarang`);
      toast.success(PERIODE_MESSAGES.SUCCESS_OPEN(tahun));
      onSuccess();
      dispatchUpdate();
    } catch (error) {
      const err = error as ApiError;
      toast.error(
        err.response?.data?.message ?? PERIODE_MESSAGES.ERROR_DEFAULT,
      );
    } finally {
      setProcessing(false);
    }
  };

  const batalkanJadwal = async (id: number) => {
    setProcessing(true);
    try {
      await api.delete(`/periode/${id}/batalkan-jadwal`);
      toast.success(PERIODE_MESSAGES.SUCCESS_CANCEL);
      onSuccess();
      dispatchUpdate();
    } catch (error) {
      const err = error as ApiError;
      toast.error(
        err.response?.data?.message ?? PERIODE_MESSAGES.ERROR_DEFAULT,
      );
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    bukaPeriode,
    tutupPeriode,
    hapusPeriode,
    bukaSekarang,
    batalkanJadwal,
  };
}
