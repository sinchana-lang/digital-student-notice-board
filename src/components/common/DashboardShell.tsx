import React, { useState } from 'react';
import { Bell, Home, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CAMPUS_ASSETS } from '../../utils/constants';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface DashboardShellProps {
  portalTitle: string;
  breadcrumb: string;
  userDisplayName: string;
  userSubtitle: string;
  navItems: SidebarItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onGoHome: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  primaryAction?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  portalTitle,
  breadcrumb,
  userDisplayName,
  userSubtitle,
  navItems,
  activeTab,
  onTabChange,
  onGoHome,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  primaryAction,
  children,
}: DashboardShellProps) {
  const { theme, toggleTheme, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectTab = (id: string) => {
    setSidebarOpen(false);
    onTabChange(id);
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#07111F] text-[#0B1F3A] dark:text-slate-100">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-[#0B1F3A] text-slate-100">
        <div className="px-4 py-3.5 flex flex-col gap-2 border-b border-white/10 shrink-0">
          <img
            src={CAMPUS_ASSETS.logoWhite}
            alt="Global Academy of Technology Official Logo"
            referrerPolicy="no-referrer"
            className="h-10 w-auto object-contain self-start"
          />
          <div className="min-w-0">
            <p className="font-display text-xs font-semibold text-white truncate">
              Digital Student Notice Board
            </p>
            <p className="text-xs text-[#DFB047] truncate">{portalTitle}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#C9972C] text-[#07111F] font-semibold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`font-mono tabular-nums text-xs px-1.5 py-0.5 rounded ${
                      active ? 'bg-[#07111F]/15 text-[#07111F]' : 'bg-white/15 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
          <div className="px-2">
            <p className="text-sm font-semibold text-white truncate">{userDisplayName}</p>
            <p className="text-xs text-slate-400 truncate">{userSubtitle}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onGoHome}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 text-[#DFB047]" />
              <span>Public Notice Board</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-300 hover:bg-red-500/20 hover:text-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0B1F3A] text-slate-100 flex flex-col h-full z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={CAMPUS_ASSETS.logoWhite}
                  alt="GAT Logo"
                  referrerPolicy="no-referrer"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-300 hover:text-white"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                      active
                        ? 'bg-[#C9972C] text-[#07111F] font-semibold'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="font-mono tabular-nums text-xs">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={onGoHome}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-200 hover:bg-white/10"
              >
                <Home className="w-4 h-4 text-[#DFB047]" />
                <span>Public Notice Board</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-red-200 hover:bg-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B1728]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                Global Academy of Technology <span aria-hidden="true">/</span> {portalTitle}{' '}
                <span aria-hidden="true">/</span>{' '}
                <span className="text-[#0B1F3A] dark:text-white font-semibold">{breadcrumb}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {primaryAction}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-mono tabular-nums font-bold flex items-center justify-center">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#DFB047]" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1320px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
