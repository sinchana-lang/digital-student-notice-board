import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Database,
  Edit3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Pin,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { DashboardShell, type SidebarItem } from '../components/common/DashboardShell';
import { EventCard } from '../components/common/EventCard';
import { EventFormModal } from '../components/common/EventFormModal';
import { NoticeDetailModal } from '../components/common/NoticeDetailModal';
import { NoticeFormModal } from '../components/common/NoticeFormModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  APPOINTMENT_SETUP_SQL,
  fetchAllAppointments,
  SupabaseAppointmentError,
  updateAppointmentStatus,
} from '../services/appointmentService';
import {
  createEvent,
  deleteEvent,
  seedSampleEventsToFirestore,
  updateEvent,
} from '../services/eventService';
import {
  archiveExpiredNotices,
  createNotice,
  deleteNotice,
  dispatchNoticeNotification,
  publishDueScheduledNotices,
  seedSampleNoticesToFirestore,
  subscribeActivityLogs,
  subscribeAllNoticesAdmin,
  updateNotice,
} from '../services/noticeService';
import {
  deleteDepartment,
  saveDepartment,
  seedDefaultDepartments,
  subscribeAllDepartmentsAdmin,
  subscribeAllFaculty,
  subscribeAllStudents,
  subscribeAllUsersAdmin,
  updateFacultyPermissions,
  updateUserAccountStatus,
} from '../services/userService';
import type {
  ActivityLog,
  AppointmentBooking,
  AppointmentStatus,
  CampusEvent,
  Department,
  FacultyProfile,
  Notice,
  NoticePriority,
  NoticeStatus,
  StudentProfile,
  UserProfile,
} from '../types';
import { DEFAULT_DEPARTMENTS } from '../utils/constants';
import { formatDate, formatDateTime, isNoticeExpired } from '../utils/formatters';

interface AdminDashboardProps {
  events: CampusEvent[];
  onGoHome: () => void;
}

