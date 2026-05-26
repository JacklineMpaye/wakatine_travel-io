
-- Payment type enum
DO $$ BEGIN
  CREATE TYPE public.payment_type AS ENUM ('passport_processing','nin_assistance','recruitment_processing','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_type public.payment_type NOT NULL DEFAULT 'other';

-- Application details (full Wakatine applicant profile)
CREATE TABLE IF NOT EXISTS public.application_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  date_of_birth date,
  gender text,
  phone text,
  email text,
  nationality text DEFAULT 'Ugandan',
  district text,
  village text,
  nin text,
  father_status text,
  mother_status text,
  next_of_kin_name text,
  next_of_kin_phone text,
  next_of_kin_relationship text,
  has_passport boolean,
  passport_number text,
  passport_photo_path text,
  desired_job text,
  salary_expectation_ugx numeric,
  nin_issue text DEFAULT 'no_issues',
  submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.application_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "details owner select" ON public.application_details
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE POLICY "details owner insert" ON public.application_details
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "details owner update" ON public.application_details
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE TRIGGER set_application_details_updated_at
  BEFORE UPDATE ON public.application_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
