import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type {
  ActivityLog,
  AppNotification,
  Bookmark,
  Notice,
  NoticeAttachment,
  NoticeCategory,
  NoticePriority,
  NoticeStatus,
} from '../types';
import { SAMPLE_NOTICES } from '../utils/constants';
import { sanitizeText, toDate } from '../utils/formatters';
import { handleFirestoreError, OperationType } from './firestoreError';

function sortNotices(items: Notice[]): Notice[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const da = toDate(a.publishAt)?.getTime() ?? 0;
    const dbTime = toDate(b.publishAt)?.getTime() ?? 0;
    return dbTime - da;
  });
}

export function subscribePublishedNotices(
  onData: (notices: Notice[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'notices'), where('status', '==', 'published'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Notice);
      onData(sortNotices(items));
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'notices');
      } catch {
        // Logged by handleFirestoreError
      }
    }
  );
}

export function subscribeAuthorNotices(
  authorId: string,
  onData: (notices: Notice[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'notices'), where('authorId', '==', authorId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Notice);
      onData(sortNotices(items));
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'notices');
      } catch {
        // Logged
      }
    }
  );
}

export function subscribeAllNoticesAdmin(
  onData: (notices: Notice[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, 'notices'),
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Notice);
      onData(sortNotices(items));
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'notices');
      } catch {
        // Logged
      }
    }
  );
}

export interface NoticeInputPayload {
  title: string;
  summary: string;
  content: string;
  category: NoticeCategory;
  departmentIds: string[];
  targetAllDepartments: boolean;
  targetYear?: string;
  targetSemester?: string;
  priority: NoticePriority;
  pinned: boolean;
  status: NoticeStatus;
  publishAt: Date;
  expiresAt?: Date | null;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'faculty';
  attachments: NoticeAttachment[];
  isSample?: boolean;
}

export async function createNotice(payload: NoticeInputPayload): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'notices'), {
      title: sanitizeText(payload.title, 220),
      summary: sanitizeText(payload.summary, 500),
      content: sanitizeText(payload.content, 12000),
      category: payload.category,
      departmentIds: payload.departmentIds.slice(0, 20),
      targetAllDepartments: Boolean(payload.targetAllDepartments),
      targetYear: sanitizeText(payload.targetYear || 'all', 32),
      targetSemester: sanitizeText(payload.targetSemester || 'all', 32),
      priority: payload.priority,
      pinned: Boolean(payload.pinned),
      status: payload.status,
      publishAt: Timestamp.fromDate(payload.publishAt),
      expiresAt: payload.expiresAt ? Timestamp.fromDate(payload.expiresAt) : null,
      authorId: payload.authorId,
      authorName: sanitizeText(payload.authorName, 120),
      authorRole: payload.authorRole,
      attachments: payload.attachments.slice(0, 5),
      isSample: Boolean(payload.isSample),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (payload.status === 'published') {
      await dispatchNoticeNotification({
        noticeId: docRef.id,
        title: payload.title,
        summary: payload.summary,
        priority: payload.priority,
        departmentId: payload.targetAllDepartments ? 'all' : payload.departmentIds[0] || 'all',
      });
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notices');
  }
}

export async function updateNotice(
  noticeId: string,
  payload: Partial<NoticeInputPayload> & { isAdminAction?: boolean }
): Promise<void> {
  try {
    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (payload.title !== undefined) updatePayload.title = sanitizeText(payload.title, 220);
    if (payload.summary !== undefined) updatePayload.summary = sanitizeText(payload.summary, 500);
    if (payload.content !== undefined) updatePayload.content = sanitizeText(payload.content, 12000);
    if (payload.category !== undefined) updatePayload.category = payload.category;
    if (payload.departmentIds !== undefined) updatePayload.departmentIds = payload.departmentIds.slice(0, 20);
    if (payload.targetAllDepartments !== undefined) updatePayload.targetAllDepartments = Boolean(payload.targetAllDepartments);
    if (payload.targetYear !== undefined) updatePayload.targetYear = sanitizeText(payload.targetYear, 32);
    if (payload.targetSemester !== undefined) updatePayload.targetSemester = sanitizeText(payload.targetSemester, 32);
    if (payload.priority !== undefined) updatePayload.priority = payload.priority;
    if (payload.pinned !== undefined && payload.isAdminAction) updatePayload.pinned = Boolean(payload.pinned);
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.publishAt !== undefined) updatePayload.publishAt = Timestamp.fromDate(payload.publishAt);
    if (payload.expiresAt !== undefined) {
      updatePayload.expiresAt = payload.expiresAt ? Timestamp.fromDate(payload.expiresAt) : null;
    }
    if (payload.attachments !== undefined) updatePayload.attachments = payload.attachments.slice(0, 5);

    await updateDoc(doc(db, 'notices', noticeId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notices/${noticeId}`);
  }
}

export async function deleteNotice(noticeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notices', noticeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notices/${noticeId}`);
  }
}

