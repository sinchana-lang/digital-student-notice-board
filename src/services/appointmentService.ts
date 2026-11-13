import { supabase } from '../lib/supabase';
import type { AppointmentBooking, AppointmentStatus } from '../types';

export const APPOINTMENT_OFFICES = [
  'Head of Department (HOD)',
  'Academic Counseling & Mentoring',
  'Admissions & Campus Visit',
  'Examination & Evaluation Cell',
  'Training & Placement Cell',
  'Principal / Administration Office',
] as const;

export const APPOINTMENT_TIME_SLOTS = [
  '09:30 AM – 10:00 AM',
  '10:30 AM – 11:00 AM',
  '11:30 AM – 12:00 PM',
  '02:00 PM – 02:30 PM',
  '03:00 PM – 03:30 PM',
  '04:00 PM – 04:30 PM',
] as const;

export const APPLICANT_TYPES = [
  'Student',
  'Parent / Guardian',
  'Prospective Student',
  'Alumni / Visitor',
] as const;

export const APPOINTMENT_SETUP_SQL = `CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  usn_or_id text,
  applicant_type text NOT NULL DEFAULT 'Student',
  department_id text NOT NULL,
  department_name text NOT NULL,
  appointment_office text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  user_uid text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public appointment inserts" ON public.appointments;
CREATE POLICY "Allow public appointment inserts"
  ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow appointment reads" ON public.appointments;
CREATE POLICY "Allow appointment reads"
  ON public.appointments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow appointment status updates" ON public.appointments;
CREATE POLICY "Allow appointment status updates"
  ON public.appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);`;

export class SupabaseAppointmentError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SupabaseAppointmentError';
    this.code = code;
  }
}

function mapSupabaseError(err: { code?: string; message?: string; details?: string }): SupabaseAppointmentError {
  const code = err.code || '';
  const msg = err.message || 'Unable to reach appointment database.';
  if (code === 'PGRST205' || code === '42P01' || msg.includes('schema cache')) {
    return new SupabaseAppointmentError(
      'The "appointments" table does not exist in your Supabase project yet. Run the SQL setup script in Supabase SQL Editor.',
      'TABLE_MISSING'
    );
  }
  if (code === '42501' || msg.toLowerCase().includes('row-level security')) {
    return new SupabaseAppointmentError(
      'Supabase Row-Level Security (RLS) policy blocked this operation. Enable INSERT/SELECT policies on public.appointments.',
      'RLS_BLOCKED'
    );
  }
  return new SupabaseAppointmentError(msg, code);
}

export interface CreateAppointmentPayload {
  fullName: string;
  email: string;
  phone: string;
  usnOrId?: string;
  applicantType: string;
  departmentId: string;
  departmentName: string;
  appointmentOffice: string;
  preferredDate: string;
  preferredTime: string;
  purpose: string;
  userUid?: string;
}

export async function createAppointmentBooking(
  payload: CreateAppointmentPayload
): Promise<AppointmentBooking> {
  const record = {
    full_name: payload.fullName.trim().slice(0, 120),
    email: payload.email.trim().toLowerCase().slice(0, 160),
    phone: payload.phone.trim().slice(0, 32),
    usn_or_id: payload.usnOrId?.trim().toUpperCase().slice(0, 40) || null,
    applicant_type: payload.applicantType.trim().slice(0, 60),
    department_id: payload.departmentId.trim().slice(0, 64),
    department_name: payload.departmentName.trim().slice(0, 160),
    appointment_office: payload.appointmentOffice.trim().slice(0, 120),
    preferred_date: payload.preferredDate,
    preferred_time: payload.preferredTime.trim().slice(0, 60),
    purpose: payload.purpose.trim().slice(0, 1500),
    status: 'pending' as AppointmentStatus,
    user_uid: payload.userUid || null,
  };

  const { error } = await supabase.from('appointments').insert([record]);

  if (error) {
    throw mapSupabaseError(error);
  }

  return {
    id: crypto.randomUUID(),
    ...record,
    created_at: new Date().toISOString(),
  };
}

export async function fetchAllAppointments(): Promise<AppointmentBooking[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw mapSupabaseError(error);
  }
  return (data || []) as AppointmentBooking[];
}

export async function fetchStudentAppointments(params: {
  userUid?: string;
  email?: string;
}): Promise<AppointmentBooking[]> {
  const filters: string[] = [];
  if (params.userUid) filters.push(`user_uid.eq.${params.userUid}`);
  if (params.email) filters.push(`email.eq.${params.email.trim().toLowerCase()}`);

  if (filters.length === 0) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .or(filters.join(','))
    .order('created_at', { ascending: false });

  if (error) {
    throw mapSupabaseError(error);
  }
  return (data || []) as AppointmentBooking[];
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw mapSupabaseError(error);
  }
}
