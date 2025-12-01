'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Home, LogOut, Menu, LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface UserSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (_open: boolean) => void;
  navItems: NavItem[];
  menuTitle: string;
  dashboardHref: string;
}

const NavLink = ({
  item,
  sidebarOpen,
}: {
  item: NavItem;
  sidebarOpen: boolean;
}) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const [tooltipPos, setTooltipPos] = React.useState<{ top: number; left: number } | null>(null);
  const linkRef = React.useRef<HTMLAnchorElement>(null);

  const handleMouseEnter = () => {
    if (linkRef.current && !sidebarOpen && !isActive) {
      const rect = linkRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top + rect.height / 2, left: rect.right });
    }
  };

  const handleMouseLeave = () => {
    setTooltipPos(null);
  };

  return (
    <li className="group relative">
      <Link
        ref={linkRef}
        href={item.href}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-red-900 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-50 hover:text-red-900 hover:translate-x-1'
        }`}
        title={!sidebarOpen ? item.label : ''}
      >
        <item.icon
          className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
            isActive ? '' : 'group-hover:scale-110'
          }`}
        />
        {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
      </Link>

      {!sidebarOpen && !isActive && tooltipPos && (
        <div 
          className="fixed ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-[60] -translate-y-1/2 pointer-events-none"
          style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px` }}
        >
          {item.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </li>
  );
};

export default function UserSidebar({
  sidebarOpen,
  setSidebarOpen,
  navItems,
  menuTitle,
  dashboardHref,
}: UserSidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-900 transition-all duration-200 hover:scale-110"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu className="h-5 w-5" />
        </button>

        {sidebarOpen && (
          <Link
            href={dashboardHref}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-red-900 transition-colors">
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
              <span className="text-xs font-semibold text-gray-900">SITA-BI</span>
              <span className="text-[10px] text-gray-500">Student Portal</span>
            </div>
          </Link>
        )}
      </div>

      <div className="p-4 border-b border-gray-200">
        <Link
          href="/"
          className="group flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:translate-x-1 relative"
          title={!sidebarOpen ? 'Beranda' : ''}
        >
          <Home className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {sidebarOpen && <span className="text-sm font-medium">Beranda</span>}

          {!sidebarOpen && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 -translate-y-1/2">
              Beranda
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {sidebarOpen && (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
            {menuTitle}
          </p>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} sidebarOpen={sidebarOpen} />
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-4">
        {sidebarOpen ? (
          <div className="group flex items-center gap-3 px-4 py-3 mb-2 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-red-900 to-red-800 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              <span className="text-xs font-semibold text-white">
                {user?.nama?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.nama || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.roles?.[0]?.name || 'User'}
              </p>
            </div>
          </div>
        ) : (
          <div className="group flex justify-center mb-2 cursor-pointer relative">
            <div className="w-8 h-8 bg-gradient-to-br from-red-900 to-red-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <span className="text-xs font-semibold text-white">
                {user?.nama?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>

            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 -translate-y-1/2">
              {user?.nama || 'User'}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-900 rounded-lg transition-all duration-200 relative ${
            !sidebarOpen ? 'justify-center' : 'hover:translate-x-1'
          }`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
          {sidebarOpen && <span>Logout</span>}

          {!sidebarOpen && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 -translate-y-1/2">
              Logout
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
            </div>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
