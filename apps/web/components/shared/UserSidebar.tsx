'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Home, LogOut, Menu, LucideIcon, MessageCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const ChatbotModal = dynamic(
  () => import('@/app/components/SitaBot/ChatbotModal'),
  {
    ssr: false,
  },
);

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  isSitaBot?: boolean;
}

interface MenuSection {
  title: string;
  items: NavItem[];
}

interface UserSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (_open: boolean) => void;
  navItems?: NavItem[];
  menuSections?: MenuSection[];
  menuTitle?: string;
  dashboardHref: string;
}

const NavLink = ({
  item,
  sidebarOpen,
  onClick,
}: {
  item: NavItem;
  sidebarOpen: boolean;
  onClick?: () => void;
}) => {
  const pathname = usePathname();
  const isActive = pathname === item.href && !item.isSitaBot;
  const [tooltipPos, setTooltipPos] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const linkRef = React.useRef<HTMLAnchorElement | HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (linkRef.current && !sidebarOpen && !isActive) {
      const rect = linkRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top + rect.height / 2, left: rect.right });
    }
  };

  const handleMouseLeave = () => {
    setTooltipPos(null);
  };

  const Component = item.isSitaBot ? 'button' : Link;
  const componentProps = item.isSitaBot
    ? { onClick, type: 'button' as const }
    : { href: item.href, prefetch: true };

  return (
    <>
      <li>
        <Component
          ref={linkRef as any}
          {...componentProps}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ease-out w-full text-left ${
            isActive
              ? 'bg-gradient-to-r from-red-900 to-red-800 text-white shadow-md shadow-red-900/20'
              : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-red-900 active:scale-[0.98]'
          }`}
        >
          <div
            className={`flex items-center justify-center w-5 h-5 transition-transform duration-150 ${
              isActive ? '' : 'group-hover:scale-110 group-active:scale-95'
            }`}
          >
            <item.icon
              className="w-5 h-5 flex-shrink-0"
              strokeWidth={isActive ? 2.5 : 2}
            />
          </div>
          {!!sidebarOpen && (
            <span className="text-sm font-medium tracking-tight truncate">
              {item.label}
            </span>
          )}
        </Component>
      </li>

      {!sidebarOpen && !isActive && !!tooltipPos && (
        <div
          className="fixed ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap z-[100] -translate-y-1/2 pointer-events-none shadow-xl"
          style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px` }}
        >
          {item.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-[5px] border-transparent border-r-gray-900"></div>
        </div>
      )}
    </>
  );
};

