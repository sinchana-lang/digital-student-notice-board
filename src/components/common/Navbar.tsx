import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CAMPUS_ASSETS } from '../../utils/constants';

export type PublicNavTarget =
  | 'home'
  | 'notices'
  | 'events'
  | 'departments'
  | 'appointments'
  | 'contact'
  | 'auth'
  | 'dashboard';

interface NavbarProps {
  onNavigate: (target: PublicNavTarget) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const { firebaseUser, activeRole, theme } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (target: PublicNavTarget) => {
    setMobileMenuOpen(false);
    onNavigate(target);
  };

  const primaryLabel = firebaseUser
    ? activeRole === 'admin'
      ? 'Admin Portal'
      : activeRole === 'faculty'
      ? 'Faculty Portal'
      : 'Student Portal'
    : 'Portal Sign In';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#07111F]/95 backdrop-blur-md">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Official GAT Logo & Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C9972C] rounded cursor-pointer"
        >
          <img
            src={theme === 'dark' ? CAMPUS_ASSETS.logoWhite : CAMPUS_ASSETS.logoColor}
            alt="Global Academy of Technology Official Logo"
            referrerPolicy="no-referrer"
            className="h-10 w-auto object-contain shrink-0"
          />
          <span className="hidden xl:inline font-display text-base font-bold tracking-tight text-[#0B1F3A] dark:text-white whitespace-nowrap shrink-0">
            Global Academy of Technology
          </span>
        </button>

        {/* Zone 2: 4–5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => handleNav('notices')}
            className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4 decoration-[#C9972C]"
          >
            Notices
          </button>
          <button
            type="button"
            onClick={() => handleNav('events')}
            className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4 decoration-[#C9972C]"
          >
            Events
          </button>
          <button
            type="button"
            onClick={() => handleNav('departments')}
            className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4 decoration-[#C9972C]"
          >
            Departments
          </button>
          <button
            type="button"
            onClick={() => handleNav('appointments')}
            className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4 decoration-[#C9972C]"
          >
            Appointments
          </button>
          <button
            type="button"
            onClick={() => handleNav('contact')}
            className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4 decoration-[#C9972C]"
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav(firebaseUser ? 'dashboard' : 'auth')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white hover:bg-[#132F54] dark:bg-[#C9972C] dark:text-[#07111F] dark:hover:bg-[#DFB047] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1728] px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleNav('notices')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Notices
          </button>
          <button
            type="button"
            onClick={() => handleNav('events')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Events
          </button>
          <button
            type="button"
            onClick={() => handleNav('departments')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Departments
          </button>
          <button
            type="button"
            onClick={() => handleNav('appointments')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Appointments
          </button>
          <button
            type="button"
            onClick={() => handleNav('contact')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => handleNav(firebaseUser ? 'dashboard' : 'auth')}
            className="w-full mt-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F]"
          >
            {primaryLabel}
          </button>
        </div>
      )}
    </header>
  );
}
