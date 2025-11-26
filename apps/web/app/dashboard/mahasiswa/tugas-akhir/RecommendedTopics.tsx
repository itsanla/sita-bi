'use client';

import { BookMarked, PlusCircle, User, Users2, Sparkles } from 'lucide-react';
import { useRecommendedTopics } from '@/hooks/useTugasAkhir';
import SkeletonCard from '@/app/components/loading/SkeletonCard';

interface RecommendedTopicsProps {
  onSelectTitle: (_title: string) => void;
}

export default function RecommendedTopics({
  onSelectTitle,
}: RecommendedTopicsProps) {
  const { recommendedTitles, loading } = useRecommendedTopics();

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (recommendedTitles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-300 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookMarked className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-700 text-base font-semibold mb-2">
            Tidak Ada Topik Tersedia
          </p>
          <p className="text-gray-500 text-sm">
            Periksa kembali nanti untuk topik rekomendasi dari dosen ahli kami.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-maroon-900/20 rounded-2xl blur-lg"></div>
            <div className="relative bg-gradient-to-br from-maroon-900 to-maroon-800 p-4 rounded-2xl shadow-lg hover:scale-105 hover:rotate-3 transition-all duration-300">
              <BookMarked className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Topik Rekomendasi
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Topik tugas akhir yang dikurasi khusus oleh dosen ahli di bidangnya
            untuk membantu Anda memulai penelitian
          </p>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="space-y-4">
        {recommendedTitles.map((topic, idx) => (
          <div
            key={topic.id}
            className="group relative overflow-hidden bg-gradient-to-br from-white to-maroon-50/20 rounded-2xl border-2 border-maroon-100 shadow-sm hover:shadow-lg hover:border-maroon-200 transition-all duration-300"
          >
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-maroon-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-maroon-500/10 transition-colors duration-500"></div>

            <div className="relative flex gap-6 p-6">
              {/* Left Side - Number Badge */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-maroon-900/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-maroon-900 to-maroon-800 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {idx + 1}
                  </div>
                </div>
                {/* Sparkle indicator */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Title */}
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2 leading-tight group-hover:text-maroon-900 transition-colors duration-300">
                    {topic.judul_topik}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed line-clamp-3 group-hover:text-gray-700">
                    {topic.deskripsi}
                  </p>
                </div>

                {/* Info Cards */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Lecturer Card */}
                  <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-maroon-200 transition-all duration-300 group/pill">
                    <div className="w-10 h-10 bg-gradient-to-br from-maroon-900 to-maroon-800 rounded-xl flex items-center justify-center group-hover/pill:scale-110 transition-transform duration-300">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Dosen Pembimbing
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {topic.dosenPencetus.name}
                      </p>
                    </div>
                  </div>

                  {/* Quota Card */}
                  <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group/pill">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover/pill:scale-110 transition-transform duration-300">
                      <Users2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Kuota Tersedia
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {topic.kuota} Mahasiswa
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0 flex items-center">
                <button
                  onClick={() => onSelectTitle(topic.judul_topik)}
                  className="group/btn relative bg-gradient-to-br from-maroon-900 to-maroon-800 text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-maroon-800 to-maroon-900 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <PlusCircle className="relative h-6 w-6 group-hover/btn:rotate-90 transition-transform duration-500" />
                  <span className="relative text-sm">Gunakan Topik</span>
                </button>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-maroon-500 via-maroon-600 to-maroon-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
