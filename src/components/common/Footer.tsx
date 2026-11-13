import { ExternalLink, Mail, MapPin, Moon, Phone, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CAMPUS_ASSETS, GAT_COLLEGE_INFO } from '../../utils/constants';
import type { PublicNavTarget } from './Navbar';

interface FooterProps {
  onNavigate?: (target: PublicNavTarget) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { theme, toggleTheme } = useAuth();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-[#0B1F3A] text-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={CAMPUS_ASSETS.logoWhite}
                alt="Global Academy of Technology Official Logo"
                referrerPolicy="no-referrer"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                {GAT_COLLEGE_INFO.name}
              </h3>
              <p className="text-xs text-[#DFB047]">
                {GAT_COLLEGE_INFO.tagline} · {GAT_COLLEGE_INFO.locationShort}
              </p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Centralized Digital Student Notice Board for academic circulars, examination schedules,
              department updates, and campus events.
            </p>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-slate-100 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#DFB047]" />
                  <span>Switch to Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#DFB047]" />
                  <span>Switch to Dark Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-white">Campus Contact</h4>
            <div className="space-y-2.5 text-sm text-slate-300">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#DFB047] shrink-0 mt-0.5" />
                <span>{GAT_COLLEGE_INFO.address}</span>
              </p>
              <p className="flex items-center gap-2.5 font-mono text-xs">
                <Phone className="w-4 h-4 text-[#DFB047] shrink-0" />
                <span>General: {GAT_COLLEGE_INFO.generalPhone}</span>
              </p>
              <p className="flex items-center gap-2.5 font-mono text-xs">
                <Phone className="w-4 h-4 text-[#DFB047] shrink-0" />
                <span>Admissions: {GAT_COLLEGE_INFO.admissionsPhone}</span>
              </p>
              <p className="flex items-center gap-2.5 text-xs">
                <Mail className="w-4 h-4 text-[#DFB047] shrink-0" />
                <span>{GAT_COLLEGE_INFO.email} · {GAT_COLLEGE_INFO.admissionsEmail}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-white">Quick Links</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-300">
              <a
                href={GAT_COLLEGE_INFO.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#DFB047] transition-colors"
              >
                <span>Official College Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={GAT_COLLEGE_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#DFB047] transition-colors"
              >
                <span>Campus Location on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {onNavigate && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('auth')}
                    className="text-left hover:text-[#DFB047] transition-colors"
                  >
                    Student, Faculty & Admin Login
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('notices')}
                    className="text-left hover:text-[#DFB047] transition-colors"
                  >
                    Browse All Published Notices
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('appointments')}
                    className="text-left hover:text-[#DFB047] transition-colors"
                  >
                    Book Campus Appointment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Global Academy of Technology, Bengaluru. Digital Student Notice Board.</p>
          <p>Official Portal Information verified via gat.ac.in</p>
        </div>
      </div>
    </footer>
  );
}
