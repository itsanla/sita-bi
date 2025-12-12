'use client';
import React from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (_isOpen: boolean) => void;
  activeSection?: string;
  scrollToSection?: (_id: string) => void;
  mode?: 'landing' | 'static';
  activePage?: string;
}

export default function Header({
  isMenuOpen,
  setIsMenuOpen,
  activeSection = 'hero',
  scrollToSection = () => {},
  mode = 'landing',
  activePage = '',
}: HeaderProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-40">
      {/* Backdrop with blur effect */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('hero');
            }}
            className="flex items-center space-x-3 group"
          >
            <div className="relative flex-shrink-0">
              <Image
                src="/logo-bing.png"
                alt="PNP Logo"
                width={40}
                height={40}
                className="rounded-lg transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-tight">
                SITA-BI
              </span>
              <span className="text-xs text-gray-500 leading-tight">
                Thesis Management
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {mode === 'landing' ? (
              <>
                {['hero', 'tawarantopik', 'jadwal', 'pengumuman'].map((section) => {
                  const getSectionLabel = () => {
                    if (section === 'hero') return 'Home';
                    if (section === 'tawarantopik') return 'Topik';
                    return section.charAt(0).toUpperCase() + section.slice(1);
                  };

                  return (
                    <a
                      key={section}
                      href={`#${section}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(section);
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        activeSection === section
                          ? 'text-red-600 bg-red-50'
                          : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                      }`}
                    >
                      {getSectionLabel()}
                    </a>
                  );
                })}
                <a
                  href="/dokumentasi"
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-colors duration-200"
                >
                  Docs
                </a>
                <a
                  href="/data-master"
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-colors duration-200"
                >
                  Data Master
                </a>
              </>
            ) : (
              <>
                <a
                  href="/"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activePage === 'home'
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Home
                </a>
                <a
                  href="/data-master"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activePage === 'data-master'
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Data Master
                </a>
                <a
                  href="/dokumentasi"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activePage === 'docs'
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Docs
                </a>
              </>
            )}
          </nav>

          {/* CTA Button & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <a
              href="/login"
              className="hidden sm:inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Login
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen ? (
          <div className="lg:hidden">
            <div className="pt-2 pb-4 space-y-1">
              {mode === 'landing' ? (
                <>
                  {['hero', 'tawarantopik', 'jadwal', 'pengumuman'].map(
                    (section) => {
                      const getMobileSectionLabel = () => {
                        if (section === 'hero') return 'Home';
                        if (section === 'tawarantopik') return 'Tawaran Topik';
                        return section.charAt(0).toUpperCase() + section.slice(1);
                      };

                      return (
                        <a
                          key={section}
                          href={`#${section}`}
                          onClick={(e) => {
                            e.preventDefault();
                            scrollToSection(section);
                            setIsMenuOpen(false);
                          }}
                          className={`block px-4 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                            activeSection === section
                              ? 'text-red-600 bg-red-50'
                              : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                          }`}
                        >
                          {getMobileSectionLabel()}
                        </a>
                      );
                    },
                  )}
                  <a
                    href="/dokumentasi"
                    className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Dokumentasi
                  </a>
                  <a
                    href="/data-master"
                    className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Data Master
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/"
                    className={`block px-4 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      activePage === 'home'
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                    }`}
                  >
                    Home
                  </a>
                  <a
                    href="/data-master"
                    className={`block px-4 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      activePage === 'data-master'
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                    }`}
                  >
                    Data Master
                  </a>
                  <a
                    href="/dokumentasi"
                    className={`block px-4 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      activePage === 'docs'
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                    }`}
                  >
                    Docs
                  </a>
                </>
              )}
              <div className="pt-4 pb-2">
                <a
                  href="/login"
                  className="block w-full text-center px-4 py-2 border border-transparent rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                >
                  Login
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
