'use client';

import { useRBAC } from '@/hooks/useRBAC';
import Pengumuman from '@/components/shared/Pengumuman';
import KelolaPengumuman from '@/components/shared/KelolaPengumuman';

export default function DosenPengumumanPage() {
  const { isJurusan, isProdi } = useRBAC();

  const canManage = isJurusan || isProdi;

  if (canManage) {
    return <KelolaPengumuman />;
  }

  return <Pengumuman />;
}
