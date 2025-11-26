// Server Component
import { Megaphone, Bell, Info, AlertCircle } from 'lucide-react';

export default function PengumumanSection() {
  return (
    <section
      id="pengumuman"
      className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden"
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
            <Megaphone className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-900 uppercase tracking-wide">
              Announcements
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Pengumuman <span className="text-red-600">Terkini</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dapatkan informasi terbaru dan penting seputar kegiatan akademik
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-xl border border-red-100 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Penting</p>
                <p className="text-xs text-gray-600">0 pengumuman</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Informasi</p>
                <p className="text-xs text-gray-600">0 pengumuman</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-white p-5 rounded-xl border border-yellow-100 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Reminder</p>
                <p className="text-xs text-gray-600">0 pengumuman</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-100 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Acara</p>
                <p className="text-xs text-gray-600">0 pengumuman</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-300">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Megaphone size={40} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-4 border-white animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-4 border-white"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Belum Ada Pengumuman
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Pengumuman penting akan ditampilkan di sini. Aktifkan notifikasi
            untuk mendapatkan update terbaru!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-full font-semibold hover:bg-red-50 transition-colors">
              <Bell className="w-4 h-4" />
              <span>Aktifkan Notifikasi</span>
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
              <span>Lihat Arsip</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
