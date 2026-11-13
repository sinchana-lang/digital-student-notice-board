-- Run this SQL once in your Supabase Project (awurqbvqtqgydkvfsnbl) -> SQL Editor
-- to create the `appointments` table and allow appointment bookings to be saved and viewed.

CREATE TABLE IF NOT EXISTS public.appointments (
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

-- Allow website visitors, students, and staff to submit appointment bookings
DROP POLICY IF EXISTS "Allow public appointment inserts" ON public.appointments;
CREATE POLICY "Allow public appointment inserts"
  ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading appointment records in the portal / dashboard
DROP POLICY IF EXISTS "Allow appointment reads" ON public.appointments;
CREATE POLICY "Allow appointment reads"
  ON public.appointments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow updating appointment status from the portal Admin Console
DROP POLICY IF EXISTS "Allow appointment status updates" ON public.appointments;
CREATE POLICY "Allow appointment status updates"
  ON public.appointments
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
