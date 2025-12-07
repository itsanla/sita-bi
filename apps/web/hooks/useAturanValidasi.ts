import { useEffect, useState } from 'react';
import request from '@/lib/api';

type ModeValidasi = 'SALAH_SATU' | 'KEDUA_PEMBIMBING' | 'PEMBIMBING_1_SAJA';

interface AturanValidasi {
  mode_validasi_judul: ModeValidasi;
  mode_validasi_draf: ModeValidasi;
}

export function useAturanValidasi() {
  const [aturan, setAturan] = useState<AturanValidasi>({
    mode_validasi_judul: 'KEDUA_PEMBIMBING',
    mode_validasi_draf: 'KEDUA_PEMBIMBING',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAturan = async () => {
      try {
        const response = await request.get('/aturan-validasi');

        const data = response.data?.data || response.data;
        setAturan({
          mode_validasi_judul: data.mode_validasi_judul || 'KEDUA_PEMBIMBING',
          mode_validasi_draf: data.mode_validasi_draf || 'KEDUA_PEMBIMBING',
        });
      } catch (error) {
        console.error('Failed to fetch aturan validasi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAturan();
  }, []);

  const getValidasiJudulMessage = () => {
    switch (aturan.mode_validasi_judul) {
      case 'SALAH_SATU':
        return 'Judul harus divalidasi oleh salah satu pembimbing';
      case 'KEDUA_PEMBIMBING':
        return 'Judul harus divalidasi oleh kedua pembimbing';
      case 'PEMBIMBING_1_SAJA':
        return 'Judul harus divalidasi oleh Pembimbing 1';
      default:
        return 'Judul harus divalidasi oleh pembimbing';
    }
  };

  const getValidasiDrafMessage = () => {
    switch (aturan.mode_validasi_draf) {
      case 'SALAH_SATU':
        return 'Draf harus divalidasi oleh salah satu pembimbing';
      case 'KEDUA_PEMBIMBING':
        return 'Draf harus divalidasi oleh kedua pembimbing';
      case 'PEMBIMBING_1_SAJA':
        return 'Draf harus divalidasi oleh Pembimbing 1';
      default:
        return 'Draf harus divalidasi oleh pembimbing';
    }
  };

  const isJudulValid = (divalidasiP1: boolean, divalidasiP2: boolean) => {
    switch (aturan.mode_validasi_judul) {
      case 'SALAH_SATU':
        return divalidasiP1 || divalidasiP2;
      case 'KEDUA_PEMBIMBING':
        return divalidasiP1 && divalidasiP2;
      case 'PEMBIMBING_1_SAJA':
        return divalidasiP1;
      default:
        return false;
    }
  };

  const isDrafValid = (
    divalidasiP1: number | null,
    divalidasiP2: number | null,
  ) => {
    switch (aturan.mode_validasi_draf) {
      case 'SALAH_SATU':
        return divalidasiP1 !== null || divalidasiP2 !== null;
      case 'KEDUA_PEMBIMBING':
        return divalidasiP1 !== null && divalidasiP2 !== null;
      case 'PEMBIMBING_1_SAJA':
        return divalidasiP1 !== null;
      default:
        return false;
    }
  };

  return {
    aturan,
    loading,
    getValidasiJudulMessage,
    getValidasiDrafMessage,
    isJudulValid,
    isDrafValid,
  };
}