export default function UserSidebar({
  sidebarOpen,
  setSidebarOpen,
  navItems,
  menuSections,
  menuTitle,
  dashboardHref,
}: UserSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSitaBotClick = () => {
    if (isMobile) {
      router.push('/chatbot');
    } else {
      setIsChatOpen(true);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-gray-200/80 shadow-sm flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-red-900 transition-all duration-150 active:scale-95"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
              {user?.nama || 'User'}
            </p>
            <p className="text-[10px] text-gray-500 truncate capitalize">
              {user?.roles?.[0]?.name || 'User'}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-900 transition-all duration-150 active:scale-95"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Backdrop for mobile */}
      {!!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200/80 shadow-2xl shadow-gray-900/10 transition-all duration-300 ease-out flex flex-col ${
          sidebarOpen
            ? 'w-64'
            : '-translate-x-full lg:translate-x-0 lg:w-[4.5rem]'
        }`}
      >
        <div className="h-16 flex items-center gap-3 px-3 border-b border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-gray-700 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 hover:text-red-900 transition-all duration-150 active:scale-95 hover:shadow-sm"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>

          {!!sidebarOpen && (
            <Link
              href={dashboardHref}
              prefetch={true}
              className="flex items-center gap-2.5 hover:opacity-80 transition-all duration-150 active:scale-[0.98]"
            >
              <div className="w-8 h-8 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-red-900 hover:shadow-md transition-all duration-150">
                <Image
                  src="https://bing.pnp.ac.id/wp-content/uploads/2025/01/cropped-LOGO-BAHASA-INGGRIS-PNP-TEXT-300x300-1.png"
                  alt="PNP Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900 tracking-tight">
                  SITA-BI
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  Student Portal
                </span>
              </div>
            </Link>
          )}
        </div>

        <div className="p-3 border-b border-gray-200/80 space-y-0.5">
          <Link
            href="/"
            prefetch={true}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 hover:text-blue-600 transition-all duration-150 ease-out active:scale-[0.98] relative"
          >
            <div className="flex items-center justify-center w-5 h-5 transition-transform duration-150 group-hover:scale-110 group-active:scale-95">
              <Home className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            </div>
            {!!sidebarOpen && (
              <span className="text-sm font-medium tracking-tight">
                Beranda
              </span>
            )}

            {!sidebarOpen && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[100] top-1/2 -translate-y-1/2 shadow-xl">
                Beranda
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-[5px] border-transparent border-r-gray-900"></div>
              </div>
            )}
          </Link>

          <button
            onClick={handleSitaBotClick}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 hover:text-red-900 transition-all duration-150 ease-out active:scale-[0.98] relative w-full text-left"
          >
            <div className="flex items-center justify-center w-5 h-5 transition-transform duration-150 group-hover:scale-110 group-active:scale-95">
              <MessageCircle
                className="w-5 h-5 flex-shrink-0"
                strokeWidth={2}
              />
            </div>
            {!!sidebarOpen && (
              <span className="text-sm font-medium tracking-tight">
                SitaBot AI
              </span>
            )}

            {!sidebarOpen && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[100] top-1/2 -translate-y-1/2 shadow-xl">
                SitaBot AI
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-[5px] border-transparent border-r-gray-900"></div>
              </div>
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          {menuSections ? (
            <div className="space-y-4">
              {menuSections.map((section, idx) => (
                <div key={idx}>
                  {!!sidebarOpen && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">
                      {section.title}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        sidebarOpen={sidebarOpen}
                        onClick={
                          item.isSitaBot ? handleSitaBotClick : undefined
                        }
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <>
              {!!sidebarOpen && !!menuTitle && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">
                  {menuTitle}
                </p>
              )}
              <ul className="space-y-0.5">
                {navItems?.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    sidebarOpen={sidebarOpen}
                    onClick={item.isSitaBot ? handleSitaBotClick : undefined}
                  />
                ))}
              </ul>
            </>
          )}
        </nav>

        <div className="border-t border-gray-200/80 p-3 bg-gradient-to-t from-gray-50/50 to-transparent">
          {sidebarOpen ? (
            <div className="group flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-150 cursor-pointer active:scale-[0.98]">
              <div className="w-8 h-8 bg-gradient-to-br from-red-900 to-red-800 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-150 shadow-md shadow-red-900/20">
                <span className="text-xs font-bold text-white">
                  {user?.nama?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate tracking-tight">
                  {user?.nama || 'User'}
                </p>
                <p className="text-[10px] text-gray-500 truncate capitalize font-medium">
                  {user?.roles?.[0]?.name || 'User'}
                </p>
              </div>
            </div>
          ) : (
            <div className="group flex justify-center mb-1.5 cursor-pointer relative">
              <div className="w-8 h-8 bg-gradient-to-br from-red-900 to-red-800 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-150 shadow-md shadow-red-900/20">
                <span className="text-xs font-bold text-white">
                  {user?.nama?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>

              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[100] top-1/2 -translate-y-1/2 shadow-xl">
                {user?.nama || 'User'}
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-[5px] border-transparent border-r-gray-900"></div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 hover:text-red-900 rounded-xl transition-all duration-150 ease-out relative active:scale-[0.98] hover:shadow-sm ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 transition-transform duration-150 group-hover:scale-110 group-active:scale-95">
              <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            </div>
            {!!sidebarOpen && <span className="tracking-tight">Logout</span>}

            {!sidebarOpen && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[100] top-1/2 -translate-y-1/2 shadow-xl">
                Logout
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-[5px] border-transparent border-r-gray-900"></div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {!isMobile && !!isChatOpen && (
        <ChatbotModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </>
  );
}
