'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface PenjadwalanSidangStatus {
  isGenerated: boolean;
  tanggalGenerate: string | null;
  status: 'BELUM_DIJADWALKAN' | 'DIJADWALKAN' | 'SELESAI';
}

export function usePenjadwalanSidangStatus() {
  const [status, setStatus] = useState<PenjadwalanSidangStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get('/penjadwalan-sidang/status');
      console.log('[usePenjadwalanSidangStatus] Raw response:', response.data);
      const data = response.data?.data || response.data;
      console.log('[usePenjadwalanSidangStatus] Extracted data:', data);

      const processedData = {
        isGenerated: Boolean(data.isGenerated),
        tanggalGenerate: data.tanggalGenerate || null,
        status: data.status || 'BELUM_DIJADWALKAN',
      };

      console.log(
        '[usePenjadwalanSidangStatus] Processed data:',
        processedData,
      );
      setStatus(processedData);

      if (processedData.status === 'SELESAI' && intervalRef.current !== null) {
        console.log('[usePenjadwalanSidangStatus] Clearing interval (SELESAI)');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (processedData.status === 'SELESAI' && timeoutRef.current !== null) {
        console.log('[usePenjadwalanSidangStatus] Clearing timeout (SELESAI)');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      console.error(
        '[usePenjadwalanSidangStatus] Error fetching status:',
        error,
      );
      setStatus({
        isGenerated: false,
        tanggalGenerate: null,
        status: 'BELUM_DIJADWALKAN',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[usePenjadwalanSidangStatus] Initial fetch');
    void fetchStatus();

    const handleUpdate = () => {
      console.log(
        '[usePenjadwalanSidangStatus] Event triggered: penjadwalan-sidang-updated',
      );
      void fetchStatus();
    };

    window.addEventListener('penjadwalan-sidang-updated', handleUpdate);

    return () => {
      window.removeEventListener('penjadwalan-sidang-updated', handleUpdate);
    };
  }, [fetchStatus]);

  useEffect(() => {
    console.log(
      '[usePenjadwalanSidangStatus] Polling effect triggered, status:',
      status,
    );

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (
      status !== null &&
      status.status === 'DIJADWALKAN' &&
      status.tanggalGenerate !== null
    ) {
      const targetTime = new Date(status.tanggalGenerate).getTime();
      const now = Date.now();
      const timeUntilGenerate = targetTime - now;

      console.log(
        '[usePenjadwalanSidangStatus] Time until generate:',
        timeUntilGenerate,
        'ms',
      );

      if (timeUntilGenerate > 0) {
        if (timeUntilGenerate <= 3600000) {
          console.log(
            '[usePenjadwalanSidangStatus] Setting timeout for:',
            timeUntilGenerate,
            'ms',
          );
          timeoutRef.current = setTimeout(() => {
            console.log('[usePenjadwalanSidangStatus] Timeout triggered!');
            void fetchStatus();
          }, timeUntilGenerate);
        }

        console.log(
          '[usePenjadwalanSidangStatus] Starting polling interval (15s)',
        );
        intervalRef.current = setInterval(() => {
          console.log(
            '[usePenjadwalanSidangStatus] Interval tick - fetching status',
          );
          void fetchStatus();
        }, 15000);
      } else {
        console.log(
          '[usePenjadwalanSidangStatus] Time already passed, fetching immediately',
        );
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
