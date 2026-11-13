import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ExternalLink,
  Mail,
  MapPin,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { AppointmentBookingForm } from '../components/common/AppointmentBookingForm';
import { EventCard } from '../components/common/EventCard';
import { Footer } from '../components/common/Footer';
import { Navbar, type PublicNavTarget } from '../components/common/Navbar';
import { NoticeCard } from '../components/common/NoticeCard';
import { NoticeDetailModal } from '../components/common/NoticeDetailModal';
import { Pagination } from '../components/common/Pagination';
import { SearchFilterBar, type NoticeFilterState } from '../components/common/SearchFilterBar';
import { useAuth } from '../context/AuthContext';
import type { CampusEvent, Department, Notice } from '../types';
import {
  CAMPUS_ASSETS,
  GAT_CAMPUS_GALLERY,
  GAT_COLLEGE_INFO,
  NOTICE_CATEGORIES,
} from '../utils/constants';
import { formatDate, isNoticePublishedAndActive, toDate } from '../utils/formatters';

interface HomePageProps {
  notices: Notice[];
  events: CampusEvent[];
  departments: Department[];
  usingSampleNotices: boolean;
  usingSampleEvents: boolean;
  onNavigateAuth: (preferredTab?: 'student' | 'faculty' | 'admin') => void;
  onOpenDashboard: () => void;
}

const PAGE_SIZE = 6;

