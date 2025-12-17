import { CheckCircle } from 'lucide-react';

export default function MahasiswaSection() {
  return (
    <section id="mahasiswa" className="mb-16 scroll-mt-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Panduan untuk Mahasiswa
      </h1>

      <div id="mhs-topik" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Memilih Topik Tugas Akhir
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Salah satu fitur utama SITA-BI adalah sistem pemilihan topik tugas
            akhir yang transparan dan efisien.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Langkah-Langkah
            </h4>
            <div className="space-y-4">
              {[
                {
                  title: 'Akses Menu Tawaran Topik',
                  desc: 'Login → Klik "Tugas Akhir" di sidebar → Tab "Tawaran Topik"',
                },
                {
                  title: 'Browse Topik yang Tersedia',
                  desc: 'Lihat daftar topik dari berbagai dosen. Setiap topik menampilkan judul, deskripsi, nama dosen, kuota, persyaratan, dan status.',
                },
                {
                  title: 'Filter dan Search',
                  desc: 'Gunakan fitur filter berdasarkan kategori, dosen, atau keyword untuk menemukan topik yang sesuai minat',
                },
                {
                  title: 'Daftar Topik',
                  desc: 'Klik tombol "Daftar" pada topik pilihan → Lengkapi form pengajuan → Submit',
                },
                {
                  title: 'Tunggu Approval',
                  desc: 'Dosen akan mereview pengajuan. Status akan berubah menjadi "Disetujui" atau "Ditolak". Anda akan mendapat notifikasi email dan in-app.',
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-900 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm font-medium text-gray-900 mb-1">💡 Tips</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Baca deskripsi topik dengan teliti sebelum mendaftar</li>
              <li>• Konsultasi dengan senior atau dosen wali jika ragu</li>
              <li>
                • Daftar topik cadangan jika topik pertama tidak disetujui
              </li>
              <li>• Pertimbangkan ketersediaan waktu dosen pembimbing</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="mhs-bimbingan" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Sistem Bimbingan
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Setelah topik disetujui, Anda dapat memulai proses bimbingan dengan
            dosen pembimbing secara online.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-3">
                Jadwalkan Bimbingan
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                Buat jadwal konsultasi dengan dosen:
              </p>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Pilih tanggal dan jam yang tersedia</li>
                <li>2. Tentukan topik yang akan didiskusikan</li>
                <li>3. Upload dokumen/file pendukung (opsional)</li>
                <li>4. Submit dan tunggu konfirmasi dosen</li>
              </ol>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-3">
                Riwayat Bimbingan
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                Lihat catatan semua sesi bimbingan:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tanggal dan waktu bimbingan</li>
                <li>• Materi yang dibahas</li>
                <li>• Feedback dari dosen</li>
                <li>• File yang di-upload</li>
                <li>• Progress dan target selanjutnya</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Upload Dokumen
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              Anda dapat meng-upload berbagai dokumen untuk direview dosen:
              Proposal TA, BAB Laporan, Source Code, Testing Results, Presentasi
            </p>
            <p className="text-xs text-gray-500 mt-3">
              * Format: PDF, DOC, DOCX, PPT, PPTX, ZIP (Max: 10MB per file)
            </p>
          </div>
        </div>
      </div>

      <div id="mhs-sidang" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Jadwal Sidang
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Sistem akan secara otomatis mengatur jadwal sidang tugas akhir Anda
            setelah memenuhi persyaratan.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Informasi Jadwal Sidang
            </h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-1">📅 Detail Jadwal</p>
                <ul className="text-gray-600 space-y-1 ml-4">
                  <li>• Tanggal dan waktu sidang</li>
                  <li>• Ruangan (online/offline)</li>
                  <li>• Link meeting (jika online)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">👥 Tim Penguji</p>
                <ul className="text-gray-600 space-y-1 ml-4">
                  <li>• Dosen pembimbing</li>
                  <li>• Dosen penguji 1</li>
                  <li>• Dosen penguji 2</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Persiapan Sidang
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              {[
                'Upload dokumen final (laporan, source code, dll)',
                'Siapkan presentasi PowerPoint (15-20 menit)',
                'Test demo aplikasi/sistem yang dikembangkan',
                'Persiapan mental dan latihan presentasi',
                'Pastikan koneksi internet stabil (untuk sidang online)',
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle
                    className="mr-2 mt-0.5 text-green-600 flex-shrink-0"
                    size={16}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div id="mhs-pengumuman" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pengumuman</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Halaman pengumuman menampilkan informasi penting dari program studi
            dan dosen pembimbing.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-2">
                Jenis Pengumuman
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Jadwal pendaftaran TA</li>
                <li>• Deadline pengumpulan dokumen</li>
                <li>• Perubahan jadwal sidang</li>
                <li>• Seminar proposal/hasil</li>
                <li>• Informasi beasiswa/kompetisi</li>
                <li>• Pengumuman umum prodi</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-2">Notifikasi</h4>
              <p className="text-sm text-gray-600 mb-2">
                Anda akan menerima notifikasi melalui:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• In-App: Bell icon di header</li>
                <li>• Email: Ke alamat email terdaftar</li>
                <li>• Dashboard: Widget pengumuman terbaru</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
