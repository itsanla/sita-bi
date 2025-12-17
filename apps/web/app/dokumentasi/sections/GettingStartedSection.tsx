import { Home, Bell, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function GettingStartedSection() {
  return (
    <section id="getting-started" className="mb-20 scroll-mt-24">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10">
        Memulai dengan SITA-BI
      </h1>

      <div id="gs-registration" className="mb-16 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Registrasi Akun
        </h2>
        <div className="prose prose-gray max-w-none">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
            <p className="text-gray-700 leading-relaxed mb-0">
              Untuk menggunakan SITA-BI, Anda perlu membuat akun terlebih
              dahulu. Berikut langkah-langkahnya:
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
            {[
              {
                title: 'Akses Halaman Registrasi',
                desc: 'Buka halaman /register atau klik tombol "Daftar" di halaman login',
              },
              {
                title: 'Isi Form Registrasi',
                desc: 'Lengkapi: Nama Lengkap, Email institusi, NIM/NIP, Password (min 8 karakter), dan Role',
              },
              {
                title: 'Verifikasi Email/OTP',
                desc: 'Cek email untuk kode verifikasi OTP. Masukkan kode 6 digit yang diterima. Kode berlaku 10 menit.',
              },
              {
                title: 'Akun Aktif',
                desc: 'Setelah verifikasi berhasil, akun aktif dan siap digunakan. Silakan login.',
              },
            ].map((step, i) => (
              <div key={i} className="flex items-start">
                <div className="flex-shrink-0 w-7 h-7 bg-red-900 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r mt-6 shadow-sm">
            <div className="flex">
              <AlertCircle
                className="text-amber-500 mr-3 flex-shrink-0"
                size={20}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Penting!</p>
                <p className="text-sm text-gray-700 mt-1">
                  Pastikan email aktif. Cek folder spam jika tidak menemukan
                  email verifikasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="gs-login" className="mb-16 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Login & Autentikasi
        </h2>
        <div className="prose prose-gray max-w-none">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
            <p className="text-gray-700 leading-relaxed mb-0">
              Setelah akun terverifikasi, Anda dapat login ke sistem SITA-BI:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 text-base">
                Login Normal
              </h4>
              <ol className="text-sm text-gray-700 space-y-2.5">
                <li>1. Buka halaman login di /login</li>
                <li>2. Masukkan email dan password</li>
                <li>3. Klik tombol "Login"</li>
                <li>4. Sistem redirect ke dashboard</li>
              </ol>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 text-base">
                Lupa Password
              </h4>
              <ol className="text-sm text-gray-700 space-y-2.5">
                <li>1. Klik "Lupa Password?" di halaman login</li>
                <li>2. Masukkan email terdaftar</li>
                <li>3. Cek email untuk link reset password</li>
                <li>4. Buat password baru dan login kembali</li>
              </ol>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-4 text-base">
              Keamanan Akun
            </h4>
            <ul className="text-sm text-gray-700 space-y-3">
              {[
                'Session Management: Sesi login otomatis expire setelah 24 jam tidak aktif',
                'JWT Token: Sistem menggunakan JWT untuk autentikasi yang aman',
                'Password Encryption: Password di-hash dengan bcrypt sebelum disimpan',
                'Multi-Device: Anda bisa login di multiple device secara bersamaan',
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle
                    className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                    size={18}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div id="gs-dashboard" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Navigasi Dashboard
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Dashboard SITA-BI dirancang intuitif dan mudah digunakan. Berikut
            komponen utama dashboard:
          </p>

          <div className="grid gap-4">
            {[
              {
                icon: Home,
                title: 'Sidebar Navigation',
                desc: 'Menu navigasi di sisi kiri layar yang berisi semua fitur sesuai role: Dashboard, Tugas Akhir, Bimbingan, Jadwal Sidang, Pengumuman, Profile',
              },
              {
                icon: Bell,
                title: 'Notification Center',
                desc: 'Icon bell di header menampilkan notifikasi real-time untuk approval/reject, pengumuman baru, reminder jadwal, dan update status TA',
              },
              {
                icon: FileText,
                title: 'Content Area',
                desc: 'Area utama yang menampilkan konten halaman aktif. Setiap halaman memiliki breadcrumb navigation untuk memudahkan orientasi.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center mb-3">
                  <item.icon className="mr-3 text-red-900" size={24} />
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                </div>
                <p className="text-sm text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
