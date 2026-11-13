import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'faculty' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'suspended';
export type NoticePriority = 'normal' | 'important' | 'urgent';
export type NoticeStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type EventStatus = 'upcoming' | 'completed' | 'cancelled';

export type NoticeCategory =
  | 'General Announcements'
  | 'Examination Notifications'
  | 'Internal Assessment'
  | 'Results'
  | 'Academic Calendar'
  | 'Holidays'
  | 'Department Updates'
  | 'Placement Notifications'
  | 'Workshops and Seminars'
  | 'Technical Events'
  | 'Cultural Events'
  | 'Sports Activities'
  | 'Internship Opportunities'
  | 'Important Circulars';

export interface NoticeAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  departmentId?: string;
  usnOrEmployeeId?: string;
  emailNotifications: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface StudentProfile {
  uid: string;
  fullName: string;
  usn: string;
  departmentId: string;
  semester: number;
  section?: string;
  emailNotifications: boolean;
  lastActiveAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface FacultyProfile {
  uid: string;
  fullName: string;
  employeeId: string;
  designation: string;
  departmentId: string;
  approved: boolean;
  canPublish: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  shortName: string;
  programLevel?: 'UG' | 'PG';
  hodName?: string;
  active: boolean;
  displayOrder: number;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Notice {
  id: string;
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
  publishAt: Timestamp | Date;
  expiresAt?: Timestamp | Date | null;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'faculty';
  attachments: NoticeAttachment[];
  isSample: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface CampusEvent {
  id: string;
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
  isSample: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  departmentId?: string;
  noticeId?: string;
  title: string;
  message: string;
  priority: NoticePriority;
  createdAt: Timestamp | Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  noticeId: string;
  createdAt: Timestamp | Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetTitle: string;
  departmentId?: string;
  createdAt: Timestamp | Date;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface AppointmentBooking {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  usn_or_id?: string | null;
  applicant_type: string;
  department_id: string;
  department_name: string;
  appointment_office: string;
  preferred_date: string;
  preferred_time: string;
  purpose: string;
  status: AppointmentStatus;
  user_uid?: string | null;
  created_at: string;
}

