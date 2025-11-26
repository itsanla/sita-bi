'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';

interface DosenCapacity {
  dosenId: number;
  userId: number;
  name: string;
  email: string;
  nip: string;
  prodi: string | null;
  capacity: {
    current: number;
    max: number;
    available: number;
    percentage: number;
  };
}

export function useDosenCapacity() {
  const [capacities, setCapacities] = useState<DosenCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapacities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rbac/dosen-capacity');
      if (response.data?.data) {
        setCapacities(response.data.data as DosenCapacity[]);
      }
    } catch (err) {
      setError('Gagal memuat data kapasitas dosen');
      console.error('[useDosenCapacity] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacities();
  }, []);

  const getCapacity = (dosenId: number) => {
    return capacities.find((c) => c.dosenId === dosenId)?.capacity;
  };

  const isAvailable = (dosenId: number): boolean => {
    const capacity = getCapacity(dosenId);
    return capacity ? capacity.available > 0 : false;
  };

  return {
    capacities,
    loading,
    error,
    getCapacity,
    isAvailable,
    refetch: fetchCapacities,
  };
}
