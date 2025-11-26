// Server Component
import { BookOpen, Search, TrendingUp, Users } from 'lucide-react';

export default function TawaranTopikSection() {
  return (
    <section
      id="tawarantopik"
      className="py-24 bg-white relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(153 27 27) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full mb-6">
            <BookOpen className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-900 uppercase tracking-wide">
              Explore Topics
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Tawaran Topik <span className="text-red-600">Penelitian</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan topik penelitian yang sesuai dengan minat dan kebutuhan Anda
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-red-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cari Topik</h3>
            <p className="text-sm text-gray-600">
              Temukan topik yang sesuai dengan minat penelitian Anda
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Kolaborasi</h3>
            <p className="text-sm text-gray-600">
              Kerjasama dengan dosen pembimbing yang berpengalaman
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-2xl border border-yellow-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Tren Terkini
            </h3>
            <p className="text-sm text-gray-600">
              Topik penelitian yang relevan dengan perkembangan teknologi
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center p-12 bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-300">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={40} className="text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Belum Ada Topik Tersedia
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Tawaran topik penelitian akan segera ditampilkan di sini. Pantau
            terus untuk update terbaru!
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-full font-semibold hover:bg-red-50 transition-colors">
            <span>Hubungi Admin</span>
          </button>
        </div>
      </div>
    </section>
  );
}
