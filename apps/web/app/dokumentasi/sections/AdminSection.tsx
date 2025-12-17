export default function AdminSection() {
  return (
    <section id="admin" className="mb-16 scroll-mt-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Panduan untuk Admin/Koordinator
      </h1>

      <div id="adm-users" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Manajemen User
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Admin memiliki akses penuh untuk mengelola seluruh user dalam
            sistem.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Fitur Manajemen User
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>
                • <strong>View All Users:</strong> Lihat daftar semua mahasiswa,
                dosen, dan admin
              </li>
              <li>
                • <strong>Create User:</strong> Tambah user baru dengan role
                tertentu
              </li>
              <li>
                • <strong>Edit User:</strong> Update informasi user (nama,
                email, role, dll)
              </li>
              <li>
                • <strong>Deactivate/Activate:</strong> Nonaktifkan atau
                aktifkan akun user
              </li>
              <li>
                • <strong>Reset Password:</strong> Reset password user yang lupa
              </li>
              <li>
                • <strong>Filter & Search:</strong> Cari user berdasarkan nama,
                NIM, role, dll
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div id="adm-jadwal" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Pengaturan Jadwal Sidang
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Sistem penjadwalan sidang otomatis dengan kemampuan manual override.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Penjadwalan Otomatis
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              Sistem akan otomatis mengatur jadwal dengan mempertimbangkan:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Ketersediaan dosen pembimbing dan penguji</li>
              <li>• Ketersediaan ruangan</li>
              <li>• Konflik jadwal mengajar dosen</li>
              <li>• Distribusi merata antar hari</li>
              <li>• Priority mahasiswa (by tanggal pengajuan)</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Manual Scheduling
            </h4>
            <ol className="text-sm text-gray-700 space-y-2">
              <li>1. Pilih mahasiswa yang siap sidang</li>
              <li>2. Tentukan tanggal dan waktu</li>
              <li>3. Assign dosen penguji (2-3 dosen)</li>
              <li>4. Pilih ruangan (fisik atau meeting room online)</li>
              <li>5. Konfirmasi dan kirim notifikasi ke semua pihak</li>
            </ol>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Reschedule & Cancel
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Reschedule ke tanggal/waktu lain</li>
              <li>• Ganti dosen penguji jika berhalangan</li>
              <li>• Ganti ruangan jika tidak tersedia</li>
              <li>• Cancel sidang dan buat jadwal baru</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="adm-pengumuman" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Kelola Pengumuman
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Buat dan kelola pengumuman untuk mahasiswa dan dosen.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-3">
                Buat Pengumuman
              </h4>
              <ol className="text-sm text-gray-700 space-y-2">
                <li>1. Klik "Buat Pengumuman Baru"</li>
                <li>2. Isi judul yang menarik perhatian</li>
                <li>3. Tulis konten lengkap (support rich text)</li>
                <li>4. Pilih kategori (Info, Urgent, Event, dll)</li>
                <li>5. Tentukan target audience (All, Mahasiswa, Dosen)</li>
                <li>6. Set tanggal publikasi dan expiry</li>
                <li>7. Publish atau Save as Draft</li>
              </ol>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-3">
                Fitur Pengumuman
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  • <strong>Priority Level:</strong> Normal, Important, Urgent
                </li>
                <li>
                  • <strong>Auto Notification:</strong> Email + In-app
                </li>
                <li>
                  • <strong>Attachments:</strong> Upload file pendukung
                </li>
                <li>
                  • <strong>Scheduled Publish:</strong> Terbitkan di waktu
                  tertentu
                </li>
                <li>
                  • <strong>Analytics:</strong> Lihat berapa yang sudah baca
                </li>
                <li>
                  • <strong>Edit/Delete:</strong> Update atau hapus pengumuman
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div id="adm-laporan" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Laporan & Analytics
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Generate berbagai laporan untuk monitoring dan evaluasi sistem.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Jenis Laporan</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {[
                {
                  title: '📊 Statistik Umum',
                  items: [
                    'Total mahasiswa aktif TA',
                    'Distribusi topik per dosen',
                    'Progress status mahasiswa',
                    'Tingkat kelulusan',
                  ],
                },
                {
                  title: '📈 Laporan Periode',
                  items: [
                    'Laporan bulanan/semester',
                    'Jumlah sidang per bulan',
                    'Rata-rata durasi pengerjaan TA',
                    'Dosen paling produktif',
                  ],
                },
                {
                  title: '📑 Export Data',
                  items: [
                    'Export ke Excel/CSV',
                    'Generate PDF report',
                    'Custom date range',
                    'Filter by prodi/angkatan',
                  ],
                },
                {
                  title: '🎯 KPI Monitoring',
                  items: [
                    'Rata-rata waktu approval',
                    'Response time dosen',
                    'Tingkat kepuasan mahasiswa',
                    'System uptime',
                  ],
                },
              ].map((section, i) => (
                <div key={i}>
                  <p className="font-medium text-gray-900 mb-2">
                    {section.title}
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    {section.items.map((item, j) => (
                      <li key={j}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
