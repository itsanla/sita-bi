// apps/web/app/dashboard/mahasiswa/page.tsx
'use client';

import { Suspense } from 'react';
import { DashboardCardSkeleton } from '@/components/Suspense/LoadingFallback';
import { DashboardErrorBoundary } from '@/components/ErrorBoundary/DashboardErrorBoundary';
import { PeriodeSelector } from '@/components/PeriodeSelector';
import WelcomeSection from './components/WelcomeSection';
import DashboardStats from './components/DashboardStats';
import ProgressTimeline from './components/ProgressTimeline';
import SyaratSidangWidget from './components/SyaratSidangWidget';
import QuickActions from './components/QuickActions';
import UpcomingSchedule from './components/UpcomingSchedule';

export default function MahasiswaDashboardPage() {
  return (
    <DashboardErrorBoundary>
      <div className="space-y-8 pb-8">
        <div className="flex justify-end">
          <PeriodeSelector />
        </div>
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
    </DashboardErrorBoundary>
  );
}
