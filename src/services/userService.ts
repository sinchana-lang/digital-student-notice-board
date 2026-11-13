import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type {
  AccountStatus,
  Department,
  FacultyProfile,
  StudentProfile,
  UserProfile,
} from '../types';
import { DEFAULT_DEPARTMENTS } from '../utils/constants';
import { sanitizeText } from '../utils/formatters';
import { handleFirestoreError, OperationType } from './firestoreError';

export function subscribeActiveDepartments(onData: (departments: Department[]) => void) {
  const q = query(collection(db, 'departments'), where('active', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Department);
      items.sort((a, b) => a.displayOrder - b.displayOrder);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'departments');
      } catch {
        // Logged
      }
    }
  );
}

export function subscribeAllDepartmentsAdmin(onData: (departments: Department[]) => void) {
  return onSnapshot(
    collection(db, 'departments'),
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Department);
      items.sort((a, b) => a.displayOrder - b.displayOrder);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'departments');
      } catch {
        // Logged
      }
    }
  );
}

export async function seedDefaultDepartments(): Promise<number> {
  try {
    const existingSnap = await getDocs(collection(db, 'departments'));
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));

    const batch = writeBatch(db);
    let addedCount = 0;

    for (const dept of DEFAULT_DEPARTMENTS) {
      const ref = doc(db, 'departments', dept.id);
      if (!existingIds.has(dept.id)) {
        batch.set(ref, {
          code: dept.code,
          name: dept.name,
          shortName: dept.shortName,
          programLevel: dept.programLevel || 'UG',
          active: dept.active,
          displayOrder: dept.displayOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addedCount += 1;
      } else {
        batch.update(ref, {
          code: dept.code,
          name: dept.name,
          shortName: dept.shortName,
          programLevel: dept.programLevel || 'UG',
          displayOrder: dept.displayOrder,
          updatedAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
    return addedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'departments');
  }
}

export async function saveDepartment(dept: {
  id: string;
  code: string;
  name: string;
  shortName: string;
  programLevel?: 'UG' | 'PG';
  hodName?: string;
  active: boolean;
  displayOrder: number;
}, isNew: boolean): Promise<void> {
  const cleanId = dept.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  try {
    if (isNew) {
      await setDoc(doc(db, 'departments', cleanId), {
        code: sanitizeText(dept.code, 20),
        name: sanitizeText(dept.name, 140),
        shortName: sanitizeText(dept.shortName, 32),
        programLevel: dept.programLevel || 'UG',
        ...(dept.hodName ? { hodName: sanitizeText(dept.hodName, 120) } : {}),
        active: Boolean(dept.active),
        displayOrder: Number(dept.displayOrder) || 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'departments', cleanId), {
        code: sanitizeText(dept.code, 20),
        name: sanitizeText(dept.name, 140),
        shortName: sanitizeText(dept.shortName, 32),
        programLevel: dept.programLevel || 'UG',
        ...(dept.hodName !== undefined ? { hodName: sanitizeText(dept.hodName, 120) } : {}),
        active: Boolean(dept.active),
        displayOrder: Number(dept.displayOrder) || 1,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `departments/${cleanId}`);
  }
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'departments', departmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `departments/${departmentId}`);
  }
}

export async function registerStudentAccount(params: {
  uid: string;
  email: string;
  fullName: string;
  usn: string;
  departmentId: string;
  semester: number;
  section?: string;
  emailNotifications: boolean;
}): Promise<void> {
  const { uid } = params;
  try {
    const existingUser = await getDoc(doc(db, 'users', uid));
    const batch = writeBatch(db);

    if (!existingUser.exists()) {
      batch.set(doc(db, 'users', uid), {
        uid,
        displayName: sanitizeText(params.fullName, 120),
        email: sanitizeText(params.email, 200),
        role: 'student',
        status: 'active',
        departmentId: params.departmentId,
        usnOrEmployeeId: sanitizeText(params.usn, 40),
        emailNotifications: Boolean(params.emailNotifications),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(doc(db, 'users', uid), {
        displayName: sanitizeText(params.fullName, 120),
        departmentId: params.departmentId,
        usnOrEmployeeId: sanitizeText(params.usn, 40),
        emailNotifications: Boolean(params.emailNotifications),
        updatedAt: serverTimestamp(),
      });
    }

    const existingStudent = await getDoc(doc(db, 'students', uid));
    if (!existingStudent.exists()) {
      batch.set(doc(db, 'students', uid), {
        uid,
        fullName: sanitizeText(params.fullName, 120),
        usn: sanitizeText(params.usn.toUpperCase(), 32),
        departmentId: params.departmentId,
        semester: Number(params.semester),
        ...(params.section ? { section: sanitizeText(params.section, 10) } : {}),
        emailNotifications: Boolean(params.emailNotifications),
        lastActiveAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(doc(db, 'students', uid), {
        fullName: sanitizeText(params.fullName, 120),
        usn: sanitizeText(params.usn.toUpperCase(), 32),
        departmentId: params.departmentId,
        semester: Number(params.semester),
        ...(params.section !== undefined ? { section: sanitizeText(params.section, 10) } : {}),
        emailNotifications: Boolean(params.emailNotifications),
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `students/${uid}`);
  }
}

export async function registerFacultyAccount(params: {
  uid: string;
  email: string;
  fullName: string;
  employeeId: string;
  designation: string;
  departmentId: string;
  isAdminUser?: boolean;
}): Promise<void> {
  const { uid } = params;
  try {
    const existingUser = await getDoc(doc(db, 'users', uid));
    const batch = writeBatch(db);

    if (!existingUser.exists()) {
      batch.set(doc(db, 'users', uid), {
        uid,
        displayName: sanitizeText(params.fullName, 120),
        email: sanitizeText(params.email, 200),
        role: params.isAdminUser ? 'admin' : 'faculty',
        status: params.isAdminUser ? 'active' : 'pending',
        departmentId: params.departmentId,
        usnOrEmployeeId: sanitizeText(params.employeeId, 40),
        emailNotifications: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(doc(db, 'users', uid), {
        displayName: sanitizeText(params.fullName, 120),
        departmentId: params.departmentId,
        usnOrEmployeeId: sanitizeText(params.employeeId, 40),
        updatedAt: serverTimestamp(),
      });
    }

    const existingFaculty = await getDoc(doc(db, 'faculty', uid));
    if (!existingFaculty.exists()) {
      batch.set(doc(db, 'faculty', uid), {
        uid,
        fullName: sanitizeText(params.fullName, 120),
        employeeId: sanitizeText(params.employeeId, 40),
        designation: sanitizeText(params.designation, 80),
        departmentId: params.departmentId,
        approved: Boolean(params.isAdminUser),
        canPublish: Boolean(params.isAdminUser),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(doc(db, 'faculty', uid), {
        fullName: sanitizeText(params.fullName, 120),
        employeeId: sanitizeText(params.employeeId, 40),
        designation: sanitizeText(params.designation, 80),
        departmentId: params.departmentId,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `faculty/${uid}`);
  }
}

export function subscribeAllStudents(onData: (students: StudentProfile[]) => void) {
  return onSnapshot(
    collection(db, 'students'),
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as StudentProfile));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'students');
      } catch {
        // Logged
      }
    }
  );
}

export function subscribeAllFaculty(onData: (faculty: FacultyProfile[]) => void) {
  return onSnapshot(
    collection(db, 'faculty'),
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as FacultyProfile));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'faculty');
      } catch {
        // Logged
      }
    }
  );
}

export function subscribeAllUsersAdmin(onData: (users: UserProfile[]) => void) {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as UserProfile));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } catch {
        // Logged
      }
    }
  );
}

export async function updateFacultyPermissions(
  facultyUid: string,
  approved: boolean,
  canPublish: boolean
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'faculty', facultyUid), {
      approved,
      canPublish: approved ? canPublish : false,
      updatedAt: serverTimestamp(),
    });
    const userSnap = await getDoc(doc(db, 'users', facultyUid));
    if (userSnap.exists()) {
      batch.update(doc(db, 'users', facultyUid), {
        status: approved ? 'active' : 'pending',
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `faculty/${facultyUid}`);
  }
}

export async function updateUserAccountStatus(uid: string, status: AccountStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}
