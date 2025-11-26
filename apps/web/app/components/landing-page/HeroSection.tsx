// Server Component
import Image from 'next/image';
import ClientOnly from '../ClientOnly';
import SitaBotButton from '../SitaBot/SitaBotButton';
import { Sparkles, TrendingUp, Shield } from 'lucide-react';

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-red-100 px-5 py-2.5 rounded-full shadow-lg">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-red-900 to-red-600 bg-clip-text text-transparent">
                Welcome to SITA-BI Platform
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight text-gray-900">
              Kelola Tugas Akhir{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-red-600 via-red-700 to-red-900 bg-clip-text text-transparent">
                  Dengan Mudah
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="12"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <path
                    d="M2 10C60 2 140 2 198 10"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#DC2626" />
                      <stop offset="100%" stopColor="#7C2D12" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
              Platform manajemen tugas akhir yang efisien. Kelola bimbingan,
              jadwal sidang, dan pengumuman dalam satu tempat yang terintegrasi.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-red-100 shadow-sm">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">
                  Efisien & Cepat
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-red-100 shadow-sm">
                <Shield className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">
                  Aman & Terpercaya
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="/login"
                className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white bg-gradient-to-r from-red-600 to-red-800 rounded-full overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10">Mulai Sekarang</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-900 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              </a>

              <ClientOnly
                fallback={
                  <button className="inline-flex items-center justify-center px-8 py-4 font-semibold text-red-900 bg-white border-2 border-red-200 rounded-full opacity-50 cursor-not-allowed">
                    Loading...
                  </button>
                }
              >
                <SitaBotButton />
              </ClientOnly>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="relative lg:ml-auto">
            <Image
              src="/hero.png"
              alt="Gedung Politeknik"
              width={5020}
              height={1080}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
