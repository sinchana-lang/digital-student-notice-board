import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Bookmark,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCheck,
  FileText,
  Loader2,
  User,
} from 'lucide-react';
import { AppointmentBookingForm } from '../components/common/AppointmentBookingForm';
import { DashboardShell, type SidebarItem } from '../components/common/DashboardShell';
import { EventCard } from '../components/common/EventCard';
import { NoticeCard } from '../components/common/NoticeCard';
import { NoticeDetailModal } from '../components/common/NoticeDetailModal';
import { Pagination } from '../components/common/Pagination';
import { SearchFilterBar, type NoticeFilterState } from '../components/common/SearchFilterBar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchStudentAppointments } from '../services/appointmentService';
import {
  logUserActivity,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNoticeAsRead,
  subscribeBookmarks,
  subscribeNoticeReads,
  subscribeNotificationReads,
  subscribeNotifications,
  toggleBookmark,
} from '../services/noticeService';
import { registerStudentAccount } from '../services/userService';
import type {
  AppNotification,
  AppointmentBooking,
  Bookmark as BookmarkType,
  CampusEvent,
  Department,
  Notice,
} from '../types';
import { formatDateTime, isNoticePublishedAndActive, toDate } from '../utils/formatters';

interface StudentDashboardProps {
  notices: Notice[];
  events: CampusEvent[];
  departments: Department[];
  onGoHome: () => void;
}

const PAGE_SIZE = 6;

