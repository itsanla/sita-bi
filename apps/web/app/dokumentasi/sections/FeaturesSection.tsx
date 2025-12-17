import { Code, Bell, FileText, Calendar } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section id="features" className="mb-16 scroll-mt-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Fitur & Modul Unggulan
      </h1>
      <div className="prose max-w-none">
        <p className="text-gray-700 leading-relaxed mb-6">
          SITA-BI dilengkapi dengan berbagai fitur modern untuk pengalaman
          pengguna yang optimal.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: Code,
              color: 'red',
              title: 'AI Chatbot (SitaBot)',
              desc: 'Asisten virtual berbasis Google Gemini AI yang siap membantu 24/7.',
              features: [
                'Menjawab pertanyaan seputar TA',
                'Panduan penggunaan sistem',
                'Informasi jadwal dan deadline',
                'Tips & best practices',
              ],
            },
            {
              icon: Bell,
              color: 'blue',
              title: 'Real-time Notifications',
              desc: 'Notifikasi instant melalui multiple channel.',
              features: [
                'In-app notifications',
                'Email notifications',
                'Push notifications (coming soon)',
                'SMS alerts untuk jadwal penting',
              ],
            },
            {
              icon: FileText,
              color: 'green',
              title: 'Document Management',
              desc: 'Kelola semua dokumen TA dalam satu tempat.',
              features: [
                'Upload & download dokumen',
                'Version control',
                'Preview online',
                'Secure cloud storage',
              ],
            },
            {
              icon: Calendar,
              color: 'purple',
              title: 'Smart Scheduling',
              desc: 'Penjadwalan cerdas dengan algoritma optimasi.',
              features: [
                'Auto scheduling sidang',
                'Conflict detection',
                'Calendar integration',
                'Reminder otomatis',
              ],
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br from-${feature.color}-50 to-white border border-${feature.color}-100 rounded-xl p-6`}
            >
              <div className="flex items-center mb-3">
                <div
                  className={`w-12 h-12 bg-${feature.color}-${feature.color === 'red' ? '900' : '600'} rounded-lg flex items-center justify-center mr-4`}
                >
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">{feature.desc}</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {feature.features.map((item, j) => (
                  <li key={j}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
