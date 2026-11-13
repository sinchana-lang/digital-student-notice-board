import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import type { FacultyProfile, StudentProfile, UserProfile, UserRole } from '../types';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../utils/constants';

export type ThemeMode = 'light' | 'dark';

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  studentProfile: StudentProfile | null;
  facultyProfile: FacultyProfile | null;
  isAdmin: boolean;
  activeRole: UserRole | null;
  authReady: boolean;
  needsOnboarding: boolean;
  theme: ThemeMode;
  toggleTheme: () => void;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('gat-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('gat-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const loadProfiles = useCallback(async (user: User | null) => {
    if (!user) {
      setUserProfile(null);
      setStudentProfile(null);
      setFacultyProfile(null);
      setIsAdmin(false);
      return;
    }

    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      const isBootstrapped =
        Boolean(user.emailVerified) &&
        user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      const adminFlag = isBootstrapped || adminDoc.exists();
      setIsAdmin(adminFlag);

      if (isBootstrapped && !adminDoc.exists()) {
        await setDoc(doc(db, 'admins', user.uid), {
          uid: user.uid,
          email: user.email || BOOTSTRAPPED_ADMIN_EMAIL,
          fullName: user.displayName || 'GAT Portal Administrator',
          createdAt: serverTimestamp(),
        });
      }

      const [userSnap, studentSnap, facultySnap] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDoc(doc(db, 'students', user.uid)),
        getDoc(doc(db, 'faculty', user.uid)),
      ]);

      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      } else if (adminFlag) {
        const defaultAdminUser = {
          uid: user.uid,
          displayName: user.displayName || 'GAT Portal Administrator',
          email: user.email || BOOTSTRAPPED_ADMIN_EMAIL,
          role: 'admin' as const,
          status: 'active' as const,
          emailNotifications: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', user.uid), defaultAdminUser);
        setUserProfile({
          ...defaultAdminUser,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        setUserProfile(null);
      }

      setStudentProfile(studentSnap.exists() ? (studentSnap.data() as StudentProfile) : null);
      setFacultyProfile(facultySnap.exists() ? (facultySnap.data() as FacultyProfile) : null);
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      await loadProfiles(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [loadProfiles]);

  const loginWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    await loadProfiles(credential.user);
    return credential.user;
  }, [loadProfiles]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUserProfile(null);
    setStudentProfile(null);
    setFacultyProfile(null);
    setIsAdmin(false);
  }, []);

  const refreshProfiles = useCallback(async () => {
    await loadProfiles(auth.currentUser);
  }, [loadProfiles]);

  const activeRole: UserRole | null = isAdmin
    ? 'admin'
    : userProfile?.role === 'faculty' || facultyProfile
    ? 'faculty'
    : userProfile?.role === 'student' || studentProfile
    ? 'student'
    : null;

  const needsOnboarding = Boolean(firebaseUser && !isAdmin && !studentProfile && !facultyProfile);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        studentProfile,
        facultyProfile,
        isAdmin,
        activeRole,
        authReady,
        needsOnboarding,
        theme,
        toggleTheme,
        loginWithGoogle,
        logout,
        refreshProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