export function HomePage({
  notices,
  events,
  departments,
  usingSampleNotices,
  usingSampleEvents,
  onNavigateAuth,
  onOpenDashboard,
}: HomePageProps) {
  const { firebaseUser, theme, toggleTheme } = useAuth();
  const [heroImgError, setHeroImgError] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<NoticeFilterState>({
    query: '',
    departmentId: 'all',
    category: 'all',
    priority: 'all',
    year: 'all',
    semester: 'all',
    dateFrom: '',
    sortBy: 'newest',
  });

  const ugDepartments = useMemo(
    () => departments.filter((d) => (d.programLevel || 'UG') === 'UG'),
    [departments]
  );
  const pgDepartments = useMemo(
    () => departments.filter((d) => d.programLevel === 'PG'),
    [departments]
  );

  const activePublishedNotices = useMemo(
    () => notices.filter((n) => isNoticePublishedAndActive(n)),
    [notices]
  );

  const urgentNotices = useMemo(
    () => activePublishedNotices.filter((n) => n.priority === 'urgent').slice(0, 3),
    [activePublishedNotices]
  );

  const filteredNotices = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const fromTime = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;

    const result = activePublishedNotices.filter((notice) => {
      if (q) {
        const hay = `${notice.title} ${notice.summary} ${notice.content} ${notice.category} ${notice.authorName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.departmentId !== 'all') {
        if (!notice.targetAllDepartments && !notice.departmentIds.includes(filters.departmentId)) {
          return false;
        }
      }
      if (filters.category !== 'all' && notice.category !== filters.category) {
        return false;
      }
      if (filters.priority !== 'all' && notice.priority !== filters.priority) {
        return false;
      }
      if (filters.year !== 'all') {
        if (notice.targetYear && notice.targetYear !== 'all' && notice.targetYear !== filters.year) {
          return false;
        }
      }
      if (filters.semester !== 'all') {
        if (
          notice.targetSemester &&
          notice.targetSemester !== 'all' &&
          notice.targetSemester !== filters.semester
        ) {
          return false;
        }
      }
      if (fromTime) {
        const pubTime = toDate(notice.publishAt)?.getTime() ?? 0;
        if (pubTime < fromTime) return false;
      }
      return true;
    });

    const priorityRank = { urgent: 0, important: 1, normal: 2 };
    return [...result].sort((a, b) => {
      if (filters.sortBy === 'priority') {
        if (priorityRank[a.priority] !== priorityRank[b.priority]) {
          return priorityRank[a.priority] - priorityRank[b.priority];
        }
      }
      const ta = toDate(a.publishAt)?.getTime() ?? 0;
      const tb = toDate(b.publishAt)?.getTime() ?? 0;
      if (filters.sortBy === 'oldest') return ta - tb;
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return tb - ta;
    });
  }, [activePublishedNotices, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNotices = filteredNotices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return events;
    return events.filter((e) => e.status === eventFilter);
  }, [events, eventFilter]);

  const upcomingEventsCount = useMemo(
    () => events.filter((e) => e.status === 'upcoming').length,
    [events]
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavbarNavigate = (target: PublicNavTarget) => {
    if (target === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (target === 'notices') scrollToSection('notices-section');
    else if (target === 'events') scrollToSection('events-section');
    else if (target === 'departments') scrollToSection('departments-section');
    else if (target === 'appointments') scrollToSection('appointments-section');
    else if (target === 'contact') scrollToSection('contact-section');
    else if (target === 'auth') onNavigateAuth('student');
    else if (target === 'dashboard') onOpenDashboard();
  };

  const handleFilterChange = (next: NoticeFilterState) => {
    setFilters(next);
    setCurrentPage(1);
  };

  const handleDepartmentQuickFilter = (deptId: string) => {
    setFilters((prev) => ({ ...prev, departmentId: deptId }));
    setCurrentPage(1);
    scrollToSection('notices-section');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#07111F] text-[#0B1F3A] dark:text-slate-100">
      <Navbar onNavigate={handleNavbarNavigate} />

      <main className="flex-1">
        {/* Official GAT Hero with Real Campus Background Photo */}
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-[#0B1F3A] text-white">
          {!heroImgError && (
            <img
              src={CAMPUS_ASSETS.heroBuilding}
              alt="Global Academy of Technology Main Campus Building, Rajarajeshwari Nagar, Bengaluru"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07111F]/92 via-[#0B1F3A]/82 to-[#0B1F3A]/50" />

          <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <img
                  src={CAMPUS_ASSETS.logoWhite}
                  alt="Global Academy of Technology Official Logo"
                  referrerPolicy="no-referrer"
                  className="h-14 sm:h-16 w-auto object-contain"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-semibold text-[#DFB047]">
                  {GAT_COLLEGE_INFO.name} · {GAT_COLLEGE_INFO.tagline}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12] headline-balance">
                  Digital Student Notice Board & Academic Circulars Portal
                </h1>
              </div>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                Official campus platform for Global Academy of Technology, Rajarajeshwari Nagar,
                Bengaluru. Access verified examination schedules, internal assessment timetables,
                department announcements, placement updates, and campus events.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {firebaseUser ? (
                  <button
                    type="button"
                    onClick={onOpenDashboard}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg bg-[#C9972C] text-[#07111F] hover:bg-[#DFB047] transition-colors cursor-pointer"
                  >
                    <span>Open My Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigateAuth('student')}
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg bg-[#C9972C] text-[#07111F] hover:bg-[#DFB047] transition-colors cursor-pointer"
                    >
                      <span>Student & Faculty Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateAuth('admin')}
                      className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#DFB047]" />
                      <span>Admin Login</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width 4-Column Portal Summary Strip */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1728]">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active Notices</p>
              <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white">
                {activePublishedNotices.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming Events</p>
              <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white">
                {upcomingEventsCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Academic Programs</p>
              <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white">
                {ugDepartments.length} UG · {pgDepartments.length} PG
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Display Theme</p>
                <p className="mt-1 text-sm font-semibold text-[#0B1F3A] dark:text-white capitalize">
                  {theme} Mode
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#DFB047]" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#0B1F3A]" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Urgent & Important Notifications Spotlight */}
        {urgentNotices.length > 0 && (
          <section className="border-b border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/20">
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-300 shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Important Notifications</span>
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2">
                  {urgentNotices.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedNotice(item)}
                      className="text-left text-xs sm:text-sm font-medium text-[#0B1F3A] dark:text-slate-100 hover:underline underline-offset-4 cursor-pointer truncate max-w-md"
                    >
                      {item.title} ·{' '}
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(item.publishAt)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Digital Notice Board Section */}
        <section id="notices-section" className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white">
                Latest Announcements & Circulars
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Filter notices by UG/PG department, academic year, semester, or category.
              </p>
            </div>
            {usingSampleNotices && (
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Showing Sample Demonstration Notices (live notices appear once published by Admin)
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => handleFilterChange({ ...filters, category: 'all' })}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                filters.category === 'all'
                  ? 'bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F]'
                  : 'bg-white dark:bg-[#0D1C31] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              All Categories
            </button>
            {NOTICE_CATEGORIES.slice(0, 8).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleFilterChange({ ...filters, category: cat })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  filters.category === cat
                    ? 'bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F]'
                    : 'bg-white dark:bg-[#0D1C31] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <SearchFilterBar
            filters={filters}
            departments={departments}
            onChange={handleFilterChange}
            totalCount={filteredNotices.length}
          />

          {paginatedNotices.length === 0 ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-12 text-center space-y-3">
              <p className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                No notices match the selected filters
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Try clearing your keyword search or switching department, year, semester, or
                category filters.
              </p>
              <button
                type="button"
                onClick={() =>
                  handleFilterChange({
                    query: '',
                    departmentId: 'all',
                    category: 'all',
                    priority: 'all',
                    year: 'all',
                    semester: 'all',
                    dateFrom: '',
                    sortBy: 'newest',
                  })
                }
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  departments={departments}
                  onOpen={setSelectedNotice}
                />
              ))}
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </section>

        {/* Events Section */}
        <section
          id="events-section"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1728]"
        >
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white">
                  Upcoming & Campus Events
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Technical workshops, symposiums, placement conclaves, and cultural activities at
                  GAT.
                </p>
                {usingSampleEvents && (
                  <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                    Showing Sample Demonstration Events
                  </p>
                )}
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#07111F] border border-slate-200 dark:border-slate-800 self-start">
                {(['all', 'upcoming', 'completed'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setEventFilter(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      eventFilter === tab
                        ? 'bg-white dark:bg-[#0D1C31] text-[#0B1F3A] dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0B1F3A] dark:hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-10 text-center">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  No {eventFilter === 'all' ? '' : eventFilter} events available right now.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Department-Wise Notice Directory (10 UG + 3 PG Programs) */}
        <section
          id="departments-section"
          className="border-t border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#07111F]"
        >
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white">
                Department-Wise Notice Boards
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Select any of Global Academy of Technology’s 10 Undergraduate and 3 Postgraduate
                programs to filter announcements.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-display text-sm font-semibold text-slate-600 dark:text-slate-300">
                Undergraduate Programs (B.E.)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {ugDepartments.map((dept) => {
                  const count = activePublishedNotices.filter(
                    (n) => n.targetAllDepartments || n.departmentIds.includes(dept.id)
                  ).length;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleDepartmentQuickFilter(dept.id)}
                      className="text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4 hover:border-[#0B1F3A] dark:hover:border-[#C9972C] transition-colors cursor-pointer flex flex-col justify-between gap-3"
                    >
                      <div>
                        <p className="font-mono text-xs font-semibold text-[#A47717] dark:text-[#DFB047]">
                          {dept.code}
                        </p>
                        <h4 className="mt-1 font-display text-sm font-semibold text-[#0B1F3A] dark:text-white leading-snug">
                          {dept.name}
                        </h4>
                      </div>
                      <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {count} active notice{count === 1 ? '' : 's'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {pgDepartments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Postgraduate Programs (M.Tech & MBA)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {pgDepartments.map((dept) => {
                    const count = activePublishedNotices.filter(
                      (n) => n.targetAllDepartments || n.departmentIds.includes(dept.id)
                    ).length;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleDepartmentQuickFilter(dept.id)}
                        className="text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4 hover:border-[#0B1F3A] dark:hover:border-[#C9972C] transition-colors cursor-pointer flex flex-col justify-between gap-3"
                      >
                        <div>
                          <p className="font-mono text-xs font-semibold text-[#A47717] dark:text-[#DFB047]">
                            {dept.code}
                          </p>
                          <h4 className="mt-1 font-display text-sm font-semibold text-[#0B1F3A] dark:text-white leading-snug">
                            {dept.name}
                          </h4>
                        </div>
                        <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {count} active notice{count === 1 ? '' : 's'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Authentic GAT Campus Infrastructure Gallery */}
        <section className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1728]">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white">
                Campus & Infrastructure
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Photographs from Global Academy of Technology, Rajarajeshwari Nagar, Bengaluru.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {GAT_CAMPUS_GALLERY.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-[#091526] flex flex-col"
                >
                  <div className="aspect-4/3 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-display text-sm font-semibold text-[#0B1F3A] dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Campus Appointment Booking */}
        <section
          id="appointments-section"
          className="border-t border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#07111F]"
        >
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wide text-[#A47717] dark:text-[#DFB047]">
                    Campus Appointments & Counseling
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white">
                    Book an Appointment at GAT
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Schedule a structured in-person or academic review meeting with department
                    heads, faculty mentors, the examination cell, placement office, or admissions.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-5 space-y-4 text-sm">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#0B1F3A] dark:text-white">
                      Visiting Hours
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      Monday – Saturday · 09:30 AM to 04:30 PM
                    </p>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <p className="font-semibold text-[#0B1F3A] dark:text-white">
                      Available Campus Offices
                    </p>
                    <p>Department HODs (All 10 UG & 3 PG Programs)</p>
                    <p>Academic Mentoring, Examination Cell & Training & Placement</p>
                    <p>Admissions & Campus Tours, Principal’s Office</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <AppointmentBookingForm departments={departments} />
              </div>
            </div>
          </div>
        </section>

        {/* College Information, Google Maps & Contact Section */}
        <section
          id="contact-section"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1728]"
        >
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <img
                    src={theme === 'dark' ? CAMPUS_ASSETS.logoWhite : CAMPUS_ASSETS.logoColor}
                    alt="Global Academy of Technology Official Logo"
                    referrerPolicy="no-referrer"
                    className="h-12 w-auto object-contain"
                  />
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white">
                    Campus Location & Contact
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Global Academy of Technology is located in Rajarajeshwari Nagar, Bengaluru.
                    Reach official campus offices via the verified channels below.
                  </p>
                  <div className="space-y-3 pt-2 text-sm">
                    <p className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-[#C9972C] shrink-0 mt-1" />
                      <span>{GAT_COLLEGE_INFO.address}</span>
                    </p>
                    <p className="flex items-center gap-3 font-mono text-xs sm:text-sm">
                      <Phone className="w-4 h-4 text-[#C9972C] shrink-0" />
                      <span>General Enquiries: {GAT_COLLEGE_INFO.generalPhone}</span>
                    </p>
                    <p className="flex items-center gap-3 font-mono text-xs sm:text-sm">
                      <Phone className="w-4 h-4 text-[#C9972C] shrink-0" />
                      <span>Admissions: {GAT_COLLEGE_INFO.admissionsPhone}</span>
                    </p>
                    <p className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[#C9972C] shrink-0" />
                      <span>
                        {GAT_COLLEGE_INFO.email} · {GAT_COLLEGE_INFO.admissionsEmail}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href={GAT_COLLEGE_INFO.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] hover:opacity-90 transition-opacity"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={GAT_COLLEGE_INFO.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-[#0B1F3A] dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>Visit gat.ac.in</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden min-h-[300px]">
                <iframe
                  title="Global Academy of Technology Google Maps Location"
                  src={GAT_COLLEGE_INFO.mapsEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full min-h-[320px] border-0"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={handleNavbarNavigate} />

      <NoticeDetailModal
        notice={selectedNotice}
        departments={departments}
        onClose={() => setSelectedNotice(null)}
      />
    </div>
  );
}
