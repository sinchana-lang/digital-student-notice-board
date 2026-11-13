import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  Edit3,
  FileText,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  User,
} from 'lucide-react';
import { DashboardShell, type SidebarItem } from '../components/common/DashboardShell';
import { EventCard } from '../components/common/EventCard';
import { EventFormModal } from '../components/common/EventFormModal';
import { NoticeCard } from '../components/common/NoticeCard';
import { NoticeDetailModal } from '../components/common/NoticeDetailModal';
import { NoticeFormModal } from '../components/common/NoticeFormModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createEvent, deleteEvent, updateEvent } from '../services/eventService';
import {
  createNotice,
  deleteNotice,
  subscribeAuthorNotices,
  updateNotice,
} from '../services/noticeService';
import { registerFacultyAccount } from '../services/userService';
import type { CampusEvent, Department, Notice } from '../types';
import { formatDate, isNoticePublishedAndActive } from '../utils/formatters';

interface FacultyDashboardProps {
  publishedNotices: Notice[];
  events: CampusEvent[];
  departments: Department[];
  onGoHome: () => void;
}

export function FacultyDashboard({
  publishedNotices,
  events,
  departments,
  onGoHome,
}: FacultyDashboardProps) {
  const { firebaseUser, facultyProfile, isAdmin, refreshProfiles } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('my-notices');
  const [myNotices, setMyNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [noticeFormOpen, setNoticeFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);

  // Faculty profile form
  const [fullName, setFullName] = useState(facultyProfile?.fullName || firebaseUser?.displayName || '');
  const [employeeId, setEmployeeId] = useState(facultyProfile?.employeeId || '');
  const [designation, setDesignation] = useState(facultyProfile?.designation || 'Assistant Professor');
  const [departmentId, setDepartmentId] = useState(facultyProfile?.departmentId || departments[0]?.id || 'cse');
  const [savingProfile, setSavingProfile] = useState(false);

  const canPublish = isAdmin || Boolean(facultyProfile?.approved && facultyProfile?.canPublish);

  useEffect(() => {
    if (facultyProfile) {
      setFullName(facultyProfile.fullName);
      setEmployeeId(facultyProfile.employeeId);
      setDesignation(facultyProfile.designation);
      setDepartmentId(facultyProfile.departmentId);
    }
  }, [facultyProfile]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeAuthorNotices(firebaseUser.uid, setMyNotices);
  }, [firebaseUser]);

  const departmentBoardNotices = useMemo(() => {
    const deptId = facultyProfile?.departmentId;
    return publishedNotices.filter(
      (n) =>
        isNoticePublishedAndActive(n) &&
        (!deptId || n.targetAllDepartments || n.departmentIds.includes(deptId))
    );
  }, [publishedNotices, facultyProfile]);

  const myEvents = useMemo(
    () => events.filter((e) => e.authorId === firebaseUser?.uid),
    [events, firebaseUser]
  );

  const handleSaveNotice = async (data: Parameters<typeof NoticeFormModal>[0]['onSubmit'] extends (d: infer T) => Promise<void> ? T : never) => {
    if (!firebaseUser || !canPublish) {
      throw new Error('Publishing requires Administrator approval.');
    }
    if (editingNotice) {
      await updateNotice(editingNotice.id, {
        ...data,
        isAdminAction: isAdmin,
      });
      showToast('Notice updated successfully.', 'success');
    } else {
      await createNotice({
        ...data,
        authorId: firebaseUser.uid,
        authorName: facultyProfile?.fullName || firebaseUser.displayName || 'Faculty Coordinator',
        authorRole: isAdmin ? 'admin' : 'faculty',
        isSample: false,
      });
      showToast('Notice published to selected department students.', 'success');
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

  const handleSaveEvent = async (data: Parameters<typeof EventFormModal>[0]['onSubmit'] extends (d: infer T) => Promise<void> ? T : never) => {
    if (!firebaseUser || !canPublish) {
      throw new Error('Publishing events requires Administrator approval.');
    }
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
      showToast('Event updated.', 'success');
    } else {
      await createEvent({
        ...data,
        authorId: firebaseUser.uid,
        authorName: facultyProfile?.fullName || firebaseUser.displayName || 'Faculty',
        isSample: false,
      });
      showToast('Event published.', 'success');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSavingProfile(true);
    try {
      await registerFacultyAccount({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        fullName: fullName.trim(),
        employeeId: employeeId.trim(),
        designation: designation.trim(),
        departmentId,
        isAdminUser: isAdmin,
      });
      await refreshProfiles();
      showToast('Faculty profile updated.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const navItems: SidebarItem[] = [
    { id: 'my-notices', label: 'My Notices', icon: FileText, badge: myNotices.length },
    { id: 'dept-board', label: 'Department Feed', icon: Building2 },
    { id: 'events', label: 'My Events', icon: Calendar, badge: myEvents.length },
    { id: 'profile', label: 'Faculty Profile', icon: User },
  ];

  const facultyDeptObj = departments.find((d) => d.id === facultyProfile?.departmentId);
  const deptShort = facultyDeptObj?.shortName || 'Faculty';
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
      portalTitle="Faculty Portal"
      breadcrumb={
        activeTab === 'my-notices'
          ? 'My Published Circulars'
          : activeTab === 'dept-board'
          ? 'Department Notice Board'
          : activeTab === 'events'
          ? 'Department Events'
          : 'Faculty Profile'
      }
      userDisplayName={facultyProfile?.fullName || firebaseUser?.displayName || 'Faculty'}
      userSubtitle={
        facultyProfile
          ? `${facultyProfile.designation} · ${deptShort}`
          : firebaseUser?.email || ''
      }
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onGoHome={onGoHome}
      primaryAction={
        canPublish ? (
          <button
            type="button"
            onClick={() => {
              setEditingNotice(null);
              setNoticeFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] hover:opacity-90 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Notice</span>
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {!canPublish && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-semibold">Faculty Publishing Permission Pending</p>
              <p>
                Your faculty profile is registered, and an Administrator must approve and enable your
                publishing permissions before you can create department notices or events.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'my-notices' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-bold">My Department Notices & Circulars</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Manage notices authored by you and send department announcements to students.
                </p>
              </div>
            </div>

            {myNotices.length === 0 ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-12 text-center space-y-3">
                <p className="font-display text-base font-semibold">No notices created yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {canPublish
                    ? 'Click "New Notice" to publish an academic circular or upload materials.'
                    : 'Once an administrator enables your publishing permission, you can create notices here.'}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#091526] text-xs text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Notice Title</th>
                        <th className="py-3 px-4 font-semibold">Category</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Publish Date</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {myNotices.map((n) => (
                        <tr key={n.id} className="hover:bg-slate-50/60 dark:hover:bg-[#0A172A]">
                          <td className="py-3 px-4 font-medium">
                            <button
                              type="button"
                              onClick={() => setSelectedNotice(n)}
                              className="text-left hover:underline cursor-pointer"
                            >
                              {n.title}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                            {n.category}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium capitalize">{n.status}</td>
                          <td className="py-3 px-4 text-xs font-mono tabular-nums">
                            {formatDate(n.publishAt)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {canPublish && n.status !== 'archived' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNotice(n);
                                  setNoticeFormOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 mr-2 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
                            {canPublish && (
                              <button
                                type="button"
                                onClick={() => handleDeleteNotice(n)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dept-board' && (
          <div className="space-y-4">
            <h1 className="font-display text-xl font-bold">
              Published Notices — {facultyDeptObj ? `${facultyDeptObj.name} (${facultyDeptObj.code})` : deptShort}
            </h1>
            {departmentBoardNotices.map((n) => (
              <NoticeCard
                key={n.id}
                notice={n}
                departments={departments}
                onOpen={setSelectedNotice}
              />
            ))}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-xl font-bold">My Published Events</h1>
              {canPublish && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setEventFormOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Event</span>
                </button>
              )}
            </div>
            {myEvents.length === 0 ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-10 text-center text-sm text-slate-500">
                No department events authored by you yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEvents.map((evt) => (
                  <div key={evt.id} className="space-y-2">
                    <EventCard event={evt} />
                    {canPublish && (
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
                          className="px-3 py-1.5 text-xs font-medium rounded border border-red-200 text-red-700 dark:text-red-400 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <form
            onSubmit={handleSaveProfile}
            className="max-w-xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold">Faculty Profile</h2>
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
                <label className="block text-xs font-semibold mb-1">Employee ID</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                />
              </div>
              <div>
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
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
            >
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Profile</span>
            </button>
          </form>
        )}
      </div>

      <NoticeFormModal
        open={noticeFormOpen}
        editingNotice={editingNotice}
        departments={departments}
        allowPinning={false}
        defaultDepartmentId={facultyProfile?.departmentId}
        onClose={() => setNoticeFormOpen(false)}
        onSubmit={handleSaveNotice}
      />

      <EventFormModal
        open={eventFormOpen}
        editingEvent={editingEvent}
        departments={departments}
        onClose={() => setEventFormOpen(false)}
        onSubmit={handleSaveEvent}
      />

      <NoticeDetailModal
        notice={selectedNotice}
        departments={departments}
        onClose={() => setSelectedNotice(null)}
      />
    </DashboardShell>
  );
}
