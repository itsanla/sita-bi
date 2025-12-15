'use client';

import { useState, useEffect } from 'react';
import {
  ChevronRight,
  Users,
  BookOpen,
  Layout,
  Shield,
  Zap,
  Code,
  Home,
  Settings,
  FileText,
  Calendar,
  Bell,
  GraduationCap,
  UserCheck,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  CodeXml,
} from 'lucide-react';
import Link from 'next/link';
import TeamMemberCard from '../components/landing-page/TeamMemberCard';
import HeaderWrapper from '../components/landing-page/HeaderWrapper';

// Data tim pengembang - Team 7 (Maret - Juli 2025)
const teamMembers = [
  {
    name: 'Erland Agsya Agustian',
    role: 'Frontend Developer',
    id: '2311083007',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYB48qcI4RmLRUfQqoGwJb6GIM7SqYE9rcBg&s',
  },
  {
    name: 'Nabil Achmad Khoir',
    role: 'Project Manager',
    id: '2311082032',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYB48qcI4RmLRUfQqoGwJb6GIM7SqYE9rcBg&s',
  },
  {
    name: 'Kasih Ananda Nardi',
    role: 'Sistem Analis',
    id: '2311081021',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYB48qcI4RmLRUfQqoGwJb6GIM7SqYE9rcBg&s',
  },
  {
    name: 'Gilang Dwi Yuwana',
    role: 'Backend Developer',
    id: '2311081016',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYB48qcI4RmLRUfQqoGwJb6GIM7SqYE9rcBg&s',
  },
];

// Next generation developer (Agustus - Desember 2025)
const nextGenDeveloper = {
  name: 'Anla Harpanda',
  role: 'Full-Stack Developer',
  id: '2311083015',
  image:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvPh9hd-Nonod-jOedev2EWsldcuYjabXayQ&s',
};

// Menu dokumentasi - Struktur hirarkis seperti NestJS
const menuItems = [
  {
    id: 'team',
    label: 'Tim Pengembang',
    icon: Users,
  },
  {
    id: 'introduction',
    label: 'Pengenalan',
    icon: BookOpen,
    children: [
      { id: 'intro-overview', label: 'Tentang SITA-BI' },
      { id: 'intro-architecture', label: 'Arsitektur Sistem' },
      { id: 'intro-requirements', label: 'Persyaratan Sistem' },
    ],
  },
  {
    id: 'getting-started',
    label: 'Memulai',
    icon: Home,
    children: [
      { id: 'gs-registration', label: 'Registrasi Akun' },
      { id: 'gs-login', label: 'Login & Autentikasi' },
      { id: 'gs-dashboard', label: 'Navigasi Dashboard' },
    ],
  },
  {
    id: 'mahasiswa',
    label: 'Panduan Mahasiswa',
    icon: GraduationCap,
    children: [
      { id: 'mhs-topik', label: 'Memilih Topik TA' },
      { id: 'mhs-bimbingan', label: 'Sistem Bimbingan' },
      { id: 'mhs-sidang', label: 'Jadwal Sidang' },
      { id: 'mhs-pengumuman', label: 'Pengumuman' },
    ],
  },
  {
    id: 'dosen',
    label: 'Panduan Dosen',
    icon: UserCheck,
    children: [
      { id: 'dsn-topik', label: 'Kelola Tawaran Topik' },
      { id: 'dsn-bimbingan', label: 'Bimbingan Mahasiswa' },
      { id: 'dsn-penilaian', label: 'Penilaian Sidang' },
      { id: 'dsn-approval', label: 'Persetujuan' },
    ],
  },
  {
    id: 'admin',
    label: 'Panduan Admin',
    icon: Shield,
    children: [
      { id: 'adm-users', label: 'Manajemen User' },
      { id: 'adm-jadwal', label: 'Pengaturan Jadwal' },
      { id: 'adm-pengumuman', label: 'Kelola Pengumuman' },
      { id: 'adm-laporan', label: 'Laporan Sistem' },
    ],
  },
  {
    id: 'features',
    label: 'Fitur & Modul',
    icon: Layout,
  },
  {
    id: 'technology',
    label: 'Teknologi',
    icon: Zap,
  },
];

