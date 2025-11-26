// Server Component (RSC) with streaming for better performance
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import HeroSection from './components/landing-page/HeroSection';
import { SectionSkeleton } from './components/Suspense/LoadingFallback';

// Dynamic imports for below-the-fold sections (lazy load)
const TawaranTopikSection = dynamic(
  () => import('./components/landing-page/TawaranTopikSection'),
  {
    loading: () => <SectionSkeleton />,
  },
);

const JadwalSection = dynamic(
  () => import('./components/landing-page/JadwalSection'),
  {
    loading: () => <SectionSkeleton />,
  },
);

const PengumumanSection = dynamic(
  () => import('./components/landing-page/PengumumanSection'),
  {
    loading: () => <SectionSkeleton />,
  },
);

const FooterWrapper = dynamic(
  () => import('./components/landing-page/FooterWrapper'),
);

// Lazy load client components for better performance - Import in client component
const ClientWrapperComponent = dynamic(
  () => import('./components/landing-page/ClientWrapper'),
);

export default function SitaBIHomepage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Client-side interactive components (progress bar, header, scroll button) */}
      <ClientWrapperComponent />

      {/* Hero section - Above the fold, render immediately */}
      <HeroSection />

      {/* Below-the-fold sections with Suspense streaming */}
      <Suspense fallback={<SectionSkeleton />}>
        <TawaranTopikSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <JadwalSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <PengumumanSection />
      </Suspense>

      <Suspense fallback={<div className="h-40" />}>
        <FooterWrapper />
      </Suspense>
    </div>
  );
}
