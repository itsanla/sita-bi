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
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch periode status:', error);
        setStatus({ isActive: false, periode: null, tanggalBuka: null });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return { status, loading };
}
