// apps/web/app/dashboard/mahasiswa/page.tsx
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DashboardCardSkeleton } from '@/components/Suspense/LoadingFallback';

// Dynamically import client components
const WelcomeSection = dynamic(() => import('./components/WelcomeSection'), {
  ssr: false,
});
const DashboardStats = dynamic(() => import('./components/DashboardStats'));
const ProgressTimeline = dynamic(() => import('./components/ProgressTimeline'));
const SyaratSidangWidget = dynamic(
  () => import('./components/SyaratSidangWidget'),
);
const QuickActions = dynamic(() => import('./components/QuickActions'));
const UpcomingSchedule = dynamic(() => import('./components/UpcomingSchedule'));

export default function MahasiswaDashboardPage() {
  return (
    <div className="space-y-8 pb-8">
      <Suspense
        fallback={
          <div className="h-32 animate-pulse bg-gray-200 rounded-2xl" />
        }
      >
        <WelcomeSection />
      </Suspense>

      <Suspense fallback={<DashboardCardSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<DashboardCardSkeleton />}>
            <ProgressTimeline />
          </Suspense>
          <Suspense fallback={<DashboardCardSkeleton />}>
            <QuickActions />
          </Suspense>
        </div>
        <div className="space-y-6">
          <Suspense fallback={<DashboardCardSkeleton />}>
            <SyaratSidangWidget />
          </Suspense>
          <Suspense fallback={<DashboardCardSkeleton />}>
            <UpcomingSchedule />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
