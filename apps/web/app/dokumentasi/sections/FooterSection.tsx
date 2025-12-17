import Link from 'next/link';

export default function FooterSection() {
  return (
    <footer className="mt-20 pt-12 border-t border-gray-200">
      <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-2xl p-10 text-white text-center mb-8">
        <h3 className="text-3xl font-bold mb-3">Butuh Bantuan?</h3>
        <p className="mb-6 text-white/90 text-lg">
          SitaBot AI Assistant siap membantu Anda 24/7!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-block bg-white text-red-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/login"
            className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-red-900 transition-colors"
          >
            Login Sekarang
          </Link>
        </div>
      </div>

      <div className="text-center text-gray-600">
        <p className="mb-2">
          © 2024 SITA-BI - Sistem Informasi Tugas Akhir Bahasa Inggris
        </p>
        <p className="text-xs mt-4 text-gray-500">
          Version 1.0.0 | Last Updated: November 2024
        </p>
      </div>
    </footer>
  );
}
