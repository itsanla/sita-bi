'use client';

import { ChevronRight } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  children?: { id: string; label: string }[];
}

interface DocSidebarProps {
  menuItems: MenuItem[];
  activeSection: string;
  expandedMenus: string[];
  sidebarOpen: boolean;
  onToggleMenu: (id: string) => void;
  onScrollToSection: (id: string) => void;
  onCloseSidebar: () => void;
}

export default function DocSidebar({
  menuItems,
  activeSection,
  expandedMenus,
  sidebarOpen,
  onToggleMenu,
  onScrollToSection,
  onCloseSidebar,
}: DocSidebarProps) {
  return (
    <>
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
                      onToggleMenu(item.id);
                    } else {
                      onScrollToSection(item.id);
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
                          onClick={() => onScrollToSection(child.id)}
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

      {sidebarOpen ? (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onCloseSidebar}
        />
      ) : null}
    </>
  );
}
