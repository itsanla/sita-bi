'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/periode/status');
        const data = response.data?.data || response.data;
        const processedData = {
          isActive: data.isActive || false,
          periode: data.periode || null,
          tanggalBuka: data.tanggalBuka || data.periode?.tanggal_buka || null,
        };
        setStatus(processedData);
      } catch (error) {
        setStatus({ isActive: false, periode: null, tanggalBuka: null });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    const handlePeriodeUpdate = () => {
      fetchStatus();
    };

    window.addEventListener('periode-updated', handlePeriodeUpdate);
    return () => window.removeEventListener('periode-updated', handlePeriodeUpdate);
  }, []);

  return { status, loading };
}
