// Server Component
import { GraduationCap, Calendar, Clock, MapPin } from 'lucide-react';

export default function JadwalSection() {
  return (
    <section
      id="jadwal"
      className="py-24 bg-gradient-to-b from-white via-orange-50/30 to-white relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-100 to-orange-100 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-yellow-100 to-red-100 rounded-full filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full mb-6">
            <Calendar className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-900 uppercase tracking-wide">
              Schedule
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Jadwal <span className="text-red-600">Sidang</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pantau jadwal sidang Anda dengan mudah dan tetap terorganisir
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">
                  Jadwal Fleksibel
                </h3>
                <p className="text-sm text-gray-600">
                  Atur jadwal sesuai ketersediaan Anda
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">
                  Notifikasi Real-time
                </h3>
                <p className="text-sm text-gray-600">
                  Dapatkan pengingat sebelum sidang
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Lokasi Jelas</h3>
                <p className="text-sm text-gray-600">
                  Info lengkap lokasi dan ruangan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <GraduationCap size={40} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Belum Ada Jadwal Sidang
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Jadwal sidang akan muncul di sini setelah diatur oleh admin. Pantau
            terus halaman ini!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
              <span>Lihat Semua Jadwal</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
