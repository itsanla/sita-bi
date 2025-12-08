'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface TAStatus {
  hasTA: boolean;
  hasPembimbing: boolean;
  isJudulValidated: boolean;
  isEligibleForSidang: boolean;
  tugasAkhir: {
    id: number;
    judul: string;
    status: string;
    judul_divalidasi_p1: boolean;
    judul_divalidasi_p2: boolean;
  } | null;
}

export function useTAStatus() {
  const [status, setStatus] = useState<TAStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/bimbingan/sebagai-mahasiswa');
      const tugasAkhir = response.data?.data;

      if (!tugasAkhir) {
        setStatus({
          hasTA: false,
          hasPembimbing: false,
          isJudulValidated: false,
          isEligibleForSidang: false,
          tugasAkhir: null,
        });
        return;
      }

      const pembimbingList = tugasAkhir.peranDosenTa?.filter(
        (p: { peran: string }) => p.peran === 'pembimbing1' || p.peran === 'pembimbing2'
      ) || [];
      const hasPembimbing = pembimbingList.length >= 2;
      const isJudulValidated =
        tugasAkhir.judul_divalidasi_p1 || tugasAkhir.judul_divalidasi_p2;

      // Fetch eligibility from backend API
      let isEligibleForSidang = false;
      try {
        const eligibilityResponse = await api.get(`/bimbingan/eligibility/${tugasAkhir.id}`);
        isEligibleForSidang = eligibilityResponse.data?.data?.eligible || false;
      } catch {
        // Fallback to old logic if API fails
        const validBimbinganCount =
          tugasAkhir.bimbinganTa?.filter(
            (b: { status_bimbingan: string }) => b.status_bimbingan === 'selesai',
          ).length || 0;
        const latestDokumen = tugasAkhir.dokumenTa?.[0];
        const isDrafValidatedP1 = !!latestDokumen?.divalidasi_oleh_p1;
        const isDrafValidatedP2 = !!latestDokumen?.divalidasi_oleh_p2;
        isEligibleForSidang =
          validBimbinganCount >= 9 && isDrafValidatedP1 && isDrafValidatedP2;
      }

      setStatus({
        hasTA: true,
        hasPembimbing,
        isJudulValidated,
        isEligibleForSidang,
        tugasAkhir: {
          id: tugasAkhir.id,
          judul: tugasAkhir.judul,
          status: tugasAkhir.status,
          judul_divalidasi_p1: tugasAkhir.judul_divalidasi_p1,
          judul_divalidasi_p2: tugasAkhir.judul_divalidasi_p2,
        },
      });
    } catch {
      setStatus({
        hasTA: false,
        hasPembimbing: false,
        isJudulValidated: false,
        isEligibleForSidang: false,
        tugasAkhir: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { status, loading, refetch: fetchStatus };
}
