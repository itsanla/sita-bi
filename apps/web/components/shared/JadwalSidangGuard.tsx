'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { usePenjadwalanSidangStatus } from '@/hooks/usePenjadwalanSidangStatus';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface JadwalSidangGuardProps {
  children: ReactNode;
  hasJadwal?: boolean;
}

export default function JadwalSidangGuard({
  children,
  hasJadwal = false,
}: JadwalSidangGuardProps) {
  const { user } = useAuth();
  const { status, loading } = usePenjadwalanSidangStatus();
  const wasNotGeneratedRef = useRef(false);
  const [pendaftaranStatus, setPendaftaranStatus] = useState<{
    hasPendaftaran: boolean;
    isValidated: boolean;
  } | null>(null);
  const [loadingPendaftaran, setLoadingPendaftaran] = useState(true);

  useEffect(() => {
    const fetchPendaftaran = async () => {
      try {
        const response = await api.get('/pendaftaran-sidang/my-registration');
        const data = response.data.data;
        console.log('[JadwalSidangGuard] Pendaftaran data:', data);

        // Jika ditolak (rejected), dianggap belum daftar (harus daftar ulang)
        if (data && data.is_submitted && data.status_validasi === 'rejected') {
          console.log(
            '[JadwalSidangGuard] Status rejected, dianggap belum daftar',
          );
          setPendaftaranStatus({
            hasPendaftaran: false,
            isValidated: false,
          });
        } else if (data && data.is_submitted) {
          setPendaftaranStatus({
            hasPendaftaran: true,
            isValidated: user?.mahasiswa?.siap_sidang === true,
          });
        } else {
          setPendaftaranStatus({
            hasPendaftaran: false,
            isValidated: false,
          });
        }
      } catch (error) {
        console.log('[JadwalSidangGuard] No pendaftaran found');
        setPendaftaranStatus({
          hasPendaftaran: false,
          isValidated: false,
        });
      } finally {
        setLoadingPendaftaran(false);
      }
    };

    fetchPendaftaran();
  }, [user?.mahasiswa?.siap_sidang]);

  useEffect(() => {
    console.log('[JadwalSidangGuard] Status changed:', status);
    if (status !== null) {
      if (status.status !== 'SELESAI') {
        console.log(
          '[JadwalSidangGuard] Status not SELESAI, marking wasNotGenerated',
        );
        wasNotGeneratedRef.current = true;
      } else if (wasNotGeneratedRef.current && status.status === 'SELESAI') {
        console.log(
          '[JadwalSidangGuard] Status changed to SELESAI, reloading page',
        );
        wasNotGeneratedRef.current = false;
        window.location.reload();
      }
    }
  }, [status]);

  if (loading || loadingPendaftaran) {
    return <LoadingSpinner />;
  }

  // Kondisi 1: Jadwal sudah dipublish (SELESAI) - Buka akses untuk semua
  if (status?.status === 'SELESAI' && status.isGenerated) {
    return (
      <div className="space-y-4">
        {!hasJadwal && !pendaftaranStatus?.hasPendaftaran && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 text-sm">
                  Anda Tidak Terdaftar dalam Jadwal Sidang
                </h3>
                <p className="text-xs text-red-700 mt-1">
                  Anda belum mendaftar sidang untuk periode tahun ini. Nama Anda
                  tidak akan muncul dalam daftar jadwal sidang.
                </p>
              </div>
            </div>
          </div>
        )}
        {!!pendaftaranStatus?.hasPendaftaran &&
          !pendaftaranStatus?.isValidated && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm">
                    Pendaftaran Belum Diverifikasi
                  </h3>
                  <p className="text-xs text-amber-700 mt-1">
                    Pendaftaran Anda belum diverifikasi. Nama Anda tidak akan
                    muncul dalam daftar jadwal sidang sampai diverifikasi.
                  </p>
                </div>
              </div>
            </div>
          )}
        {!!(
          hasJadwal ||
          (pendaftaranStatus?.hasPendaftaran && pendaftaranStatus?.isValidated)
        ) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 text-sm">
                  Anda Terdaftar dalam Jadwal Sidang
                </h3>
                <p className="text-xs text-green-700 mt-1">
                  Nama Anda sudah masuk dalam daftar jadwal sidang di bawah ini.
                </p>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    );
  }

  // Kondisi 2: Jadwal akan dipublish pada tanggal tertentu (DIJADWALKAN)
  if (status?.status === 'DIJADWALKAN' && status.tanggalGenerate) {
    const tanggal = new Date(status.tanggalGenerate);
    const statusColor = !pendaftaranStatus?.hasPendaftaran
      ? 'red'
      : !pendaftaranStatus?.isValidated
        ? 'amber'
        : 'green';
    const statusIcon = !pendaftaranStatus?.hasPendaftaran
      ? AlertCircle
      : !pendaftaranStatus?.isValidated
        ? Clock
        : Calendar;
    const StatusIcon = statusIcon;
    const statusTitle = !pendaftaranStatus?.hasPendaftaran
      ? 'Belum Mendaftar Sidang'
      : !pendaftaranStatus?.isValidated
        ? 'Menunggu Validasi Pendaftaran'
        : 'Pendaftaran Disetujui';
    const statusDesc = !pendaftaranStatus?.hasPendaftaran
      ? 'Anda belum mendaftar sidang. Silakan daftar melalui menu Pendaftaran Sidang.'
      : !pendaftaranStatus?.isValidated
        ? 'Pendaftaran sidang Anda sedang dalam proses validasi.'
        : 'Anda terdaftar untuk sidang periode ini.';

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div
            className={`w-16 h-16 bg-${statusColor}-100 rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            <StatusIcon className={`w-8 h-8 text-${statusColor}-600`} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {statusTitle}
          </h2>
          <p className="text-sm text-gray-600 mb-4">{statusDesc}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-xs text-blue-800 mb-2">
              Jadwal sidang akan dipublish pada:
            </p>
            <p className="text-lg font-semibold text-blue-900">
              {tanggal.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Pukul{' '}
              {tanggal.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Kondisi 3: Jadwal belum dijadwalkan (BELUM_DIJADWALKAN)
  const statusColor = !pendaftaranStatus?.hasPendaftaran
    ? 'red'
    : !pendaftaranStatus?.isValidated
      ? 'amber'
      : 'green';
  const statusIcon = !pendaftaranStatus?.hasPendaftaran
    ? AlertCircle
    : !pendaftaranStatus?.isValidated
      ? Clock
      : Calendar;
  const StatusIcon = statusIcon;
  const statusTitle = !pendaftaranStatus?.hasPendaftaran
    ? 'Belum Mendaftar Sidang'
    : !pendaftaranStatus?.isValidated
      ? 'Menunggu Validasi Pendaftaran'
      : 'Pendaftaran Disetujui';
  const statusDesc = !pendaftaranStatus?.hasPendaftaran
    ? 'Anda belum mendaftar sidang. Silakan daftar melalui menu Pendaftaran Sidang.'
    : !pendaftaranStatus?.isValidated
      ? 'Pendaftaran sidang Anda sedang dalam proses validasi.'
      : 'Anda terdaftar untuk sidang periode ini.';

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
        <div
          className={`w-16 h-16 bg-${statusColor}-100 rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <StatusIcon className={`w-8 h-8 text-${statusColor}-600`} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{statusTitle}</h2>
        <p className="text-sm text-gray-600 mb-4">{statusDesc}</p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
          <p className="text-xs text-amber-800">
            Kaprodi belum mengatur jadwal publish untuk jadwal sidang periode
            ini.
          </p>
        </div>
      </div>
    </div>
  );
}