export function AdminDashboard({ events, onGoHome }: AdminDashboardProps) {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [noticeStatusFilter, setNoticeStatusFilter] = useState<NoticeStatus | 'all'>('all');
  const [noticeSearch, setNoticeSearch] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [noticeFormOpen, setNoticeFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);

  const [seeding, setSeeding] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Department manager form
  const [deptId, setDeptId] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptShortName, setDeptShortName] = useState('');
  const [deptProgramLevel, setDeptProgramLevel] = useState<'UG' | 'PG'>('UG');
  const [deptHod, setDeptHod] = useState('');
  const [deptOrder, setDeptOrder] = useState(14);
  const [deptActive, setDeptActive] = useState(true);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [savingDept, setSavingDept] = useState(false);
  const [syncingDepts, setSyncingDepts] = useState(false);

  // Broadcast notification form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifPriority, setNotifPriority] = useState<NoticePriority>('important');
  const [notifDept, setNotifDept] = useState('all');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Supabase Appointment Bookings state
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentsErrorCode, setAppointmentsErrorCode] = useState<string | null>(null);
  const [appointmentsErrorMessage, setAppointmentsErrorMessage] = useState<string | null>(null);
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<AppointmentStatus | 'all'>('all');

  useEffect(() => {
    const unsubs = [
      subscribeAllNoticesAdmin(setAllNotices),
      subscribeAllDepartmentsAdmin(setDepartments),
      subscribeAllStudents(setStudents),
      subscribeAllFaculty(setFacultyList),
      subscribeAllUsersAdmin(setUsers),
      subscribeActivityLogs(setActivityLogs),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    setAppointmentsErrorCode(null);
    setAppointmentsErrorMessage(null);
    try {
      const rows = await fetchAllAppointments();
      setAppointments(rows);
    } catch (err) {
      if (err instanceof SupabaseAppointmentError) {
        setAppointmentsErrorCode(err.code || 'ERROR');
        setAppointmentsErrorMessage(err.message);
      } else {
        setAppointmentsErrorCode('ERROR');
        setAppointmentsErrorMessage('Unable to fetch appointment bookings.');
      }
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const mergedDepartments: Department[] = useMemo(() => {
    const map = new Map<string, Department>();
    for (const def of DEFAULT_DEPARTMENTS) {
      map.set(def.id, def as Department);
    }
    for (const live of departments) {
      map.set(live.id, live);
    }
    return Array.from(map.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [departments]);

  const stats = useMemo(() => {
    const published = allNotices.filter((n) => n.status === 'published' && !isNoticeExpired(n)).length;
    const scheduled = allNotices.filter((n) => n.status === 'scheduled').length;
    const archived = allNotices.filter((n) => n.status === 'archived' || isNoticeExpired(n)).length;
    return {
      totalNotices: allNotices.length,
      published,
      scheduled,
      archived,
      studentsCount: students.length,
      facultyCount: facultyList.length,
      upcomingEvents: events.filter((e) => e.status === 'upcoming').length,
    };
  }, [allNotices, students, facultyList, events]);

  const filteredNotices = useMemo(() => {
    const q = noticeSearch.trim().toLowerCase();
    return allNotices.filter((n) => {
      if (noticeStatusFilter !== 'all' && n.status !== noticeStatusFilter) return false;
      if (q && !`${n.title} ${n.category} ${n.authorName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allNotices, noticeStatusFilter, noticeSearch]);

  const handleSeedInitialData = async () => {
    if (!firebaseUser) return;
    setSeeding(true);
    try {
      const [deptCount, noticeCount, eventCount] = await Promise.all([
        seedDefaultDepartments(),
        seedSampleNoticesToFirestore(
          firebaseUser.uid,
          firebaseUser.displayName || 'GAT Administrator'
        ),
        seedSampleEventsToFirestore(
          firebaseUser.uid,
          firebaseUser.displayName || 'GAT Administrator'
        ),
      ]);
      showToast(
        `Initialized ${deptCount} departments, ${noticeCount} sample notices, and ${eventCount} sample events.`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Initialization failed.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleSyncLifecycle = async () => {
    setSyncing(true);
    try {
      const [archivedCount, publishedCount] = await Promise.all([
        archiveExpiredNotices(allNotices),
        publishDueScheduledNotices(allNotices),
      ]);
      showToast(
        `Lifecycle sync complete: ${publishedCount} scheduled published, ${archivedCount} expired archived.`,
        'success'
      );
    } catch {
      showToast('Lifecycle sync encountered an error.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveNotice = async (
    data: Parameters<typeof NoticeFormModal>[0]['onSubmit'] extends (d: infer T) => Promise<void>
      ? T
      : never
  ) => {
    if (!firebaseUser) return;
    if (editingNotice) {
      await updateNotice(editingNotice.id, { ...data, isAdminAction: true });
      showToast('Notice updated.', 'success');
    } else {
      await createNotice({
        ...data,
        authorId: firebaseUser.uid,
        authorName: firebaseUser.displayName || 'GAT Administration',
        authorRole: 'admin',
        isSample: false,
      });
      showToast('Notice saved and published.', 'success');
    }
  };

  const handleTogglePin = async (notice: Notice) => {
    try {
      await updateNotice(notice.id, { pinned: !notice.pinned, isAdminAction: true });
      showToast(notice.pinned ? 'Notice unpinned.' : 'Notice pinned to top.', 'success');
    } catch {
      showToast('Could not update pin state.', 'error');
    }
  };

  const handleDeleteNotice = async (notice: Notice) => {
    try {
      await deleteNotice(notice.id);
      showToast('Notice deleted.', 'success');
    } catch {
      showToast('Could not delete notice.', 'error');
    }
  };

  const handleSaveEvent = async (
    data: Parameters<typeof EventFormModal>[0]['onSubmit'] extends (d: infer T) => Promise<void>
      ? T
      : never
  ) => {
    if (!firebaseUser) return;
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
      showToast('Event updated.', 'success');
    } else {
      await createEvent({
        ...data,
        authorId: firebaseUser.uid,
        authorName: firebaseUser.displayName || 'GAT Administration',
        isSample: false,
      });
      showToast('Event published.', 'success');
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode.trim() || !deptName.trim() || !deptShortName.trim()) return;
    setSavingDept(true);
    try {
      const targetId = editingDeptId || deptId.trim() || deptCode.trim().toLowerCase();
      await saveDepartment(
        {
          id: targetId,
          code: deptCode.trim().toUpperCase(),
          name: deptName.trim(),
          shortName: deptShortName.trim(),
          programLevel: deptProgramLevel,
          hodName: deptHod.trim(),
          active: deptActive,
          displayOrder: deptOrder,
        },
        !editingDeptId
      );
      showToast(editingDeptId ? 'Department updated.' : 'Department added.', 'success');
      setEditingDeptId(null);
      setDeptId('');
      setDeptCode('');
      setDeptName('');
      setDeptShortName('');
      setDeptProgramLevel('UG');
      setDeptHod('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save department.', 'error');
    } finally {
      setSavingDept(false);
    }
  };

  const handleSyncOfficialDepartments = async () => {
    setSyncingDepts(true);
    try {
      const added = await seedDefaultDepartments();
      showToast(
        `Synced all 13 official GAT programs (10 UG + 3 PG). ${added} newly added to Firestore.`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Department sync failed.', 'error');
    } finally {
      setSyncingDepts(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setSendingNotif(true);
    try {
      await dispatchNoticeNotification({
        title: notifTitle.trim(),
        summary: notifMessage.trim(),
        priority: notifPriority,
        departmentId: notifDept,
        recipientId: 'all',
      });
      setNotifTitle('');
      setNotifMessage('');
      showToast('Notification dispatched to students.', 'success');
    } catch {
      showToast('Failed to send notification.', 'error');
    } finally {
      setSendingNotif(false);
    }
  };

  const navItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'notices', label: 'Manage Notices', icon: FileText, badge: allNotices.length },
    { id: 'events', label: 'Manage Events', icon: Calendar, badge: events.length },
    { id: 'students', label: 'Students', icon: GraduationCap, badge: students.length },
    {
      id: 'faculty',
      label: 'Faculty Permissions',
      icon: Users,
      badge: facultyList.filter((f) => !f.approved).length,
    },
    { id: 'departments', label: 'Departments', icon: Building2, badge: mergedDepartments.length },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck, badge: appointments.filter((a) => a.status === 'pending').length },
    { id: 'notifications', label: 'Alerts & Activity', icon: Bell },
  ];

  const breadcrumbMap: Record<string, string> = {
    overview: 'Command Overview',
    notices: 'Notice Board Management',
    events: 'Campus Events Management',
    students: 'Student Directory',
    faculty: 'Faculty Publishing Control',
    departments: 'Academic Departments',
    appointments: 'Campus Appointment Bookings',
    notifications: 'Notification Dispatch & Student Activity',
  };

  return (
    <DashboardShell
      portalTitle="Administrator Console"
      breadcrumb={breadcrumbMap[activeTab] || 'Overview'}
      userDisplayName={firebaseUser?.displayName || 'GAT Administrator'}
      userSubtitle={firebaseUser?.email || ''}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onGoHome={onGoHome}
      primaryAction={
        <button
          type="button"
          onClick={() => {
            setEditingNotice(null);
            setNoticeFormOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] hover:opacity-90 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Notice</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Notices</p>
                <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums">
                  {stats.totalNotices}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Active Published</p>
                <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {stats.published}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled / Archived</p>
                <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums">
                  {stats.scheduled} / {stats.archived}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Students / Faculty</p>
                <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums">
                  {stats.studentsCount} / {stats.facultyCount}
                </p>
              </div>
            </div>

            {/* Database Initialization & Maintenance Actions */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-bold">
                  Database Setup & Lifecycle Maintenance
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Seed initial GAT departments & sample circulars into Firestore, or publish due
                  scheduled notices and archive expired circulars.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSeedInitialData}
                  disabled={seeding}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {seeding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 text-[#C9972C]" />
                  )}
                  <span>Seed Departments & Samples</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncLifecycle}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>Sync Expiry & Scheduled</span>
                </button>
              </div>
            </div>

            {/* Recent Student Activity */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-display text-base font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#C9972C]" />
                  <span>Recent Student Activity</span>
                </h2>
              </div>
              {activityLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No student activity recorded yet. Activity appears as students read notices.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activityLogs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm"
                    >
                      <div>
                        <span className="font-semibold">{log.userName}</span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">{log.action}:</span>{' '}
                        <span className="font-medium">{log.targetTitle}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manage Notices */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B1728] border border-slate-200 dark:border-slate-800 overflow-x-auto">
                {(['all', 'published', 'scheduled', 'draft', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNoticeStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize cursor-pointer whitespace-nowrap ${
                      noticeStatusFilter === st
                        ? 'bg-white dark:bg-[#0D1C31] text-[#0B1F3A] dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={noticeSearch}
                onChange={(e) => setNoticeSearch(e.target.value)}
                placeholder="Filter notices..."
                className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1C31] sm:w-64"
              />
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#091526] text-xs text-slate-500">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Title</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Priority</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Publish Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredNotices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                          No notices found. Click "Create Notice" or seed sample data in Overview.
                        </td>
                      </tr>
                    ) : (
                      filteredNotices.map((n) => (
                        <tr key={n.id} className="hover:bg-slate-50/70 dark:hover:bg-[#0A172A]">
                          <td className="py-3 px-4 font-medium max-w-xs">
                            <button
                              type="button"
                              onClick={() => setSelectedNotice(n)}
                              className="text-left hover:underline cursor-pointer line-clamp-1"
                            >
                              {n.pinned ? '📌 ' : ''}
                              {n.title}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-xs">{n.category}</td>
                          <td className="py-3 px-4 text-xs font-semibold capitalize">
                            <span
                              className={
                                n.priority === 'urgent'
                                  ? 'text-red-600 dark:text-red-400'
                                  : n.priority === 'important'
                                  ? 'text-[#A47717] dark:text-[#DFB047]'
                                  : 'text-slate-600 dark:text-slate-300'
                              }
                            >
                              {n.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs capitalize">{n.status}</td>
                          <td className="py-3 px-4 text-xs font-mono tabular-nums">
                            {formatDate(n.publishAt)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleTogglePin(n)}
                              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title={n.pinned ? 'Unpin notice' : 'Pin notice'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${n.pinned ? 'text-[#C9972C]' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNotice(n);
                                setNoticeFormOpen(true);
                              }}
                              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Edit notice"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNotice(n)}
                              className="p-1.5 rounded border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Delete notice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Manage Events */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Campus Events</h2>
              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setEventFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => (
                <div key={evt.id} className="space-y-2">
                  <EventCard event={evt} />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEvent(evt);
                        setEventFormOpen(true);
                      }}
                      className="flex-1 py-1.5 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Edit Event
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(evt.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-red-200 text-red-600 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students Management */}
        {activeTab === 'students' && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-display text-base font-bold">Registered Student Accounts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#091526] text-xs text-slate-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">USN</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Semester</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Account Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                        No students registered yet.
                      </td>
                    </tr>
                  ) : (
                    students.map((st) => {
                      const userRec = users.find((u) => u.uid === st.uid);
                      const deptName =
                        mergedDepartments.find((d) => d.id === st.departmentId)?.shortName ||
                        st.departmentId.toUpperCase();
                      const isSuspended = userRec?.status === 'suspended';
                      return (
                        <tr key={st.uid}>
                          <td className="py-3 px-4 font-medium">{st.fullName}</td>
                          <td className="py-3 px-4 font-mono text-xs">{st.usn}</td>
                          <td className="py-3 px-4 text-xs">{deptName}</td>
                          <td className="py-3 px-4 font-mono text-xs">Sem {st.semester}</td>
                          <td className="py-3 px-4 text-xs capitalize">
                            {userRec?.status || 'active'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                updateUserAccountStatus(
                                  st.uid,
                                  isSuspended ? 'active' : 'suspended'
                                )
                              }
                              className="px-3 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              {isSuspended ? 'Activate' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Faculty Permissions */}
        {activeTab === 'faculty' && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-display text-base font-bold">
                Faculty Accounts & Publishing Permissions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Approve faculty profiles and grant or revoke notice publishing rights.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#091526] text-xs text-slate-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Faculty Name</th>
                    <th className="py-3 px-4 font-semibold">Employee ID</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Account Approved</th>
                    <th className="py-3 px-4 font-semibold">Can Publish</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {facultyList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                        No faculty registrations submitted yet.
                      </td>
                    </tr>
                  ) : (
                    facultyList.map((fac) => {
                      const deptName =
                        mergedDepartments.find((d) => d.id === fac.departmentId)?.shortName ||
                        fac.departmentId.toUpperCase();
                      return (
                        <tr key={fac.uid}>
                          <td className="py-3 px-4">
                            <p className="font-medium">{fac.fullName}</p>
                            <p className="text-xs text-slate-500">{fac.designation}</p>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">{fac.employeeId}</td>
                          <td className="py-3 px-4 text-xs">{deptName}</td>
                          <td className="py-3 px-4 text-xs font-medium">
                            {fac.approved ? (
                              <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                              </span>
                            ) : (
                              <span className="text-amber-700 dark:text-amber-400">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium">
                            {fac.canPublish ? 'Enabled' : 'Restricted'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                updateFacultyPermissions(
                                  fac.uid,
                                  !fac.approved,
                                  !fac.approved ? true : false
                                )
                              }
                              className="px-3 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                              {fac.approved ? 'Revoke Approval' : 'Approve & Enable'}
                            </button>
                            {fac.approved && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateFacultyPermissions(fac.uid, true, !fac.canPublish)
                                }
                                className="px-3 py-1 text-xs font-medium rounded bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
                              >
                                {fac.canPublish ? 'Disable Publishing' : 'Enable Publishing'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Configurable Departments */}
        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveDepartment}
              className="lg:col-span-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-5 space-y-4 self-start"
            >
              <h2 className="font-display text-base font-bold">
                {editingDeptId ? 'Edit Department' : 'Add Department'}
              </h2>
              {!editingDeptId && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Department Slug ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., cse"
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="CSE"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Short Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="CSE"
                    value={deptShortName}
                    onChange={(e) => setDeptShortName(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Full Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold mb-1">Program Level</label>
                  <select
                    value={deptProgramLevel}
                    onChange={(e) => setDeptProgramLevel(e.target.value as 'UG' | 'PG')}
                    className="w-full h-9 px-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                  >
                    <option value="UG">UG (B.E.)</option>
                    <option value="PG">PG (M.Tech / MBA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Order</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={deptOrder}
                    onChange={(e) => setDeptOrder(Number(e.target.value))}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-medium pt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deptActive}
                    onChange={(e) => setDeptActive(e.target.checked)}
                  />
                  <span>Active</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={savingDept}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
                >
                  {editingDeptId ? 'Update Department' : 'Save Department'}
                </button>
                {editingDeptId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDeptId(null);
                      setDeptCode('');
                      setDeptName('');
                      setDeptShortName('');
                      setDeptProgramLevel('UG');
                    }}
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="lg:col-span-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold">Configured GAT Departments & Programs</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    10 Undergraduate (B.E.) and 3 Postgraduate (M.Tech / MBA) programs supported across all filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncOfficialDepartments}
                  disabled={syncingDepts}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {syncingDepts ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5 text-[#C9972C]" />
                  )}
                  <span>Sync Official 13 Programs</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#091526] text-xs text-slate-500">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Code</th>
                      <th className="py-3 px-4 font-semibold">Level</th>
                      <th className="py-3 px-4 font-semibold">Department / Program Name</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mergedDepartments.map((d) => {
                      const isLive = departments.some((ld) => ld.id === d.id);
                      return (
                        <tr key={d.id}>
                          <td className="py-3 px-4 font-mono text-xs font-semibold whitespace-nowrap">{d.code}</td>
                          <td className="py-3 px-4 font-mono text-xs">
                            {d.programLevel || 'UG'}
                          </td>
                          <td className="py-3 px-4">
                            <span>{d.name}</span>
                            {!isLive && (
                              <span className="ml-2 text-[11px] font-mono text-amber-700 dark:text-amber-400">
                                (Pending Firestore sync)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {d.active ? 'Active' : 'Inactive'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDeptId(isLive ? d.id : null);
                                setDeptId(d.id);
                                setDeptCode(d.code);
                                setDeptName(d.name);
                                setDeptShortName(d.shortName);
                                setDeptProgramLevel(d.programLevel || 'UG');
                                setDeptHod(d.hodName || '');
                                setDeptOrder(d.displayOrder);
                                setDeptActive(d.active);
                              }}
                              className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                              Edit
                            </button>
                            {isLive && (
                              <button
                                type="button"
                                onClick={() => deleteDepartment(d.id)}
                                className="px-2.5 py-1 text-xs rounded border border-red-200 text-red-600 cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Supabase Appointment Bookings */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B1728] border border-slate-200 dark:border-slate-800 overflow-x-auto">
                {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAppointmentStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize cursor-pointer whitespace-nowrap ${
                      appointmentStatusFilter === st
                        ? 'bg-white dark:bg-[#0D1C31] text-[#0B1F3A] dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={loadAppointments}
                disabled={loadingAppointments}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAppointments ? 'animate-spin' : ''}`} />
                <span>Refresh Bookings</span>
              </button>
            </div>

            {appointmentsErrorCode === 'TABLE_MISSING' && (
              <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200">
                      Supabase Table Setup Required (`public.appointments`)
                    </h3>
                    <p className="text-xs text-amber-900 dark:text-amber-300 mt-0.5">
                      Run this SQL once in your Supabase Dashboard SQL Editor (project{' '}
                      <span className="font-mono">awurqbvqtqgydkvfsnbl</span>) so appointment
                      submissions save directly into your Supabase database.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(APPOINTMENT_SETUP_SQL);
                      showToast('SQL script copied to clipboard.', 'success');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                  {APPOINTMENT_SETUP_SQL}
                </pre>
              </div>
            )}

            {appointmentsErrorCode && appointmentsErrorCode !== 'TABLE_MISSING' && (
              <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-xs sm:text-sm text-red-900 dark:text-red-200">
                {appointmentsErrorMessage}
              </div>
            )}

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-display text-base font-bold">Submitted Appointment Bookings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#091526] text-xs text-slate-500">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Applicant</th>
                      <th className="py-3 px-4 font-semibold">Department & Office</th>
                      <th className="py-3 px-4 font-semibold">Preferred Slot</th>
                      <th className="py-3 px-4 font-semibold">Purpose</th>
                      <th className="py-3 px-4 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {appointments.filter(
                      (a) =>
                        appointmentStatusFilter === 'all' || a.status === appointmentStatusFilter
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                          {loadingAppointments
                            ? 'Loading appointments...'
                            : 'No appointment bookings found.'}
                        </td>
                      </tr>
                    ) : (
                      appointments
                        .filter(
                          (a) =>
                            appointmentStatusFilter === 'all' ||
                            a.status === appointmentStatusFilter
                        )
                        .map((apt) => (
                          <tr key={apt.id} className="hover:bg-slate-50/70 dark:hover:bg-[#0A172A]">
                            <td className="py-3 px-4">
                              <p className="font-medium text-[#0B1F3A] dark:text-white">
                                {apt.full_name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {apt.applicant_type}
                                {apt.usn_or_id ? ` · ${apt.usn_or_id}` : ''}
                              </p>
                              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                {apt.email} · {apt.phone}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <p className="font-semibold text-[#0B1F3A] dark:text-slate-200">
                                {apt.appointment_office}
                              </p>
                              <p className="text-slate-500 dark:text-slate-400">
                                {apt.department_name}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono tabular-nums whitespace-nowrap">
                              <p>{apt.preferred_date}</p>
                              <p className="text-slate-500 dark:text-slate-400">
                                {apt.preferred_time}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs max-w-xs text-slate-600 dark:text-slate-300">
                              {apt.purpose}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <select
                                value={apt.status}
                                onChange={async (e) => {
                                  const nextStatus = e.target.value as AppointmentStatus;
                                  try {
                                    await updateAppointmentStatus(apt.id, nextStatus);
                                    setAppointments((prev) =>
                                      prev.map((item) =>
                                        item.id === apt.id ? { ...item, status: nextStatus } : item
                                      )
                                    );
                                    showToast(`Appointment marked as ${nextStatus}.`, 'success');
                                  } catch (err) {
                                    showToast(
                                      err instanceof Error
                                        ? err.message
                                        : 'Unable to update status.',
                                      'error'
                                    );
                                  }
                                }}
                                aria-label={`Status for ${apt.full_name}`}
                                className="h-8 px-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] capitalize"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Broadcast Notifications & Activity */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSendBroadcast}
              className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-5 space-y-4 self-start"
            >
              <h2 className="font-display text-base font-bold">Send Instant Notification Alert</h2>
              <div>
                <label className="block text-xs font-semibold mb-1">Alert Title *</label>
                <input
                  type="text"
                  required
                  maxLength={220}
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g., Campus Weather / Schedule Advisory"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Message *</label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Priority</label>
                  <select
                    value={notifPriority}
                    onChange={(e) => setNotifPriority(e.target.value as NoticePriority)}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Target Department</label>
                  <select
                    value={notifDept}
                    onChange={(e) => setNotifDept(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                  >
                    <option value="all">All Departments</option>
                    <optgroup label="Undergraduate Programs (B.E.)">
                      {mergedDepartments
                        .filter((d) => (d.programLevel || 'UG') === 'UG')
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Postgraduate Programs (M.Tech / MBA)">
                      {mergedDepartments
                        .filter((d) => d.programLevel === 'PG')
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={sendingNotif}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
              >
                {sendingNotif ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Broadcast Notification</span>
              </button>
            </form>

            <div className="lg:col-span-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-display text-base font-bold">Student Activity Audit Log</h2>
              </div>
              {activityLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No student interactions logged yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="px-5 py-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-semibold">{log.userName}</span> · {log.action} ·{' '}
                        <span className="text-slate-600 dark:text-slate-300">{log.targetTitle}</span>
                      </div>
                      <span className="font-mono text-slate-500 shrink-0 tabular-nums">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <NoticeFormModal
        open={noticeFormOpen}
        editingNotice={editingNotice}
        departments={mergedDepartments}
        allowPinning={true}
        onClose={() => setNoticeFormOpen(false)}
        onSubmit={handleSaveNotice}
      />

      <EventFormModal
        open={eventFormOpen}
        editingEvent={editingEvent}
        departments={mergedDepartments}
        onClose={() => setEventFormOpen(false)}
        onSubmit={handleSaveEvent}
      />

      <NoticeDetailModal
        notice={selectedNotice}
        departments={mergedDepartments}
        onClose={() => setSelectedNotice(null)}
      />
    </DashboardShell>
  );
}
