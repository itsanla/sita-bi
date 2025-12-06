'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface PeriodeStatus {
  isActive: boolean;
  periode: {
    id: number;
    tahun: number;
    nama: string;
    status: string;
    tanggal_buka: string | null;
    tanggal_tutup: string | null;
  } | null;
  tanggalBuka: string | null;
}

export function usePeriodeStatus() {
  const [status, setStatus] = useState<PeriodeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get('/periode/status');
      const data = response.data?.data || response.data;

      const processedData = {
        isActive: Boolean(data.isActive),
        periode: data.periode || null,
        tanggalBuka: data.tanggalBuka || data.periode?.tanggal_buka || null,
      };

      setStatus(processedData);

      if (processedData.isActive && intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (processedData.isActive && timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch {
      setStatus({ isActive: false, periode: null, tanggalBuka: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();

    const handlePeriodeUpdate = () => {
      void fetchStatus();
    };

    window.addEventListener('periode-updated', handlePeriodeUpdate);

    return () => {
      window.removeEventListener('periode-updated', handlePeriodeUpdate);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (status !== null && !status.isActive && status.tanggalBuka !== null) {
      const targetTime = new Date(status.tanggalBuka).getTime();
      const now = Date.now();
      const timeUntilOpen = targetTime - now;

      if (timeUntilOpen > 0) {
        if (timeUntilOpen <= 3600000) {
          timeoutRef.current = setTimeout(() => {
            void fetchStatus();
          }, timeUntilOpen);
        }

        intervalRef.current = setInterval(() => {
          void fetchStatus();
        }, 15000);
      } else {
        void fetchStatus();
      }
    }

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, fetchStatus]);

  return { status, loading };
}