export default function DocumentationContent() {
  const [activeSection, setActiveSection] = useState('team');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    'introduction',
    'getting-started',
  ]);
  const [roadmapAnimated, setRoadmapAnimated] = useState(false);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    setSidebarOpen(false);
  };

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Track scroll position for active section and roadmap animation
  useEffect(() => {
    const handleScroll = () => {
      const sections = menuItems.flatMap((item) => {
        if (item.children) {
          return [item.id, ...item.children.map((child) => child.id)];
        }
        return [item.id];
      });

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }

      // Trigger roadmap animation when scrolled to team section
      const roadmapLine = document.querySelector('.roadmap-line-container');
      if (roadmapLine) {
        const rect = roadmapLine.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top <= windowHeight * 0.75 && !roadmapAnimated) {
          roadmapLine.classList.add('animate');
          setRoadmapAnimated(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, [roadmapAnimated]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Using same component as landing page */}
      <HeaderWrapper
        mode="static"
        activePage="docs"
        scrollToSection={() => {}}
      />

      <div className="flex pt-20">
        {/* Sidebar - Fixed position like Tailwind docs */}
        <aside
          className={`
            fixed top-20 left-0 bottom-0 z-40
            w-64 bg-white border-r border-gray-200 overflow-y-auto
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#7f1d1d #f9fafb',
          }}
        >
          <nav className="px-4 py-8 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus.includes(item.id);

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        toggleMenu(item.id);
                      } else {
                        scrollToSection(item.id);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-md
                      transition-all duration-150 text-left text-sm font-medium
                      ${
                        isActive
                          ? 'bg-red-50 text-red-900 border-l-2 border-red-900'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        size={16}
                        className={isActive ? 'text-red-900' : 'text-gray-400'}
                      />
                      <span>{item.label}</span>
                    </div>
                    {!!hasChildren && (
                      <ChevronRight
                        size={14}
                        className={`transition-transform text-gray-400 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    )}
                  </button>

                  {hasChildren && isExpanded ? (
                    <div className="ml-6 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                      {item.children?.map((child) => {
                        const isChildActive = activeSection === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => scrollToSection(child.id)}
                            className={`
                              w-full text-left px-3 py-1.5 rounded-md text-sm
                              transition-all duration-150
                              ${
                                isChildActive
                                  ? 'text-red-900 font-medium bg-red-50'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }
                            `}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Overlay untuk mobile */}
        {sidebarOpen ? (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
            {/* Pengembang Section - Development Roadmap */}
            <section id="team" className="mb-20 scroll-mt-24">
              <div className="mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                  Pengembang
                </h1>
                <p className="text-lg text-gray-600 flex items-center">
                  <CodeXml className="mr-2 text-red-900" size={22} />
                  Evolusi tim pengembang sistem SITA-BI
                </p>
              </div>

              {/* Team 7 PBL 2025 - Maret - Juli 2025 */}
              <div className="mb-12">
                <div className="flex items-center justify-center mb-6">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-900 text-white text-sm font-medium shadow-sm">
                    <CalendarDays size={16} />
                    <span>Maret - Juli 2025</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1 text-center">
                    Team 7 PBL 2025
                  </h3>
                  <p className="text-center text-gray-600 mb-8 text-sm">
                    Tim foundational yang membangun SITA-BI
                  </p>

                  {/* 4 cards in 1 row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {teamMembers.map((member, idx) => (
                      <TeamMemberCard
                        key={member.id}
                        member={member}
                        index={idx}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Animated Connecting Line/Arrow - Simple style */}
              <div className="flex justify-center mb-12 roadmap-line-container">
                <div className="flex flex-col items-center relative">
                  <div className="w-px h-16 bg-gray-300 relative overflow-hidden">
                    <div className="roadmap-line-animated absolute top-0 left-0 w-full h-0 bg-red-900"></div>
                  </div>
                  <div className="w-3 h-3 bg-red-900 rounded-full"></div>
                  <div className="w-px h-16 bg-gray-300 relative overflow-hidden">
                    <div className="roadmap-line-animated absolute top-0 left-0 w-full h-0 bg-red-900"></div>
                  </div>
                </div>
              </div>

              {/* Project IT 2025 - Agustus - Desember 2025 */}
              <div>
                <div className="flex items-center justify-center mb-6">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-900 text-white text-sm font-medium shadow-sm">
                    <CalendarDays size={16} />
                    <span>Agustus - Desember 2025</span>
                  </div>
                </div>

                <div className="max-w-sm mx-auto bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1 text-center">
                    Project IT 2025
                  </h3>
                  <p className="text-center text-gray-600 mb-8 text-sm">
                    Evolusi dan enhancement sistem
                  </p>

                  <div className="grid grid-cols-1 gap-6">
                    <TeamMemberCard member={nextGenDeveloper} index={0} />
                  </div>
                </div>
              </div>
            </section>

            <style
              dangerouslySetInnerHTML={{
                __html: `
              .roadmap-line-animated {
                animation: expandLine 0.8s ease-in-out forwards;
                animation-play-state: paused;
              }

              .roadmap-line-container.animate .roadmap-line-animated {
                animation-play-state: running;
              }

              @keyframes expandLine {
                from {
                  height: 0%;
                }
                to {
                  height: 100%;
                }
              }
            `,
              }}
            />

            {/* Introduction Section */}
            <section id="introduction" className="mb-20 scroll-mt-24">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10">
                Pengenalan
              </h1>

              {/* Tentang SITA-BI */}
              <div id="intro-overview" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="mr-2.5 text-red-900" size={24} />
                  Tentang SITA-BI
                </h2>
                <div className="prose prose-gray max-w-none">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      <strong className="text-red-900">SITA-BI</strong> (Sistem
                      Informasi Tugas Akhir - Business Intelligence) adalah
                      platform digital komprehensif yang dirancang khusus untuk
                      mengelola seluruh siklus proses tugas akhir mahasiswa
                      secara terintegrasi, efisien, dan terorganisir dengan
                      baik.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-0">
                      Sistem ini menghubungkan tiga stakeholder utama:{' '}
                      <strong>mahasiswa</strong>,
                      <strong> dosen pembimbing</strong>, dan{' '}
                      <strong>administrator/koordinator program studi</strong>{' '}
                      dalam satu ekosistem digital yang mudah diakses,
                      user-friendly, dan dapat digunakan kapan saja, di mana
                      saja.
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
                          Mempermudah koordinasi antara mahasiswa dan dosen
                          pembimbing
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-900 mr-2">•</span>
                        <span>
                          Meningkatkan transparansi proses tugas akhir
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-900 mr-2">•</span>
                        <span>
                          Mempercepat proses administrasi dan approval
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-900 mr-2">•</span>
                        <span>
                          Mengurangi penggunaan dokumen fisik (paperless)
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-900 mr-2">•</span>
                        <span>
                          Menyediakan tracking progress tugas akhir secara
                          real-time
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
                      <p className="text-sm text-gray-600">
                        Pengguna aktif sistem
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                      <UserCheck className="text-red-900 mb-3" size={24} />
                      <h4 className="font-semibold text-gray-900 mb-1">
                        50+ Dosen
                      </h4>
                      <p className="text-sm text-gray-600">
                        Pembimbing terdaftar
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                      <CheckCircle className="text-red-900 mb-3" size={24} />
                      <h4 className="font-semibold text-gray-900 mb-1">
                        100% Digital
                      </h4>
                      <p className="text-sm text-gray-600">Proses paperless</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arsitektur Sistem */}
              <div id="intro-architecture" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Layout className="mr-2.5 text-red-900" size={24} />
                  Arsitektur Sistem
                </h2>
                <div className="prose prose-gray max-w-none">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
                    <p className="text-gray-700 leading-relaxed mb-0">
                      SITA-BI dibangun dengan arsitektur{' '}
                      <strong>monorepo</strong> menggunakan{' '}
                      <strong>Turborepo</strong>
                      untuk manajemen multi-package yang efisien dan skalabel.
                      Sistem ini terdiri dari dua aplikasi utama:
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
                            <strong>Next.js 15</strong> dengan App Router untuk
                            routing modern
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-red-900 mr-2 mt-0.5">→</span>
                          <span>
                            <strong>React 18</strong> dengan Server Components
                            untuk performance optimal
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
                            <strong>Tailwind CSS</strong> untuk styling yang
                            responsive
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
                            <strong>Express.js</strong> framework untuk backend
                            yang efisien
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-red-900 mr-2 mt-0.5">→</span>
                          <span>
                            <strong>SQLite</strong> database untuk penyimpanan
                            data
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-red-900 mr-2 mt-0.5">→</span>
                          <span>
                            <strong>Prisma ORM</strong> untuk database
                            management
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
                      menggunakan <strong>HTTP-only cookies</strong> untuk
                      session management dan
                      <strong> Bearer token</strong> untuk autentikasi API
                      requests. AI Chatbot (SitaBot) terintegrasi dengan{' '}
                      <strong>Google Gemini API</strong> untuk memberikan
                      respons cerdas kepada pengguna.
                    </p>
                  </div>
                </div>
              </div>

              {/* Persyaratan Sistem */}
              <div id="intro-requirements" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Settings className="mr-2.5 text-red-900" size={24} />
                  Persyaratan Sistem
                </h2>
                <div className="prose prose-gray max-w-none">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
                    <p className="text-gray-700 leading-relaxed mb-0">
                      Untuk menggunakan SITA-BI dengan optimal, pastikan
                      perangkat Anda memenuhi persyaratan berikut:
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
                          <strong>Koneksi Internet:</strong> Minimum 1 Mbps
                          (Disarankan 5 Mbps+)
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
                          <strong>JavaScript:</strong> Harus diaktifkan di
                          browser
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                          size={18}
                        />
                        <span>
                          <strong>Cookies:</strong> Harus diizinkan untuk
                          autentikasi
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Getting Started Section */}
            <section id="getting-started" className="mb-20 scroll-mt-24">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10">
                Memulai dengan SITA-BI
              </h1>

              {/* Registrasi */}
              <div id="gs-registration" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Registrasi Akun
                </h2>
                <div className="prose prose-gray max-w-none">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
                    <p className="text-gray-700 leading-relaxed mb-0">
                      Untuk menggunakan SITA-BI, Anda perlu membuat akun
                      terlebih dahulu. Berikut langkah-langkahnya:
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-red-900 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4 mt-0.5">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">
                          Akses Halaman Registrasi
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Buka halaman{' '}
                          <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                            /register
                          </code>{' '}
                          atau klik tombol
                          <strong> &quot;Daftar&quot;</strong> di halaman login
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-red-900 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4 mt-0.5">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">
                          Isi Form Registrasi
                        </h4>
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                          Lengkapi informasi berikut dengan benar:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1.5 ml-1">
                          <li className="flex items-start">
                            <span className="text-red-900 mr-2">•</span>
                            <span>
                              <strong>Nama Lengkap:</strong> Sesuai identitas
                              resmi
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-red-900 mr-2">•</span>
                            <span>
                              <strong>Email:</strong> Gunakan email institusi
                              (@student.edu atau @staff.edu)
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-red-900 mr-2">•</span>
                            <span>
                              <strong>NIM/NIP:</strong> Nomor induk mahasiswa
                              atau pegawai
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-red-900 mr-2">•</span>
                            <span>
                              <strong>Password:</strong> Minimal 8 karakter,
                              kombinasi huruf dan angka
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-red-900 mr-2">•</span>
                            <span>
                              <strong>Role:</strong> Pilih Mahasiswa/Dosen/Admin
                              sesuai status Anda
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-red-900 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4 mt-0.5">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">
                          Verifikasi Email/OTP
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Cek email Anda untuk kode verifikasi OTP. Masukkan
                          kode 6 digit yang diterima untuk mengaktifkan akun
                          Anda. Kode berlaku selama 10 menit.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-red-900 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4 mt-0.5">
                        4
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">
                          Akun Aktif
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Setelah verifikasi berhasil, akun Anda aktif dan siap
                          digunakan. Silakan login dengan email dan password
                          yang telah didaftarkan.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r mt-6 shadow-sm">
                    <div className="flex">
                      <AlertCircle
                        className="text-amber-500 mr-3 flex-shrink-0"
                        size={20}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Penting!
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          Pastikan email yang digunakan aktif dan dapat menerima
                          email. Cek folder spam jika tidak menemukan email
                          verifikasi di inbox.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login */}
              <div id="gs-login" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Login & Autentikasi
                </h2>
                <div className="prose prose-gray max-w-none">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
                    <p className="text-gray-700 leading-relaxed mb-0">
                      Setelah akun terverifikasi, Anda dapat login ke sistem
                      SITA-BI:
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-4 text-base">
                        Login Normal
                      </h4>
                      <ol className="text-sm text-gray-700 space-y-2.5">
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-red-900">
                            1.
                          </span>
                          <span>
                            Buka halaman login di{' '}
                            <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                              /login
                            </code>
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-red-900">
                            2.
                          </span>
                          <span>Masukkan email dan password Anda</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-red-900">
                            3.
                          </span>
                          <span>
                            Klik tombol <strong>&quot;Login&quot;</strong>
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-red-900">
                            4.
                          </span>
                          <span>Sistem akan redirect ke dashboard</span>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-4 text-base">
                        Lupa Password
                      </h4>
                      <ol className="text-sm text-gray-700 space-y-2.5">
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-red-900">
                            1.
                          </span>
                          <span>
                            Klik <strong>&quot;Lupa Password?&quot;</strong> di
                            halaman login
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-red-900">
                            2.
                          </span>
                          <span>Masukkan email terdaftar</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-red-900">
                            3.
                          </span>
                          <span>Cek email untuk link reset password</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-red-900">
                            4.
                          </span>
                          <span>Buat password baru dan login kembali</span>
                        </li>
                      </ol>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 text-base">
                      Keamanan Akun
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-3">
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                          size={18}
                        />
                        <span>
                          <strong>Session Management:</strong> Sesi login
                          otomatis expire setelah 24 jam tidak aktif
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                          size={18}
                        />
                        <span>
                          <strong>JWT Token:</strong> Sistem menggunakan JWT
                          untuk autentikasi yang aman
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                          size={18}
                        />
                        <span>
                          <strong>Password Encryption:</strong> Password di-hash
                          dengan bcrypt sebelum disimpan
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2.5 mt-0.5 text-green-600 flex-shrink-0"
                          size={18}
                        />
                        <span>
                          <strong>Multi-Device:</strong> Anda bisa login di
                          multiple device secara bersamaan
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Dashboard Navigation */}
              <div id="gs-dashboard" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Navigasi Dashboard
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Dashboard SITA-BI dirancang intuitif dan mudah digunakan.
                    Berikut komponen utama dashboard:
                  </p>

                  <div className="grid gap-4 mb-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center mb-3">
                        <Home className="mr-3 text-red-900" size={24} />
                        <h4 className="font-semibold text-gray-900">
                          Sidebar Navigation
                        </h4>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        Menu navigasi di sisi kiri layar yang berisi semua fitur
                        yang dapat Anda akses sesuai role:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>
                          • <strong>Dashboard:</strong> Ringkasan informasi dan
                          statistik
                        </li>
                        <li>
                          • <strong>Tugas Akhir:</strong> Manajemen topik dan
                          progress TA
                        </li>
                        <li>
                          • <strong>Bimbingan:</strong> Konsultasi dengan dosen
                        </li>
                        <li>
                          • <strong>Jadwal Sidang:</strong> Lihat dan kelola
                          jadwal
                        </li>
                        <li>
                          • <strong>Pengumuman:</strong> Informasi dan
                          notifikasi
                        </li>
                        <li>
                          • <strong>Profile:</strong> Kelola data pribadi
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center mb-3">
                        <Bell className="mr-3 text-red-900" size={24} />
                        <h4 className="font-semibold text-gray-900">
                          Notification Center
                        </h4>
                      </div>
                      <p className="text-sm text-gray-700">
                        Icon bell di header menampilkan notifikasi real-time
                        untuk:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4 mt-2">
                        <li>• Approval atau reject dari dosen</li>
                        <li>• Pengumuman baru dari admin</li>
                        <li>• Reminder jadwal sidang</li>
                        <li>• Update status tugas akhir</li>
                      </ul>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center mb-3">
                        <FileText className="mr-3 text-red-900" size={24} />
                        <h4 className="font-semibold text-gray-900">
                          Content Area
                        </h4>
                      </div>
                      <p className="text-sm text-gray-700">
                        Area utama yang menampilkan konten halaman yang sedang
                        aktif. Setiap halaman memiliki breadcrumb navigation di
                        bagian atas untuk memudahkan orientasi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Mahasiswa Section */}
            <section id="mahasiswa" className="mb-16 scroll-mt-24">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Panduan untuk Mahasiswa
              </h1>

              {/* Memilih Topik */}
              <div id="mhs-topik" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Memilih Topik Tugas Akhir
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Salah satu fitur utama SITA-BI adalah sistem pemilihan topik
                    tugas akhir yang transparan dan efisien.
                  </p>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Langkah-Langkah
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-900 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                          1
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Akses Menu Tawaran Topik
                          </p>
                          <p className="text-sm text-gray-600">
                            Login ke dashboard → Klik{' '}
                            <strong>&quot;Tugas Akhir&quot;</strong> di sidebar
                            → Tab <strong>&quot;Tawaran Topik&quot;</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-900 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                          2
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Browse Topik yang Tersedia
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            Lihat daftar topik dari berbagai dosen. Setiap topik
                            menampilkan:
                          </p>
                          <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• Judul dan deskripsi topik</li>
                            <li>• Nama dosen pembimbing</li>
                            <li>• Kuota tersedia</li>
                            <li>• Persyaratan (jika ada)</li>
                            <li>• Status (Tersedia/Penuh)</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-900 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                          3
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Filter dan Search
                          </p>
                          <p className="text-sm text-gray-600">
                            Gunakan fitur filter berdasarkan kategori, dosen,
                            atau keyword untuk menemukan topik yang sesuai minat
                            Anda
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-900 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                          4
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Daftar Topik
                          </p>
                          <p className="text-sm text-gray-600">
                            Klik tombol <strong>&quot;Daftar&quot;</strong> pada
                            topik pilihan → Lengkapi form pengajuan → Submit
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-900 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                          5
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Tunggu Approval
                          </p>
                          <p className="text-sm text-gray-600">
                            Dosen akan mereview pengajuan Anda. Status akan
                            berubah menjadi
                            <strong> &quot;Disetujui&quot;</strong> atau{' '}
                            <strong>&quot;Ditolak&quot;</strong>. Anda akan
                            mendapat notifikasi email dan in-app.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      💡 Tips
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>
                        • Baca deskripsi topik dengan teliti sebelum mendaftar
                      </li>
                      <li>
                        • Konsultasi dengan senior atau dosen wali jika ragu
                      </li>
                      <li>
                        • Daftar topik cadangan jika topik pertama tidak
                        disetujui
                      </li>
                      <li>
                        • Pertimbangkan ketersediaan waktu dosen pembimbing
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sistem Bimbingan */}
              <div id="mhs-bimbingan" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Sistem Bimbingan
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Setelah topik disetujui, Anda dapat memulai proses bimbingan
                    dengan dosen pembimbing secara online.
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
                      Anda dapat meng-upload berbagai dokumen untuk direview
                      dosen:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • <strong>Proposal TA:</strong> Draft proposal untuk
                        direview
                      </li>
                      <li>
                        • <strong>BAB Laporan:</strong> Progress penulisan per
                        bab
                      </li>
                      <li>
                        • <strong>Source Code:</strong> Implementasi
                        aplikasi/sistem
                      </li>
                      <li>
                        • <strong>Testing Results:</strong> Hasil uji
                        coba/testing
                      </li>
                      <li>
                        • <strong>Presentasi:</strong> Slide untuk persiapan
                        sidang
                      </li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">
                      * Format yang didukung: PDF, DOC, DOCX, PPT, PPTX, ZIP
                      (Max: 10MB per file)
                    </p>
                  </div>
                </div>
              </div>

              {/* Jadwal Sidang */}
              <div id="mhs-sidang" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Jadwal Sidang
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Sistem akan secara otomatis mengatur jadwal sidang tugas
                    akhir Anda setelah memenuhi persyaratan.
                  </p>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Informasi Jadwal Sidang
                    </h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Di halaman Jadwal Sidang, Anda dapat melihat:
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 mb-1">
                          📅 Detail Jadwal
                        </p>
                        <ul className="text-gray-600 space-y-1 ml-4">
                          <li>• Tanggal dan waktu sidang</li>
                          <li>• Ruangan (online/offline)</li>
                          <li>• Link meeting (jika online)</li>
                        </ul>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 mb-1">
                          👥 Tim Penguji
                        </p>
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
                    <p className="text-sm text-gray-700 mb-3">
                      Pastikan Anda mempersiapkan hal-hal berikut sebelum
                      sidang:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2 mt-0.5 text-green-600 flex-shrink-0"
                          size={16}
                        />
                        <span>
                          Upload dokumen final (laporan, source code, dll)
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2 mt-0.5 text-green-600 flex-shrink-0"
                          size={16}
                        />
                        <span>Siapkan presentasi PowerPoint (15-20 menit)</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2 mt-0.5 text-green-600 flex-shrink-0"
                          size={16}
                        />
                        <span>Test demo aplikasi/sistem yang dikembangkan</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2 mt-0.5 text-green-600 flex-shrink-0"
                          size={16}
                        />
                        <span>Persiapan mental dan latihan presentasi</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle
                          className="mr-2 mt-0.5 text-green-600 flex-shrink-0"
                          size={16}
                        />
                        <span>
                          Pastikan koneksi internet stabil (untuk sidang online)
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      ⚠️ Penting
                    </p>
                    <p className="text-sm text-gray-700">
                      Hadir <strong>15 menit lebih awal</strong> dari jadwal.
                      Keterlambatan dapat menyebabkan pembatalan sidang dan
                      perlu reschedule.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pengumuman */}
              <div id="mhs-pengumuman" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Pengumuman
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Halaman pengumuman menampilkan informasi penting dari
                    program studi dan dosen pembimbing.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <Bell className="text-red-900 mb-3" size={24} />
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
                      <AlertCircle className="text-red-900 mb-3" size={24} />
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Notifikasi
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Anda akan menerima notifikasi melalui:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>
                          • <strong>In-App:</strong> Bell icon di header
                        </li>
                        <li>
                          • <strong>Email:</strong> Ke alamat email terdaftar
                        </li>
                        <li>
                          • <strong>Dashboard:</strong> Widget pengumuman
                          terbaru
                        </li>
                      </ul>
                      <p className="text-xs text-gray-500 mt-3">
                        * Pastikan notifikasi email aktif di settings profile
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Dosen Section */}
            <section id="dosen" className="mb-16 scroll-mt-24">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Panduan untuk Dosen
              </h1>

              {/* Kelola Tawaran Topik */}
              <div id="dsn-topik" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Kelola Tawaran Topik
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Sebagai dosen pembimbing, Anda dapat menawarkan topik tugas
                    akhir untuk mahasiswa.
                  </p>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Membuat Tawaran Topik Baru
                    </h4>
                    <ol className="space-y-3 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="font-bold mr-2">1.</span>
                        <span>
                          Dashboard Dosen → Menu{' '}
                          <strong>&quot;Tawaran Topik&quot;</strong> → Tombol{' '}
                          <strong>&quot;Buat Topik Baru&quot;</strong>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">2.</span>
                        <div>
                          <span>Isi form dengan informasi lengkap:</span>
                          <ul className="mt-2 ml-6 space-y-1 text-gray-600">
                            <li>• Judul topik yang jelas dan spesifik</li>
                            <li>
                              • Deskripsi detail (latar belakang, tujuan, scope)
                            </li>
                            <li>
                              • Kategori/bidang (Web Dev, Mobile, AI/ML, IoT,
                              dll)
                            </li>
                            <li>• Persyaratan mahasiswa (jika ada)</li>
                            <li>• Kuota mahasiswa (default: 1)</li>
                            <li>• Teknologi/tools yang akan digunakan</li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">3.</span>
                        <span>
                          Klik <strong>&quot;Publish&quot;</strong> untuk
                          mempublikasikan topik ke mahasiswa
                        </span>
                      </li>
                    </ol>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Edit/Hapus Topik
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Anda dapat mengedit atau menghapus topik yang belum
                        diambil mahasiswa:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Edit: Update informasi topik kapan saja</li>
                        <li>• Tutup: Menutup pendaftaran lebih awal</li>
                        <li>
                          • Hapus: Menghapus topik yang belum ada pendaftar
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Review Pendaftar
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Kelola mahasiswa yang mendaftar topik Anda:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Lihat profil dan transkrip mahasiswa</li>
                        <li>• Approve atau reject pendaftaran</li>
                        <li>• Berikan catatan/alasan reject</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bimbingan Mahasiswa */}
              <div id="dsn-bimbingan" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Bimbingan Mahasiswa
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Kelola proses bimbingan mahasiswa bimbingan Anda secara
                    efisien.
                  </p>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Dashboard Bimbingan
                    </h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Halaman bimbingan menampilkan:
                    </p>
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

                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Proses Bimbingan
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          1. Approve Jadwal Bimbingan
                        </p>
                        <p className="text-gray-600">
                          Review request bimbingan dari mahasiswa → Approve atau
                          reschedule jika tidak sesuai
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          2. Conduct Bimbingan
                        </p>
                        <p className="text-gray-600">
                          Lakukan sesi konsultasi sesuai jadwal → Diskusikan
                          progress dan hambatan
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          3. Berikan Feedback
                        </p>
                        <p className="text-gray-600">
                          Catat hasil diskusi → Berikan feedback konstruktif →
                          Tentukan target selanjutnya
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          4. Review Dokumen
                        </p>
                        <p className="text-gray-600">
                          Download dan review dokumen yang di-upload → Berikan
                          komentar dan revisi
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          5. Update Status
                        </p>
                        <p className="text-gray-600">
                          Update progress status (Proposal, Pengerjaan, Testing,
                          Finishing, Siap Sidang)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Penilaian Sidang */}
              <div id="dsn-penilaian" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Penilaian Sidang
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Sistem penilaian sidang tugas akhir yang terstruktur dan
                    transparan.
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
                          <tr>
                            <td className="px-4 py-2 text-gray-700">
                              Presentasi
                            </td>
                            <td className="px-4 py-2 text-gray-700">25%</td>
                            <td className="px-4 py-2 text-gray-600 text-xs">
                              Penyampaian, sistematika, penguasaan materi
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-gray-700">Laporan</td>
                            <td className="px-4 py-2 text-gray-700">30%</td>
                            <td className="px-4 py-2 text-gray-600 text-xs">
                              Kelengkapan, sistematika, tata bahasa
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-gray-700">
                              Implementasi
                            </td>
                            <td className="px-4 py-2 text-gray-700">30%</td>
                            <td className="px-4 py-2 text-gray-600 text-xs">
                              Fungsionalitas, kualitas code, kompleksitas
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-gray-700">
                              Tanya Jawab
                            </td>
                            <td className="px-4 py-2 text-gray-700">15%</td>
                            <td className="px-4 py-2 text-gray-600 text-xs">
                              Kemampuan menjawab, argumentasi, solusi
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Input Nilai
                    </h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Setelah sidang selesai:
                    </p>
                    <ol className="text-sm text-gray-700 space-y-2">
                      <li>
                        1. Akses menu{' '}
                        <strong>&quot;Penilaian Sidang&quot;</strong>
                      </li>
                      <li>2. Pilih mahasiswa yang baru saja sidang</li>
                      <li>3. Input nilai untuk setiap komponen (0-100)</li>
                      <li>4. Berikan catatan dan saran perbaikan</li>
                      <li>
                        5. Tentukan status: <strong>Lulus</strong> atau{' '}
                        <strong>Lulus dengan Revisi</strong>
                      </li>
                      <li>
                        6. Submit nilai (nilai final akan dihitung otomatis)
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Persetujuan */}
              <div id="dsn-approval" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Persetujuan
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Kelola berbagai persetujuan terkait tugas akhir mahasiswa
                    bimbingan.
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

            {/* Admin Section */}
            <section id="admin" className="mb-16 scroll-mt-24">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Panduan untuk Admin/Koordinator
              </h1>

              {/* Manajemen User */}
              <div id="adm-users" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Manajemen User
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Admin memiliki akses penuh untuk mengelola seluruh user
                    dalam sistem.
                  </p>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Fitur Manajemen User
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>
                        • <strong>View All Users:</strong> Lihat daftar semua
                        mahasiswa, dosen, dan admin
                      </li>
                      <li>
                        • <strong>Create User:</strong> Tambah user baru dengan
                        role tertentu
                      </li>
                      <li>
                        • <strong>Edit User:</strong> Update informasi user
                        (nama, email, role, dll)
                      </li>
                      <li>
                        • <strong>Deactivate/Activate:</strong> Nonaktifkan atau
                        aktifkan akun user
                      </li>
                      <li>
                        • <strong>Reset Password:</strong> Reset password user
                        yang lupa
                      </li>
                      <li>
                        • <strong>Filter & Search:</strong> Cari user
                        berdasarkan nama, NIM, role, dll
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      💡 Best Practice
                    </p>
                    <p className="text-sm text-gray-700">
                      Lakukan backup data user secara berkala. Jangan hapus user
                      yang masih memiliki tugas akhir aktif untuk menjaga
                      integritas data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pengaturan Jadwal */}
              <div id="adm-jadwal" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Pengaturan Jadwal Sidang
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Sistem penjadwalan sidang otomatis dengan kemampuan manual
                    override.
                  </p>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Penjadwalan Otomatis
                    </h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Sistem akan otomatis mengatur jadwal dengan
                      mempertimbangkan:
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
                    <p className="text-sm text-gray-700 mb-3">
                      Admin dapat melakukan penjadwalan manual:
                    </p>
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
                    <p className="text-sm text-gray-700 mb-2">
                      Jika ada perubahan, admin dapat:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Reschedule ke tanggal/waktu lain</li>
                      <li>• Ganti dosen penguji jika berhalangan</li>
                      <li>• Ganti ruangan jika tidak tersedia</li>
                      <li>• Cancel sidang dan buat jadwal baru</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      * Semua perubahan akan otomatis mengirim notifikasi ke
                      pihak terkait
                    </p>
                  </div>
                </div>
              </div>

              {/* Kelola Pengumuman */}
              <div id="adm-pengumuman" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Kelola Pengumuman
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Buat dan kelola pengumuman untuk mahasiswa dan dosen.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Buat Pengumuman
                      </h4>
                      <ol className="text-sm text-gray-700 space-y-2">
                        <li>
                          1. Klik{' '}
                          <strong>&quot;Buat Pengumuman Baru&quot;</strong>
                        </li>
                        <li>2. Isi judul yang menarik perhatian</li>
                        <li>3. Tulis konten lengkap (support rich text)</li>
                        <li>4. Pilih kategori (Info, Urgent, Event, dll)</li>
                        <li>
                          5. Tentukan target audience (All, Mahasiswa, Dosen)
                        </li>
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
                          • <strong>Priority Level:</strong> Normal, Important,
                          Urgent
                        </li>
                        <li>
                          • <strong>Auto Notification:</strong> Email + In-app
                        </li>
                        <li>
                          • <strong>Attachments:</strong> Upload file pendukung
                        </li>
                        <li>
                          • <strong>Scheduled Publish:</strong> Terbitkan di
                          waktu tertentu
                        </li>
                        <li>
                          • <strong>Analytics:</strong> Lihat berapa yang sudah
                          baca
                        </li>
                        <li>
                          • <strong>Edit/Delete:</strong> Update atau hapus
                          pengumuman
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Laporan Sistem */}
              <div id="adm-laporan" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Laporan & Analytics
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Generate berbagai laporan untuk monitoring dan evaluasi
                    sistem.
                  </p>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Jenis Laporan
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900 mb-2">
                          📊 Statistik Umum
                        </p>
                        <ul className="text-gray-600 space-y-1">
                          <li>• Total mahasiswa aktif TA</li>
                          <li>• Distribusi topik per dosen</li>
                          <li>• Progress status mahasiswa</li>
                          <li>• Tingkat kelulusan</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-2">
                          📈 Laporan Periode
                        </p>
                        <ul className="text-gray-600 space-y-1">
                          <li>• Laporan bulanan/semester</li>
                          <li>• Jumlah sidang per bulan</li>
                          <li>• Rata-rata durasi pengerjaan TA</li>
                          <li>• Dosen paling produktif</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-2">
                          📑 Export Data
                        </p>
                        <ul className="text-gray-600 space-y-1">
                          <li>• Export ke Excel/CSV</li>
                          <li>• Generate PDF report</li>
                          <li>• Custom date range</li>
                          <li>• Filter by prodi/angkatan</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-2">
                          🎯 KPI Monitoring
                        </p>
                        <ul className="text-gray-600 space-y-1">
                          <li>• Rata-rata waktu approval</li>
                          <li>• Response time dosen</li>
                          <li>• Tingkat kepuasan mahasiswa</li>
                          <li>• System uptime</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="mb-16 scroll-mt-24">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Fitur & Modul Unggulan
              </h1>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  SITA-BI dilengkapi dengan berbagai fitur modern untuk
                  pengalaman pengguna yang optimal.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-red-900 rounded-lg flex items-center justify-center mr-4">
                        <Code className="text-white" size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        AI Chatbot (SitaBot)
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Asisten virtual berbasis Google Gemini AI yang siap
                      membantu 24/7.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Menjawab pertanyaan seputar TA</li>
                      <li>• Panduan penggunaan sistem</li>
                      <li>• Informasi jadwal dan deadline</li>
                      <li>• Tips & best practices</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <Bell className="text-white" size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Real-time Notifications
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Notifikasi instant melalui multiple channel.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• In-app notifications</li>
                      <li>• Email notifications</li>
                      <li>• Push notifications (coming soon)</li>
                      <li>• SMS alerts untuk jadwal penting</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                        <FileText className="text-white" size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Document Management
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Kelola semua dokumen TA dalam satu tempat.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Upload & download dokumen</li>
                      <li>• Version control</li>
                      <li>• Preview online</li>
                      <li>• Secure cloud storage</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                        <Calendar className="text-white" size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Smart Scheduling
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Penjadwalan cerdas dengan algoritma optimasi.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Auto scheduling sidang</li>
                      <li>• Conflict detection</li>
                      <li>• Calendar integration</li>
                      <li>• Reminder otomatis</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Technology Section */}
            <section id="technology" className="mb-16 scroll-mt-24">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Teknologi & Stack
              </h1>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  SITA-BI dibangun dengan teknologi modern dan best practices
                  industry standard.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-bold text-red-900 mb-4 text-lg">
                      Frontend Stack
                    </h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">Next.js 15</strong>
                          <p className="text-xs text-gray-600">
                            React framework with SSR & SSG
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">TypeScript</strong>
                          <p className="text-xs text-gray-600">
                            Type-safe development
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">
                            Tailwind CSS
                          </strong>
                          <p className="text-xs text-gray-600">
                            Utility-first CSS framework
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">
                            Lucide Icons
                          </strong>
                          <p className="text-xs text-gray-600">
                            Beautiful icon library
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-bold text-red-900 mb-4 text-lg">
                      Backend Stack
                    </h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">Express.js</strong>
                          <p className="text-xs text-gray-600">
                            Fast & minimalist Node.js framework
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">SQLite</strong>
                          <p className="text-xs text-gray-600">
                            Lightweight relational database
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">Prisma ORM</strong>
                          <p className="text-xs text-gray-600">
                            Type-safe database client
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">
                            Passport.js + JWT
                          </strong>
                          <p className="text-xs text-gray-600">
                            Authentication & authorization
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-bold text-red-900 mb-4 text-lg">
                      DevOps & Tools
                    </h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">Turborepo</strong>
                          <p className="text-xs text-gray-600">
                            Monorepo build system
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">pnpm</strong>
                          <p className="text-xs text-gray-600">
                            Fast package manager
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">
                            ESLint & Prettier
                          </strong>
                          <p className="text-xs text-gray-600">
                            Code quality tools
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">
                            Google Gemini AI
                          </strong>
                          <p className="text-xs text-gray-600">
                            AI chatbot integration
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="font-bold text-gray-900 mb-3">
                    Why These Technologies?
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <p className="font-medium mb-2">🚀 Performance</p>
                      <p className="text-gray-600">
                        Next.js SSR/SSG ensures fast page loads. SQLite provides
                        quick read/write operations with zero configuration.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">🔒 Security</p>
                      <p className="text-gray-600">
                        Passport.js with JWT authentication, bcrypt password
                        hashing, dan session management melindungi data
                        pengguna.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">📈 Scalability</p>
                      <p className="text-gray-600">
                        Monorepo architecture dengan Turborepo memudahkan
                        scaling dan deployment aplikasi secara modular.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">🛠️ Maintainability</p>
                      <p className="text-gray-600">
                        TypeScript 100% ensures type safety. Clean architecture
                        dengan service layer makes code easy to maintain.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Dokumentasi */}
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
          </div>
        </main>
      </div>
    </div>
  );
}
