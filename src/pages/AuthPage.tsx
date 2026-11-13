import React, { useState } from 'react';
import { ArrowLeft, BookOpen, GraduationCap, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerFacultyAccount, registerStudentAccount } from '../services/userService';
import type { Department } from '../types';
import { CAMPUS_ASSETS, GAT_COLLEGE_INFO } from '../utils/constants';

interface AuthPageProps {
  initialTab?: 'student' | 'faculty' | 'admin';
  departments: Department[];
  onBackHome: () => void;
  onAuthenticated: () => void;
}

export function AuthPage({
  initialTab = 'student',
  departments,
  onBackHome,
  onAuthenticated,
}: AuthPageProps) {
  const {
    firebaseUser,
    isAdmin,
    studentProfile,
    facultyProfile,
    needsOnboarding,
    loginWithGoogle,
    logout,
    refreshProfiles,
  } = useAuth();
  const { showToast } = useToast();

  const [roleTab, setRoleTab] = useState<'student' | 'faculty' | 'admin'>(initialTab);
  const [authLoading, setAuthLoading] = useState(false);

  // Student onboarding fields
  const [studentName, setStudentName] = useState(firebaseUser?.displayName || '');
  const [usn, setUsn] = useState('');
  const [studentDeptId, setStudentDeptId] = useState(departments[0]?.id || 'cse');
  const [semester, setSemester] = useState(1);
  const [section, setSection] = useState('A');
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Faculty onboarding fields
  const [facultyName, setFacultyName] = useState(firebaseUser?.displayName || '');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [facultyDeptId, setFacultyDeptId] = useState(departments[0]?.id || 'cse');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setErrorMsg('');
    try {
      const user = await loginWithGoogle();
      setStudentName(user.displayName || '');
      setFacultyName(user.displayName || '');
      showToast('Signed in successfully with Google.', 'success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in could not be completed.';
      setErrorMsg(message);
      showToast(message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setErrorMsg('');
    if (studentName.trim().length < 2 || usn.trim().length < 3) {
      setErrorMsg('Please enter your full name and valid University Seat Number (USN).');
      return;
    }

    setSubmitting(true);
    try {
      await registerStudentAccount({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        fullName: studentName.trim(),
        usn: usn.trim(),
        departmentId: studentDeptId,
        semester,
        section: section.trim(),
        emailNotifications,
      });
      await refreshProfiles();
      showToast('Student profile registered successfully.', 'success');
      onAuthenticated();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setErrorMsg('');
    if (facultyName.trim().length < 2 || employeeId.trim().length < 2) {
      setErrorMsg('Please enter your full name and Faculty Employee ID.');
      return;
    }

    setSubmitting(true);
    try {
      await registerFacultyAccount({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        fullName: facultyName.trim(),
        employeeId: employeeId.trim(),
        designation: designation.trim(),
        departmentId: facultyDeptId,
        isAdminUser: isAdmin,
      });
      await refreshProfiles();
      showToast('Faculty profile submitted. Administrator approval controls publishing access.', 'info');
      onAuthenticated();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Faculty registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07111F] text-[#0B1F3A] dark:text-slate-100 flex flex-col">
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center">
        <div className="mb-6">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0B1F3A] dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Notice Board</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden shadow-sm">
          {/* Institutional Info Column */}
          <div className="lg:col-span-5 bg-[#0B1F3A] text-white p-8 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <img
                  src={CAMPUS_ASSETS.logoWhite}
                  alt="Global Academy of Technology Official Logo"
                  referrerPolicy="no-referrer"
                  className="h-14 w-auto object-contain"
                />
                <p className="text-xs text-[#DFB047]">
                  {GAT_COLLEGE_INFO.tagline} · {GAT_COLLEGE_INFO.locationShort}
                </p>
              </div>
              <h1 className="font-display text-2xl font-bold leading-snug">
                Campus Portal Authentication
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sign in securely with your Google account to access role-specific dashboards for
                students, faculty coordinators, and portal administrators.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-300 border-t border-white/15 pt-5">
              <p className="font-semibold text-white">Role Access Overview</p>
              <p>
                Students: Read department & campus notices, download PDF circulars, bookmark notices,
                and receive real-time alerts.
              </p>
              <p>
                Faculty: Publish department-specific academic circulars and events (enabled by
                Admin permission).
              </p>
              <p>
                Administrators: Full oversight of notices, scheduled circulars, events, departments,
                and user approvals.
              </p>
            </div>
          </div>

          {/* Auth Interaction Column */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
            {/* Role Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#07111F] border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRoleTab('student')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  roleTab === 'student'
                    ? 'bg-white dark:bg-[#0D1C31] text-[#0B1F3A] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleTab('faculty')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  roleTab === 'faculty'
                    ? 'bg-white dark:bg-[#0D1C31] text-[#0B1F3A] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleTab('admin')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  roleTab === 'admin'
                    ? 'bg-white dark:bg-[#0D1C31] text-[#0B1F3A] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs sm:text-sm text-red-800 dark:text-red-200">
                {errorMsg}
              </div>
            )}

            {!firebaseUser ? (
              <div className="space-y-5 py-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1F3A] dark:text-white">
                    {roleTab === 'student'
                      ? 'Student Sign In & Registration'
                      : roleTab === 'faculty'
                      ? 'Faculty Portal Sign In'
                      : 'Administrator Sign In'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {roleTab === 'admin'
                      ? 'Authenticate with an authorized GAT administrator Google account.'
                      : 'Sign in with Google to access or complete your academic profile.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full h-11 inline-flex items-center justify-center gap-3 rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Continue with Google</span>
                </button>
              </div>
            ) : !needsOnboarding ? (
              <div className="space-y-5 py-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] p-4 space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                    {firebaseUser.displayName || firebaseUser.email}
                  </p>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {firebaseUser.email} ·{' '}
                    {isAdmin
                      ? 'Administrator'
                      : facultyProfile
                      ? 'Faculty Member'
                      : studentProfile
                      ? `Student (${studentProfile.usn})`
                      : 'Registered User'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onAuthenticated}
                    className="flex-1 h-11 rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] text-sm font-semibold hover:opacity-95 cursor-pointer"
                  >
                    Enter Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-4 h-11 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Switch Account
                  </button>
                </div>
              </div>
            ) : roleTab === 'admin' ? (
              <div className="space-y-4 py-2">
                <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
                  Signed-in account <span className="font-mono">{firebaseUser.email}</span> is not
                  listed in the portal administrators registry. Please sign in with an authorized
                  administrator account or switch to the Student or Faculty tab to register.
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Sign Out & Use Another Account
                </button>
              </div>
            ) : roleTab === 'student' ? (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
                    Complete Student Registration
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Signed in as {firebaseUser.email}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      University Seat Number (USN) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={32}
                      placeholder="e.g., 1GA23CS001"
                      value={usn}
                      onChange={(e) => setUsn(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1">Department / Program *</label>
                    <select
                      value={studentDeptId}
                      onChange={(e) => setStudentDeptId(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                    >
                      <optgroup label="Undergraduate Programs (B.E.)">
                        {departments
                          .filter((d) => (d.programLevel || 'UG') === 'UG')
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Postgraduate Programs (M.Tech / MBA)">
                        {departments
                          .filter((d) => d.programLevel === 'PG')
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Semester *</label>
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
                      maxLength={10}
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
                    <span>Receive email alerts for urgent circulars</span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs font-medium text-slate-500 hover:underline cursor-pointer"
                  >
                    Sign Out
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Complete Student Registration</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleFacultySubmit} className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
                    Faculty Profile & Publishing Request
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Signed in as {firebaseUser.email}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={facultyName}
                      onChange={(e) => setFacultyName(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Employee ID *</label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      placeholder="e.g., GAT-FAC-104"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Department *</label>
                    <select
                      value={facultyDeptId}
                      onChange={(e) => setFacultyDeptId(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
                    >
                      <optgroup label="Undergraduate Programs (B.E.)">
                        {departments
                          .filter((d) => (d.programLevel || 'UG') === 'UG')
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Postgraduate Programs (M.Tech / MBA)">
                        {departments
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

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs font-medium text-slate-500 hover:underline cursor-pointer"
                  >
                    Sign Out
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Submit Faculty Profile</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
