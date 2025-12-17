import {
  BookOpen,
  Layout,
  Settings,
  Users,
  UserCheck,
  CheckCircle,
  Code,
} from 'lucide-react';

export default function IntroductionSection() {
  return (
    <section id="introduction" className="mb-20 scroll-mt-24">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10">
        Pengenalan
      </h1>

      <div id="intro-overview" className="mb-16 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <BookOpen className="mr-2.5 text-red-900" size={24} />
          Tentang SITA-BI
        </h2>
        <div className="prose prose-gray max-w-none">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong className="text-red-900">SITA-BI</strong> (Sistem
              Informasi Tugas Akhir - Business Intelligence) adalah platform
              digital komprehensif yang dirancang khusus untuk mengelola seluruh
              siklus proses tugas akhir mahasiswa secara terintegrasi, efisien,
              dan terorganisir dengan baik.
            </p>
            <p className="text-gray-700 leading-relaxed mb-0">
              Sistem ini menghubungkan tiga stakeholder utama:{' '}
              <strong>mahasiswa</strong>, <strong>dosen pembimbing</strong>, dan{' '}
              <strong>administrator/koordinator program studi</strong> dalam
              satu ekosistem digital yang mudah diakses, user-friendly, dan
              dapat digunakan kapan saja, di mana saja.
            </p>
          </div>

          <div className="bg-red-50 border-l-4 border-red-900 p-5 rounded-r my-6">
            <p className="text-gray-900 font-semibold mb-3 text-sm">
              💡 Tujuan Utama
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-red-900 mr-2">•</span>
                <span>
                  Mempermudah koordinasi antara mahasiswa dan dosen pembimbing
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-red-900 mr-2">•</span>
                <span>Meningkatkan transparansi proses tugas akhir</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-900 mr-2">•</span>
                <span>Mempercepat proses administrasi dan approval</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-900 mr-2">•</span>
                <span>Mengurangi penggunaan dokumen fisik (paperless)</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-900 mr-2">•</span>
                <span>
                  Menyediakan tracking progress tugas akhir secara real-time
                </span>
              </li>
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-4 my-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <Users className="text-red-900 mb-3" size={24} />
              <h4 className="font-semibold text-gray-900 mb-1">
                500+ Mahasiswa
              </h4>
              <p className="text-sm text-gray-600">Pengguna aktif sistem</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <UserCheck className="text-red-900 mb-3" size={24} />
              <h4 className="font-semibold text-gray-900 mb-1">50+ Dosen</h4>
              <p className="text-sm text-gray-600">Pembimbing terdaftar</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <CheckCircle className="text-red-900 mb-3" size={24} />
              <h4 className="font-semibold text-gray-900 mb-1">100% Digital</h4>
              <p className="text-sm text-gray-600">Proses paperless</p>
            </div>
          </div>
        </div>
      </div>

      <div id="intro-architecture" className="mb-16 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Layout className="mr-2.5 text-red-900" size={24} />
          Arsitektur Sistem
        </h2>
        <div className="prose prose-gray max-w-none">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
            <p className="text-gray-700 leading-relaxed mb-0">
              SITA-BI dibangun dengan arsitektur <strong>monorepo</strong>{' '}
              menggunakan <strong>Turborepo</strong> untuk manajemen
              multi-package yang efisien dan skalabel. Sistem ini terdiri dari
              dua aplikasi utama:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 my-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-bold text-red-900 mb-4 text-lg flex items-center">
                <Code className="mr-2" size={20} />
                Frontend (Web App)
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-900 mr-2 mt-0.5">→</span>
                  <span>
                    <strong>Next.js 15</strong> dengan App Router untuk routing
                    modern
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-900 mr-2 mt-0.5">→</span>
                  <span>
                    <strong>React 18</strong> dengan Server Components untuk
                    performance optimal
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-900 mr-2 mt-0.5">→</span>
                  <span>
                    <strong>TypeScript</strong> untuk type safety
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-900 mr-2 mt-0.5">→</span>
                  <span>
                    <strong>Tailwind CSS</strong> untuk styling yang responsive
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-bold text-red-900 mb-4 text-lg flex items-center">
                <Code className="mr-2" size={20} />
                Backend (API Server)
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-900 mr-2 mt-0.5">→</span>
                  <span>
                    <strong>Express.js</strong> framework untuk backend yang
                    efisien
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-900 mr-2 mt-0.5">→</span>
                  <span>
                    <strong>SQLite</strong> database untuk penyimpanan data
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-900 mr-2 mt-0.5">→</span>
                  <span>
                    <strong>Prisma ORM</strong> untuk database management
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-900 mr-2 mt-0.5">→</span>
                  <span>
                    <strong>Passport.js + JWT</strong> untuk autentikasi
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-3 text-base">
              Komunikasi Sistem
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed mb-0">
              Frontend dan backend berkomunikasi melalui{' '}
              <strong>RESTful API</strong> dengan format JSON. Sistem
              menggunakan <strong>HTTP-only cookies</strong> untuk session
              management dan <strong>Bearer token</strong> untuk autentikasi
              API requests. AI Chatbot (SitaBot) terintegrasi dengan{' '}
              <strong>Google Gemini API</strong> untuk memberikan respons
              cerdas kepada pengguna.
            </p>
          </div>
        </div>
      </div>

      <div id="intro-requirements" className="mb-16 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Settings className="mr-2.5 text-red-900" size={24} />
          Persyaratan Sistem
        </h2>
        <div className="prose prose-gray max-w-none">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
            <p className="text-gray-700 leading-relaxed mb-0">
              Untuk menggunakan SITA-BI dengan optimal, pastikan perangkat Anda
              memenuhi persyaratan berikut:
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-4">
            <h4 className="font-semibold text-gray-900 mb-4 text-base">
              Browser yang Didukung
            </h4>
            <ul className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
              <li className="flex items-center">
                <CheckCircle
                  className="mr-2.5 text-green-600 flex-shrink-0"
                  size={18}
                />
                <span>Google Chrome (versi 90+)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle
                  className="mr-2.5 text-green-600 flex-shrink-0"
                  size={18}
                />
                <span>Mozilla Firefox (versi 88+)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle
                  className="mr-2.5 text-green-600 flex-shrink-0"
                  size={18}
                />
                <span>Microsoft Edge (versi 90+)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle
                  className="mr-2.5 text-green-600 flex-shrink-0"
                  size={18}
                />
                <span>Safari (versi 14+)</span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-4 text-base">
              Spesifikasi Minimum
            </h4>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <CheckCircle
                  className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                  size={18}
                />
                <span>
                  <strong>Koneksi Internet:</strong> Minimum 1 Mbps (Disarankan
                  5 Mbps+)
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle
                  className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                  size={18}
                />
                <span>
                  <strong>Resolusi Layar:</strong> Minimum 1280x720 px
                  (Responsif untuk mobile)
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle
                  className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                  size={18}
                />
                <span>
                  <strong>JavaScript:</strong> Harus diaktifkan di browser
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle
                  className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                  size={18}
                />
                <span>
                  <strong>Cookies:</strong> Harus diizinkan untuk autentikasi
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
