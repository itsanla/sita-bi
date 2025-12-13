'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

interface PeriodeTa {
  id: number;
  tahun: number;
  nama: string;
  status: 'PERSIAPAN' | 'AKTIF' | 'SELESAI';
}

interface PeriodeContextType {
  selectedPeriodeId: number | null;
  setSelectedPeriodeId: (_id: number | null) => void;
  periodes: PeriodeTa[];
  activePeriode: PeriodeTa | null;
  loading: boolean;
}

const PeriodeContext = createContext<PeriodeContextType | undefined>(undefined);

export function PeriodeProvider({ children }: { children: ReactNode }) {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number | null>(
    null,
  );
  const [periodes, setPeriodes] = useState<PeriodeTa[]>([]);
  const [activePeriode, setActivePeriode] = useState<PeriodeTa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedPeriodeId !== null && typeof window !== 'undefined') {
      localStorage.setItem('selectedPeriodeId', selectedPeriodeId.toString());
    }
  }, [selectedPeriodeId]);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const fetchPeriodes = async () => {
      try {
        const activeRes = await api.get('/periode/aktif');
        const activeData = activeRes.data.data as PeriodeTa | null;
        
        let periodesData: PeriodeTa[] = [];
        
        const userRole = user.roles?.[0]?.name;
        
        if (userRole === 'mahasiswa') {
          // Mahasiswa: periode yang pernah diikuti
          const mahasiswaPeriodesRes = await api.get('/periode/mahasiswa');
          periodesData = mahasiswaPeriodesRes.data.data as PeriodeTa[];
        } else if (userRole === 'admin') {
          // Admin: semua periode untuk analisis dan pelaporan
          const allPeriodesRes = await api.get('/periode');
          periodesData = allPeriodesRes.data.data as PeriodeTa[];
        } else {
          // Dosen/Kaprodi/Jurusan: periode yang pernah mereka handle
          const dosenPeriodesRes = await api.get('/periode/dosen');
          periodesData = dosenPeriodesRes.data.data as PeriodeTa[];
        }

        setPeriodes(periodesData);
        setActivePeriode(activeData);
        setSelectedPeriodeId(activeData?.id ?? null);
      } catch (error) {
        console.error('Gagal memuat periode:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPeriodes();
  }, [user, authLoading]);

  return (
    <PeriodeContext.Provider
      value={{
        selectedPeriodeId,
        setSelectedPeriodeId,
        periodes,
        activePeriode,
        loading,
      }}
    >
      {children}
    </PeriodeContext.Provider>
  );
}

export function usePeriode() {
  const context = useContext(PeriodeContext);
  if (context === undefined) {
    throw new Error('usePeriode harus digunakan dalam PeriodeProvider');
  }
  return context;
}
