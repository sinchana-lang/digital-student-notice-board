import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { CampusEvent, EventStatus } from '../types';
import { SAMPLE_EVENTS } from '../utils/constants';
import { sanitizeText } from '../utils/formatters';
import { handleFirestoreError, OperationType } from './firestoreError';

export function subscribeEvents(onData: (events: CampusEvent[]) => void) {
  const q = query(collection(db, 'events'), where('status', 'in', ['upcoming', 'completed', 'cancelled']));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CampusEvent);
      items.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'events');
      } catch {
        // Logged
      }
    }
  );
}

export interface EventInputPayload {
  title: string;
  description: string;
  posterUrl?: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  departmentId: string;
  departmentName: string;
  registrationLink?: string;
  registrationDeadline?: string;
  status: EventStatus;
  authorId: string;
  authorName: string;
  isSample?: boolean;
}

export async function createEvent(payload: EventInputPayload): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'events'), {
      title: sanitizeText(payload.title, 200),
      description: sanitizeText(payload.description, 5000),
      ...(payload.posterUrl ? { posterUrl: sanitizeText(payload.posterUrl, 1000) } : {}),
      eventDate: sanitizeText(payload.eventDate, 32),
      eventTime: sanitizeText(payload.eventTime, 40),
      venue: sanitizeText(payload.venue, 160),
      departmentId: payload.departmentId,
      departmentName: sanitizeText(payload.departmentName, 140),
      ...(payload.registrationLink ? { registrationLink: sanitizeText(payload.registrationLink, 500) } : {}),
      ...(payload.registrationDeadline
        ? { registrationDeadline: sanitizeText(payload.registrationDeadline, 32) }
        : {}),
      status: payload.status,
      authorId: payload.authorId,
      authorName: sanitizeText(payload.authorName, 120),
      isSample: Boolean(payload.isSample),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'events');
  }
}

export async function updateEvent(eventId: string, payload: Partial<EventInputPayload>): Promise<void> {
  try {
    const data: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (payload.title !== undefined) data.title = sanitizeText(payload.title, 200);
    if (payload.description !== undefined) data.description = sanitizeText(payload.description, 5000);
    if (payload.posterUrl !== undefined) data.posterUrl = sanitizeText(payload.posterUrl, 1000);
    if (payload.eventDate !== undefined) data.eventDate = sanitizeText(payload.eventDate, 32);
    if (payload.eventTime !== undefined) data.eventTime = sanitizeText(payload.eventTime, 40);
    if (payload.venue !== undefined) data.venue = sanitizeText(payload.venue, 160);
    if (payload.departmentId !== undefined) data.departmentId = payload.departmentId;
    if (payload.departmentName !== undefined) data.departmentName = sanitizeText(payload.departmentName, 140);
    if (payload.registrationLink !== undefined) data.registrationLink = sanitizeText(payload.registrationLink, 500);
    if (payload.registrationDeadline !== undefined) {
      data.registrationDeadline = sanitizeText(payload.registrationDeadline, 32);
    }
    if (payload.status !== undefined) data.status = payload.status;

    await updateDoc(doc(db, 'events', eventId), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `events/${eventId}`);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `events/${eventId}`);
  }
}

export async function uploadEventPoster(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Poster must be a PNG, JPG, or WEBP image.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Poster size must be under 5 MB.');
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(storage, `events/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function seedSampleEventsToFirestore(adminUid: string, adminName: string): Promise<number> {
  try {
    const existing = await getDocs(
      query(collection(db, 'events'), where('status', 'in', ['upcoming', 'completed', 'cancelled']))
    );
    if (!existing.empty) return 0;

    const batch = writeBatch(db);
    for (const evt of SAMPLE_EVENTS) {
      const refDoc = doc(db, 'events', evt.id);
      batch.set(refDoc, {
        title: evt.title,
        description: evt.description,
        posterUrl: evt.posterUrl || '',
        eventDate: evt.eventDate,
        eventTime: evt.eventTime,
        venue: evt.venue,
        departmentId: evt.departmentId,
        departmentName: evt.departmentName,
        registrationLink: evt.registrationLink || '',
        registrationDeadline: evt.registrationDeadline || '',
        status: evt.status,
        authorId: adminUid,
        authorName: adminName,
        isSample: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return SAMPLE_EVENTS.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'events');
  }
}