export function StudentDashboard({
  notices,
  events,
  departments,
  onGoHome,
}: StudentDashboardProps) {
  const { firebaseUser, userProfile, studentProfile, refreshProfiles } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [readNoticeIds, setReadNoticeIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [myAppointments, setMyAppointments] = useState<AppointmentBooking[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

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

  // Profile form state
  const [fullName, setFullName] = useState(studentProfile?.fullName || firebaseUser?.displayName || '');
  const [usn, setUsn] = useState(studentProfile?.usn || '');
  const [departmentId, setDepartmentId] = useState(studentProfile?.departmentId || departments[0]?.id || 'cse');
  const [semester, setSemester] = useState(studentProfile?.semester || 1);
  const [section, setSection] = useState(studentProfile?.section || 'A');
  const [emailNotifications, setEmailNotifications] = useState(
    studentProfile?.emailNotifications ?? userProfile?.emailNotifications ?? true
  );
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (studentProfile) {
      setFullName(studentProfile.fullName);
      setUsn(studentProfile.usn);
      setDepartmentId(studentProfile.departmentId);
      setSemester(studentProfile.semester);
      setSection(studentProfile.section || '');
      setEmailNotifications(studentProfile.emailNotifications);
    }
  }, [studentProfile]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubBookmarks = subscribeBookmarks(firebaseUser.uid, setBookmarks);
    const unsubReads = subscribeNoticeReads(firebaseUser.uid, setReadNoticeIds);
    const unsubNotifs = subscribeNotifications(firebaseUser.uid, setNotifications);
    const unsubNotifReads = subscribeNotificationReads(firebaseUser.uid, setReadNotificationIds);

    return () => {
      unsubBookmarks();
      unsubReads();
      unsubNotifs();
      unsubNotifReads();
    };
  }, [firebaseUser]);

  const loadMyAppointments = async () => {
    if (!firebaseUser) return;
    setLoadingAppointments(true);
    try {
      const rows = await fetchStudentAppointments({
        userUid: firebaseUser.uid,
        email: firebaseUser.email || undefined,
      });
      setMyAppointments(rows);
    } catch {
      // Non-blocking if Supabase table is not created yet
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadMyAppointments();
    }
  }, [activeTab, firebaseUser]);

  const activeNotices = useMemo(
    () => notices.filter((n) => isNoticePublishedAndActive(n)),
    [notices]
  );

  const bookmarkedSet = useMemo(
    () => new Set(bookmarks.map((b) => b.noticeId)),
    [bookmarks]
  );

  const myDepartmentNotices = useMemo(() => {
    const dept = studentProfile?.departmentId;
    if (!dept) return activeNotices;
    return activeNotices.filter(
      (n) => n.targetAllDepartments || n.departmentIds.includes(dept)
    );
  }, [activeNotices, studentProfile]);

  const unreadNoticesCount = useMemo(
    () => activeNotices.filter((n) => !readNoticeIds.has(n.id)).length,
    [activeNotices, readNoticeIds]
  );

  const relevantNotifications = useMemo(() => {
    const dept = studentProfile?.departmentId;
    return notifications.filter(
      (n) => !n.departmentId || n.departmentId === 'all' || n.departmentId === dept
    );
  }, [notifications, studentProfile]);

  const unreadNotifications = useMemo(
    () => relevantNotifications.filter((n) => !readNotificationIds.has(n.id)),
    [relevantNotifications, readNotificationIds]
  );

  const urgentUnreadNotifs = useMemo(
    () => unreadNotifications.filter((n) => n.priority === 'urgent'),
    [unreadNotifications]
  );

  const displayedNotices = useMemo(() => {
    let base = activeNotices;
    if (activeTab === 'department') base = myDepartmentNotices;
    else if (activeTab === 'bookmarks') base = activeNotices.filter((n) => bookmarkedSet.has(n.id));

    const q = filters.query.trim().toLowerCase();
    const fromTime = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;

    const filtered = base.filter((notice) => {
      if (q) {
        const hay = `${notice.title} ${notice.summary} ${notice.content} ${notice.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeTab !== 'department' && filters.departmentId !== 'all') {
        if (!notice.targetAllDepartments && !notice.departmentIds.includes(filters.departmentId)) {
          return false;
        }
      }
      if (filters.category !== 'all' && notice.category !== filters.category) return false;
      if (filters.priority !== 'all' && notice.priority !== filters.priority) return false;
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

    const rank = { urgent: 0, important: 1, normal: 2 };
    return [...filtered].sort((a, b) => {
      if (filters.sortBy === 'priority' && rank[a.priority] !== rank[b.priority]) {
        return rank[a.priority] - rank[b.priority];
      }
      const ta = toDate(a.publishAt)?.getTime() ?? 0;
      const tb = toDate(b.publishAt)?.getTime() ?? 0;
      if (filters.sortBy === 'oldest') return ta - tb;
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return tb - ta;
    });
  }, [activeNotices, myDepartmentNotices, activeTab, bookmarkedSet, filters]);

  const totalPages = Math.max(1, Math.ceil(displayedNotices.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNotices = displayedNotices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleOpenNotice = async (notice: Notice) => {
    setSelectedNotice(notice);
    if (firebaseUser && !notice.isSample && !readNoticeIds.has(notice.id)) {
      try {
        await markNoticeAsRead(firebaseUser.uid, notice.id);
        await logUserActivity({
          userId: firebaseUser.uid,
          userName: studentProfile?.fullName || firebaseUser.displayName || 'Student',
          userRole: 'student',
          action: 'Read Notice',
          targetTitle: notice.title,
          departmentId: studentProfile?.departmentId,
        });
      } catch {
        // Ignore non-critical log failure
      }
    }
  };

  const handleMarkRead = async (notice: Notice) => {
    if (!firebaseUser) return;
    if (notice.isSample) {
      setReadNoticeIds((prev) => new Set(prev).add(notice.id));
      showToast('Marked sample notice as read for this session.', 'info');
      return;
    }
    try {
      await markNoticeAsRead(firebaseUser.uid, notice.id);
      showToast('Notice marked as read.', 'success');
    } catch {
      showToast('Could not mark notice as read.', 'error');
    }
  };

  const handleToggleBookmark = async (notice: Notice) => {
    if (!firebaseUser) return;
    if (notice.isSample) {
      showToast('Bookmarks are persisted for live published notices.', 'info');
      return;
    }
    const currentlySaved = bookmarkedSet.has(notice.id);
    try {
      await toggleBookmark(firebaseUser.uid, notice.id, currentlySaved);
      showToast(currentlySaved ? 'Removed from bookmarks.' : 'Saved to bookmarks.', 'success');
    } catch {
      showToast('Unable to update bookmark.', 'error');
    }
  };

  const handleMarkNotificationRead = async (notif: AppNotification) => {
    if (!firebaseUser) return;
    try {
      await markNotificationAsRead(firebaseUser.uid, notif.id);
    } catch {
      showToast('Could not mark notification as read.', 'error');
    }
  };

  const handleMarkAllNotifsRead = async () => {
    if (!firebaseUser || unreadNotifications.length === 0) return;
    try {
      await markAllNotificationsAsRead(
        firebaseUser.uid,
        unreadNotifications.map((n) => n.id)
      );
      showToast('All notifications marked as read.', 'success');
    } catch {
      showToast('Unable to mark all notifications as read.', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSavingProfile(true);
    try {
      await registerStudentAccount({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        fullName: fullName.trim(),
        usn: usn.trim(),
        departmentId,
        semester,
        section: section.trim(),
        emailNotifications,
      });
      await refreshProfiles();
      showToast('Student profile updated.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Profile update failed.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const navItems: SidebarItem[] = [
    { id: 'all', label: 'All Notices', icon: FileText, badge: unreadNoticesCount },
    { id: 'department', label: 'My Department', icon: Building2 },
    { id: 'bookmarks', label: 'Saved Notices', icon: Bookmark, badge: bookmarks.length },
    { id: 'events', label: 'Campus Events', icon: Calendar },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications.length },
    { id: 'profile', label: 'Profile & Alerts', icon: User },
  ];

  const breadcrumbMap: Record<string, string> = {
    all: 'All Published Notices',
    department: 'My Department Board',
    bookmarks: 'Saved & Bookmarked Notices',
    events: 'Campus Events',
    appointments: 'Book & View Appointments',
    notifications: 'Notification History',
    profile: 'Profile & Preferences',
  };

  const studentDeptObj = departments.find((d) => d.id === studentProfile?.departmentId);
  const deptName = studentDeptObj?.shortName || 'GAT Student';
  const ugDepartments = useMemo(
    () => departments.filter((d) => (d.programLevel || 'UG') === 'UG'),
    [departments]
  );
  const pgDepartments = useMemo(
    () => departments.filter((d) => d.programLevel === 'PG'),
    [departments]
  );

  return (
    <DashboardShell
      portalTitle="Student Portal"
      breadcrumb={breadcrumbMap[activeTab] || 'Dashboard'}
      userDisplayName={studentProfile?.fullName || firebaseUser?.displayName || 'Student'}
      userSubtitle={studentProfile ? `${studentProfile.usn} · ${deptName}` : firebaseUser?.email || ''}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(id) => {
        setActiveTab(id);
        setCurrentPage(1);
      }}
      onGoHome={onGoHome}
      unreadNotificationsCount={unreadNotifications.length}
      onOpenNotifications={() => setActiveTab('notifications')}
    >
      <div className="space-y-6">
        {/* Urgent Unread Alert Strip */}
        {urgentUnreadNotifs.length > 0 && activeTab !== 'notifications' && (
          <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-red-900 dark:text-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">Urgent Announcement:</span>
              <span>{urgentUnreadNotifs[0].title}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className="text-xs font-semibold text-red-800 dark:text-red-300 underline cursor-pointer"
            >
              View Notifications
            </button>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Published Notices</p>
            <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white">
              {activeNotices.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Unread Notices</p>
            <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-[#A47717] dark:text-[#DFB047]">
              {unreadNoticesCount}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Saved Bookmarks</p>
            <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white">
              {bookmarks.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming Events</p>
            <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-white">
              {events.filter((e) => e.status === 'upcoming').length}
            </p>
          </div>
        </div>

        {/* Notices Views */}
        {(activeTab === 'all' || activeTab === 'department' || activeTab === 'bookmarks') && (
          <div className="space-y-4">
            {activeTab === 'department' && studentProfile && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Department Notice Board
                  </p>
                  <p className="font-display text-sm sm:text-base font-bold text-[#0B1F3A] dark:text-white">
                    {studentDeptObj
                      ? `${studentDeptObj.name} (${studentDeptObj.code})`
                      : deptName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const mySemLabel = `Sem ${studentProfile.semester}`;
                    setFilters((prev) => ({
                      ...prev,
                      semester: prev.semester === mySemLabel ? 'all' : mySemLabel,
                    }));
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                    filters.semester === `Sem ${studentProfile.semester}`
                      ? 'bg-[#0B1F3A] text-white border-[#0B1F3A] dark:bg-[#C9972C] dark:text-[#07111F] dark:border-[#C9972C]'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {filters.semester === `Sem ${studentProfile.semester}`
                    ? `Showing Sem ${studentProfile.semester} Notices`
                    : `Filter by My Semester (Sem ${studentProfile.semester})`}
                </button>
              </div>
            )}

            <SearchFilterBar
              filters={filters}
              departments={departments}
              onChange={(next) => {
                setFilters(next);
                setCurrentPage(1);
              }}
              totalCount={displayedNotices.length}
            />

            {paginatedNotices.length === 0 ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-12 text-center space-y-2">
                <p className="font-display text-base font-semibold">
                  {activeTab === 'bookmarks'
                    ? 'No bookmarked notices yet'
                    : 'No notices match your current filter'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {activeTab === 'bookmarks'
                    ? 'Click Save on any notice card to bookmark important circulars here.'
                    : 'Try adjusting your search keywords or category filters.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    departments={departments}
                    isBookmarked={bookmarkedSet.has(notice.id)}
                    isRead={readNoticeIds.has(notice.id)}
                    onOpen={handleOpenNotice}
                    onToggleBookmark={handleToggleBookmark}
                    onMarkRead={handleMarkRead}
                  />
                ))}
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}

        {/* Events View */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}

        {/* Appointments View */}
        {activeTab === 'appointments' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <AppointmentBookingForm
                departments={departments}
                onBooked={(booking) => {
                  setMyAppointments((prev) => [booking, ...prev]);
                  loadMyAppointments();
                }}
              />
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold">My Appointment Requests</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {myAppointments.length} booking{myAppointments.length === 1 ? '' : 's'}
                  </p>
                </div>
                {loadingAppointments && <Loader2 className="w-4 h-4 animate-spin text-[#C9972C]" />}
              </div>

              {myAppointments.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  You have not submitted any campus appointment requests yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myAppointments.map((apt) => (
                    <div key={apt.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {apt.preferred_date} · {apt.preferred_time}
                        </span>
                        <span className="font-semibold capitalize text-[#A47717] dark:text-[#DFB047]">
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                        {apt.appointment_office}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {apt.department_name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {apt.purpose}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications View */}
        {activeTab === 'notifications' && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-bold">Personal Notification History</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {unreadNotifications.length} unread of {relevantNotifications.length} total
                </p>
              </div>
              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllNotifsRead}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#C9972C]" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>

            {relevantNotifications.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                No notifications received yet. New announcements published by administrators or
                faculty will appear here automatically.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {relevantNotifications.map((notif) => {
                  const isNotifRead = readNotificationIds.has(notif.id);
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isNotifRead ? 'opacity-70' : 'bg-slate-50/70 dark:bg-[#0A172A]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          {notif.priority === 'urgent' && (
                            <span className="font-semibold text-red-700 dark:text-red-400">
                              Urgent
                            </span>
                          )}
                          {notif.priority === 'important' && (
                            <span className="font-semibold text-[#A47717] dark:text-[#DFB047]">
                              Important
                            </span>
                          )}
                          {notif.priority !== 'normal' && <span aria-hidden="true">·</span>}
                          <span className="font-mono tabular-nums">
                            {formatDateTime(notif.createdAt)}
                          </span>
                          {!isNotifRead && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#0B1F3A] dark:text-[#DFB047]">
                                Unread
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                          {notif.title}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                          {notif.message}
                        </p>
                      </div>
                      {!isNotifRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkNotificationRead(notif)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shrink-0 self-start sm:self-center cursor-pointer"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile & Notification Preferences */}
        {activeTab === 'profile' && (
          <form
            onSubmit={handleSaveProfile}
            className="max-w-2xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-6 space-y-5"
          >
            <div>
              <h2 className="font-display text-lg font-bold">Student Profile & Alert Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Keep your USN, department, and notification preferences up to date.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">USN</label>
                <input
                  type="text"
                  required
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Department / Program</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                >
                  {ugDepartments.length > 0 && (
                    <optgroup label="Undergraduate Programs (B.E.)">
                      {ugDepartments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {pgDepartments.length > 0 && (
                    <optgroup label="Postgraduate Programs (M.Tech / MBA)">
                      {pgDepartments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Sem {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold mb-1">Section</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium pt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <span>Opt in to email announcement notifications</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
              >
                {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <NoticeDetailModal
        notice={selectedNotice}
        departments={departments}
        isBookmarked={selectedNotice ? bookmarkedSet.has(selectedNotice.id) : false}
        isRead={selectedNotice ? readNoticeIds.has(selectedNotice.id) : false}
        onClose={() => setSelectedNotice(null)}
        onToggleBookmark={handleToggleBookmark}
        onMarkRead={handleMarkRead}
      />
    </DashboardShell>
  );
}