export async function archiveExpiredNotices(notices: Notice[]): Promise<number> {
  const now = Date.now();
  const expired = notices.filter((n) => {
    if (n.status !== 'published' || !n.expiresAt) return false;
    const exp = toDate(n.expiresAt);
    return exp ? exp.getTime() < now : false;
  });
  if (expired.length === 0) return 0;

  try {
    const batch = writeBatch(db);
    for (const notice of expired) {
      batch.update(doc(db, 'notices', notice.id), {
        status: 'archived',
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return expired.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notices');
  }
}

export async function publishDueScheduledNotices(notices: Notice[]): Promise<number> {
  const now = Date.now();
  const due = notices.filter((n) => {
    if (n.status !== 'scheduled') return false;
    const pub = toDate(n.publishAt);
    return pub ? pub.getTime() <= now : false;
  });
  if (due.length === 0) return 0;

  try {
    const batch = writeBatch(db);
    for (const notice of due) {
      batch.update(doc(db, 'notices', notice.id), {
        status: 'published',
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return due.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notices');
  }
}

export async function uploadNoticeAttachment(file: File): Promise<NoticeAttachment> {
  const allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file format. Upload PDF, PNG, JPG, WEBP, or DOC/DOCX files.');
  }
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('File exceeds 10 MB limit.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(storage, `notices/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);

  return {
    name: file.name.slice(0, 140),
    url,
    type: file.type,
    size: file.size,
  };
}

export async function dispatchNoticeNotification(params: {
  noticeId?: string;
  title: string;
  summary: string;
  priority: NoticePriority;
  departmentId?: string;
  recipientId?: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      recipientId: params.recipientId || 'all',
      departmentId: params.departmentId || 'all',
      ...(params.noticeId ? { noticeId: params.noticeId } : {}),
      title: sanitizeText(params.title, 220),
      message: sanitizeText(params.summary, 500),
      priority: params.priority,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
}

export function subscribeNotifications(
  uid: string,
  onData: (items: AppNotification[]) => void
) {
  const q = query(collection(db, 'notifications'), where('recipientId', 'in', [uid, 'all']));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification);
      items.sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      } catch {
        // Logged
      }
    }
  );
}

export function subscribeNotificationReads(uid: string, onData: (readIds: Set<string>) => void) {
  return onSnapshot(
    collection(db, 'users', uid, 'notificationReads'),
    (snapshot) => {
      onData(new Set(snapshot.docs.map((d) => d.id)));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/notificationReads`);
      } catch {
        // Logged
      }
    }
  );
}

export async function markNotificationAsRead(uid: string, notificationId: string): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'notificationReads', notificationId), {
      userId: uid,
      notificationId,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}/notificationReads/${notificationId}`);
  }
}

export async function markAllNotificationsAsRead(uid: string, notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const id of notificationIds) {
      batch.set(doc(db, 'users', uid, 'notificationReads', id), {
        userId: uid,
        notificationId: id,
        readAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/notificationReads`);
  }
}

export function subscribeBookmarks(uid: string, onData: (bookmarks: Bookmark[]) => void) {
  const q = query(collection(db, 'bookmarks'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Bookmark));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'bookmarks');
      } catch {
        // Logged
      }
    }
  );
}

export async function toggleBookmark(uid: string, noticeId: string, currentlyBookmarked: boolean): Promise<void> {
  const bookmarkId = `${uid}_${noticeId}`;
  try {
    if (currentlyBookmarked) {
      await deleteDoc(doc(db, 'bookmarks', bookmarkId));
    } else {
      await setDoc(doc(db, 'bookmarks', bookmarkId), {
        userId: uid,
        noticeId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `bookmarks/${bookmarkId}`);
  }
}

export function subscribeNoticeReads(uid: string, onData: (readIds: Set<string>) => void) {
  return onSnapshot(
    collection(db, 'users', uid, 'noticeReads'),
    (snapshot) => {
      onData(new Set(snapshot.docs.map((d) => d.id)));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/noticeReads`);
      } catch {
        // Logged
      }
    }
  );
}

export async function markNoticeAsRead(uid: string, noticeId: string): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'noticeReads', noticeId), {
      userId: uid,
      noticeId,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}/noticeReads/${noticeId}`);
  }
}

export async function logUserActivity(params: {
  userId: string;
  userName: string;
  userRole: 'student' | 'faculty' | 'admin';
  action: string;
  targetTitle: string;
  departmentId?: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      userId: params.userId,
      userName: sanitizeText(params.userName, 120),
      userRole: params.userRole,
      action: sanitizeText(params.action, 80),
      targetTitle: sanitizeText(params.targetTitle, 220),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking activity logging
  }
}

export function subscribeActivityLogs(onData: (logs: ActivityLog[]) => void) {
  return onSnapshot(
    collection(db, 'activityLogs'),
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityLog);
      items.sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
      onData(items.slice(0, 100));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'activityLogs');
      } catch {
        // Logged
      }
    }
  );
}

export async function seedSampleNoticesToFirestore(adminUid: string, adminName: string): Promise<number> {
  try {
    const existing = await getDocs(collection(db, 'notices'));
    if (!existing.empty) return 0;

    const batch = writeBatch(db);
    for (const sample of SAMPLE_NOTICES) {
      const refDoc = doc(db, 'notices', sample.id);
      batch.set(refDoc, {
        title: sample.title,
        summary: sample.summary,
        content: sample.content,
        category: sample.category,
        departmentIds: sample.departmentIds,
        targetAllDepartments: sample.targetAllDepartments,
        priority: sample.priority,
        pinned: sample.pinned,
        status: 'published',
        publishAt: Timestamp.fromDate(toDate(sample.publishAt) || new Date()),
        expiresAt: sample.expiresAt ? Timestamp.fromDate(toDate(sample.expiresAt)!) : null,
        authorId: adminUid,
        authorName: adminName,
        authorRole: 'admin',
        attachments: sample.attachments,
        isSample: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return SAMPLE_NOTICES.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'notices');
  }
}
