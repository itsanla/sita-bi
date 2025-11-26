'use client';
import React from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react';

interface FooterProps {
  scrollToSection: (_id: string) => void;
}

export default function Footer({ scrollToSection }: FooterProps) {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Top Border Gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-900 rounded-full filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-900 rounded-full filter blur-3xl opacity-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h3 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              SITA-BI
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Platform manajemen tugas akhir yang modern dan efisien untuk
              mahasiswa dan dosen. Kelola bimbingan, jadwal, dan pengumuman
              dengan mudah.
            </p>

            {/* Social Media Links */}
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-red-600 to-orange-500 rounded-full"></span>
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('hero');
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-red-500 group-hover:w-3 transition-all duration-300"></span>
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#tawarantopik"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('tawarantopik');
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-red-500 group-hover:w-3 transition-all duration-300"></span>
                  Tawaran Topik
                </a>
              </li>
              <li>
                <a
                  href="#jadwal"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('jadwal');
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-red-500 group-hover:w-3 transition-all duration-300"></span>
                  Jadwal Sidang
                </a>
              </li>
              <li>
                <a
                  href="#pengumuman"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('pengumuman');
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-red-500 group-hover:w-3 transition-all duration-300"></span>
                  Pengumuman
                </a>
              </li>
              <li>
                <a
                  href="/dokumentasi"
                  className="text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-red-500 group-hover:w-3 transition-all duration-300"></span>
                  Dokumentasi
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 relative inline-block">
              Contact Us
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-red-600 to-orange-500 rounded-full"></span>
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors">
                <MapPin
                  size={20}
                  className="flex-shrink-0 text-red-500 mt-0.5"
                />
                <div>
                  <p className="text-sm">Jalan Limau Manis</p>
                  <p className="text-sm">Limau Manis, Kec. Pauh</p>
                  <p className="text-sm">Kota Padang, 25164</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Phone size={18} className="flex-shrink-0 text-red-500" />
                <span className="text-sm">0751-72590</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Mail size={18} className="flex-shrink-0 text-red-500" />
                <span className="text-sm">info@pnp.ac.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} SITA-BI. All rights reserved. Made
              with ❤️ by PNP Students.
            </p>
            <div className="flex gap-6 text-sm">
              <a
                href="#"
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
