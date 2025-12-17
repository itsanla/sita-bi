export default function DosenSection() {
  return (
    <section id="dosen" className="mb-16 scroll-mt-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Panduan untuk Dosen
      </h1>

      <div id="dsn-topik" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Kelola Tawaran Topik
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Sebagai dosen pembimbing, Anda dapat menawarkan topik tugas akhir
            untuk mahasiswa.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Membuat Tawaran Topik Baru
            </h4>
            <ol className="space-y-3 text-sm text-gray-700">
              <li>
                1. Dashboard Dosen → Menu "Tawaran Topik" → Tombol "Buat Topik
                Baru"
              </li>
              <li>
                2. Isi form: Judul topik, Deskripsi detail, Kategori/bidang,
                Persyaratan, Kuota mahasiswa, Teknologi/tools
              </li>
              <li>3. Klik "Publish" untuk mempublikasikan topik ke mahasiswa</li>
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-3">
                Edit/Hapus Topik
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Edit: Update informasi topik kapan saja</li>
                <li>• Tutup: Menutup pendaftaran lebih awal</li>
                <li>• Hapus: Menghapus topik yang belum ada pendaftar</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-3">
                Review Pendaftar
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Lihat profil dan transkrip mahasiswa</li>
                <li>• Approve atau reject pendaftaran</li>
                <li>• Berikan catatan/alasan reject</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div id="dsn-bimbingan" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Bimbingan Mahasiswa
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Kelola proses bimbingan mahasiswa bimbingan Anda secara efisien.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Dashboard Bimbingan
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <ul className="text-gray-600 space-y-1">
                <li>• Daftar mahasiswa bimbingan aktif</li>
                <li>• Status progress masing-masing mahasiswa</li>
                <li>• Jadwal konsultasi yang akan datang</li>
                <li>• Riwayat bimbingan</li>
              </ul>
              <ul className="text-gray-600 space-y-1">
                <li>• Dokumen yang di-upload mahasiswa</li>
                <li>• Request bimbingan baru (pending)</li>
                <li>• Catatan dan feedback</li>
                <li>• Target milestone</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Proses Bimbingan
            </h4>
            <div className="space-y-3 text-sm">
              {[
                {
                  title: 'Approve Jadwal Bimbingan',
                  desc: 'Review request bimbingan dari mahasiswa → Approve atau reschedule',
                },
                {
                  title: 'Conduct Bimbingan',
                  desc: 'Lakukan sesi konsultasi sesuai jadwal → Diskusikan progress dan hambatan',
                },
                {
                  title: 'Berikan Feedback',
                  desc: 'Catat hasil diskusi → Berikan feedback konstruktif → Tentukan target selanjutnya',
                },
                {
                  title: 'Review Dokumen',
                  desc: 'Download dan review dokumen yang di-upload → Berikan komentar dan revisi',
                },
                {
                  title: 'Update Status',
                  desc: 'Update progress status (Proposal, Pengerjaan, Testing, Finishing, Siap Sidang)',
                },
              ].map((step, i) => (
                <div key={i}>
                  <p className="font-medium text-gray-900 mb-1">
                    {i + 1}. {step.title}
                  </p>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="dsn-penilaian" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Penilaian Sidang
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Sistem penilaian sidang tugas akhir yang terstruktur dan transparan.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Komponen Penilaian
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">
                      Aspek
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">
                      Bobot
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    {
                      aspek: 'Presentasi',
                      bobot: '25%',
                      ket: 'Penyampaian, sistematika, penguasaan materi',
                    },
                    {
                      aspek: 'Laporan',
                      bobot: '30%',
                      ket: 'Kelengkapan, sistematika, tata bahasa',
                    },
                    {
                      aspek: 'Implementasi',
                      bobot: '30%',
                      ket: 'Fungsionalitas, kualitas code, kompleksitas',
                    },
                    {
                      aspek: 'Tanya Jawab',
                      bobot: '15%',
                      ket: 'Kemampuan menjawab, argumentasi, solusi',
                    },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-700">{row.aspek}</td>
                      <td className="px-4 py-2 text-gray-700">{row.bobot}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs">
                        {row.ket}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Input Nilai</h4>
            <ol className="text-sm text-gray-700 space-y-2">
              <li>1. Akses menu "Penilaian Sidang"</li>
              <li>2. Pilih mahasiswa yang baru saja sidang</li>
              <li>3. Input nilai untuk setiap komponen (0-100)</li>
              <li>4. Berikan catatan dan saran perbaikan</li>
              <li>5. Tentukan status: Lulus atau Lulus dengan Revisi</li>
              <li>6. Submit nilai (nilai final akan dihitung otomatis)</li>
            </ol>
          </div>
        </div>
      </div>

      <div id="dsn-approval" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Persetujuan</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Kelola berbagai persetujuan terkait tugas akhir mahasiswa bimbingan.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-3">
                Jenis Approval
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Approval proposal tugas akhir</li>
                <li>• Persetujuan judul final</li>
                <li>• Approval untuk sidang</li>
                <li>• Persetujuan revisi pasca sidang</li>
                <li>• Sign-off untuk kelulusan</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-3">
                Proses Approval
              </h4>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Notifikasi request approval</li>
                <li>2. Review dokumen mahasiswa</li>
                <li>3. Approve/Reject dengan catatan</li>
                <li>4. Mahasiswa mendapat notifikasi hasil</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
