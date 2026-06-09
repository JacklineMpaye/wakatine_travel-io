
-- Allow walk-in profiles (no auth.users row required)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Applications: support open registration (no specific job picked yet)
ALTER TABLE public.applications ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_applicant_id_job_id_key;
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_applicant_id_fkey;

-- Admin-side insert/update so admins can create applications & manage walk-ins
DROP POLICY IF EXISTS "apps admin manage" ON public.applications;
CREATE POLICY "apps admin manage" ON public.applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can create notifications for any applicant
DROP POLICY IF EXISTS "notif admin insert" ON public.notifications;
CREATE POLICY "notif admin insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
