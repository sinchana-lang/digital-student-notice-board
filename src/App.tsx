import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { HomePage } from './pages/HomePage';
import { StudentDashboard } from './pages/StudentDashboard';
import { subscribeEvents } from './services/eventService';
import { subscribePublishedNotices } from './services/noticeService';
import { subscribeActiveDepartments } from './services/userService';
import type { CampusEvent, Department, Notice } from './types';
import { DEFAULT_DEPARTMENTS, SAMPLE_EVENTS, SAMPLE_NOTICES } from './utils/constants';

type AppRoute = 'home' | 'auth' | 'dashboard';

function AppRouter() {
  const { firebaseUser, activeRole, authReady, needsOnboarding } = useAuth();
  const [route, setRoute] = useState<AppRoute>('home');
  const [authTab, setAuthTab] = useState<'student' | 'faculty' | 'admin'>('student');

  const [liveNotices, setLiveNotices] = useState<Notice[]>([]);
  const [liveEvents, setLiveEvents] = useState<CampusEvent[]>([]);
  const [liveDepartments, setLiveDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const unsubNotices = subscribePublishedNotices(setLiveNotices);
    const unsubEvents = subscribeEvents(setLiveEvents);
    const unsubDepts = subscribeActiveDepartments(setLiveDepartments);

    return () => {
      unsubNotices();
      unsubEvents();
      unsubDepts();
    };
  }, []);

  const departments: Department[] = (() => {
    if (liveDepartments.length === 0) return DEFAULT_DEPARTMENTS as Department[];
    const map = new Map<string, Department>();
    for (const def of DEFAULT_DEPARTMENTS) {
      map.set(def.id, def as Department);
    }
    for (const live of liveDepartments) {
      map.set(live.id, live);
    }
    return Array.from(map.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  })();
  const usingSampleNotices = liveNotices.length === 0;
  const usingSampleEvents = liveEvents.length === 0;
  const notices = usingSampleNotices ? SAMPLE_NOTICES : liveNotices;
  const events = usingSampleEvents ? SAMPLE_EVENTS : liveEvents;

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#07111F] text-[#0B1F3A] dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#C9972C]" />
          <p className="text-sm font-medium">Loading GAT Digital Notice Board...</p>
        </div>
      </div>
    );
  }

  if (route === 'auth' || (route === 'dashboard' && (!firebaseUser || needsOnboarding))) {
    return (
      <AuthPage
        initialTab={authTab}
        departments={departments}
        onBackHome={() => setRoute('home')}
        onAuthenticated={() => setRoute('dashboard')}
      />
    );
  }

  if (route === 'dashboard' && firebaseUser) {
    if (activeRole === 'admin') {
      return <AdminDashboard events={liveEvents} onGoHome={() => setRoute('home')} />;
    }
    if (activeRole === 'faculty') {
      return (
        <FacultyDashboard
          publishedNotices={notices}
          events={events}
          departments={departments}
          onGoHome={() => setRoute('home')}
        />
      );
    }
    return (
      <StudentDashboard
        notices={notices}
        events={events}
        departments={departments}
        onGoHome={() => setRoute('home')}
      />
    );
  }

  return (
    <HomePage
      notices={notices}
      events={events}
      departments={departments}
      usingSampleNotices={usingSampleNotices}
      usingSampleEvents={usingSampleEvents}
      onNavigateAuth={(tab = 'student') => {
        setAuthTab(tab);
        setRoute('auth');
      }}
      onOpenDashboard={() => setRoute('dashboard')}
    />
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  );
}
