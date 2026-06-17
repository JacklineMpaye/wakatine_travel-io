-- =============================================================
-- Wakatine Travel-IO — Complete Supabase Schema Migration
-- Single-file script for a fresh Supabase project
-- Generated 2026-06-11 — consolidates all 8 migrations
-- Paste into Supabase SQL Editor and run in one shot.
-- Idempotent: safe to re-run on a partially-migrated database.
--
-- Dependency order:
--   1. ENUMs
--   2. Sequences
--   3. Pure trigger helper (set_updated_at — no table refs)
--   4. ALL tables (no triggers, no policies yet)
--   5. Functions that reference tables
--   6. Triggers
--   7. Indexes
--   8. RLS policies
--   9. Grants
--  10. Storage buckets & policies           
--  11. Revoke public execution
-- =============================================================


-- ============================================================
-- 1. ENUMS  (idempotent via exception handler)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'applicant');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE public.employment_type AS ENUM (
    'full_time', 'part_time', 'contract', 'temporary'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM (
    'registration_submitted',
    'documents_pending',
    'documents_verified',
    'interview_scheduled',
    'interview_passed',
    'medical_check_pending',
    'visa_processing',
    'visa_approved',
    'flight_scheduled',
    'deployed_abroad',
    'rejected',
    'draft',
    'under_review',
    'approved'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE public.document_type AS ENUM (
    'passport', 'cv', 'national_id', 'passport_photo', 'medical'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE public.document_status AS ENUM (
    'pending', 'verified', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending', 'partial', 'paid', 'overdue', 'verified'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE public.payment_type AS ENUM (
    'passport_processing', 'nin_assistance', 'recruitment_processing', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;


-- ============================================================
-- 2. SEQUENCES
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.applicant_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq  START 1;


-- ============================================================
-- 3. PURE HELPER FUNCTION (no table references)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;


-- ============================================================
-- 4. TABLES
-- ============================================================

-- No FK to auth.users: walk-in applicants have no auth account.
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY,
  email            TEXT,
  full_name        TEXT,
  phone            TEXT,
  date_of_birth    DATE,
  gender           TEXT,
  nationality      TEXT        DEFAULT 'Ugandan',
  address          TEXT,
  profession       TEXT,
  years_experience INT,
  education_level  TEXT,
  avatar_url       TEXT,
  applicant_code   TEXT        UNIQUE,
  is_walk_in       BOOLEAN     NOT NULL DEFAULT false,
  district         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ     NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.jobs (
  id              UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT                   NOT NULL,
  country         TEXT                   NOT NULL,
  city            TEXT,
  employer        TEXT,
  description     TEXT                   NOT NULL,
  requirements    TEXT,
  salary_min      NUMERIC,
  salary_max      NUMERIC,
  currency        TEXT                   DEFAULT 'USD',
  employment_type public.employment_type DEFAULT 'full_time',
  deadline        DATE,
  slots           INT                    DEFAULT 1,
  is_active       BOOLEAN                NOT NULL DEFAULT true,
  created_by      UUID                   REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ            NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Must exist before payments (payments.invoice_id references this).
CREATE TABLE IF NOT EXISTS public.invoices (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT        UNIQUE NOT NULL DEFAULT '',
  user_id        UUID        NOT NULL,
  service        TEXT        NOT NULL,
  amount_due     NUMERIC     NOT NULL DEFAULT 0,
  amount_paid    NUMERIC     NOT NULL DEFAULT 0,
  balance        NUMERIC     NOT NULL DEFAULT 0,
  status         TEXT        NOT NULL DEFAULT 'unpaid',
  notes          TEXT,
  created_by     UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Must exist before applications (log_application_status inserts here).
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- applicant_id: no FK — walk-in support.
-- job_id: nullable — open-registration (no listing chosen yet).
CREATE TABLE IF NOT EXISTS public.applications (
  id                             UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id                   UUID,
  job_id                         UUID                      REFERENCES public.jobs(id) ON DELETE CASCADE,
  status                         public.application_status NOT NULL DEFAULT 'registration_submitted',
  cover_letter                   TEXT,
  admin_notes                    TEXT,
  assigned_job_title             TEXT,
  assigned_job_country           TEXT,
  assigned_job_description       TEXT,
  assigned_job_employer          TEXT,
  assigned_job_salary            TEXT,
  assigned_job_benefits          TEXT,
  assigned_job_contract_duration TEXT,
  assigned_job_description_path  TEXT,
  created_at                     TIMESTAMPTZ               NOT NULL DEFAULT now(),
  updated_at                     TIMESTAMPTZ               NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id             UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID                      NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status         public.application_status NOT NULL,
  notes          TEXT,
  changed_by     UUID                      REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ               NOT NULL DEFAULT now()
);
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.application_details (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL UNIQUE,
  full_name                TEXT,
  date_of_birth            DATE,
  gender                   TEXT,
  phone                    TEXT,
  email                    TEXT,
  nationality              TEXT        DEFAULT 'Ugandan',
  district                 TEXT,
  village                  TEXT,
  nin                      TEXT,
  father_status            TEXT,
  mother_status            TEXT,
  next_of_kin_name         TEXT,
  next_of_kin_phone        TEXT,
  next_of_kin_relationship TEXT,
  has_passport             BOOLEAN,
  passport_number          TEXT,
  passport_photo_path      TEXT,
  desired_job              TEXT,
  preferred_jobs           TEXT[]      DEFAULT '{}'::text[],
  salary_expectation_ugx   NUMERIC,
  reason_for_abroad        TEXT,
  nin_issue                TEXT        DEFAULT 'no_issues',
  submitted                BOOLEAN     NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.application_details ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.documents (
  id          UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID                   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        public.document_type   NOT NULL,
  file_path   TEXT                   NOT NULL,
  file_name   TEXT,
  status      public.document_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ            NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID                  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id      UUID                  REFERENCES public.applications(id) ON DELETE SET NULL,
  invoice_id          UUID                  REFERENCES public.invoices(id)     ON DELETE SET NULL,
  amount              NUMERIC               NOT NULL,
  total_amount        NUMERIC,
  balance             NUMERIC               NOT NULL DEFAULT 0,
  currency            TEXT                  DEFAULT 'UGX',
  method              TEXT,
  reference           TEXT,
  receipt_url         TEXT,
  payment_type        public.payment_type   NOT NULL DEFAULT 'other',
  service_description TEXT,
  status              public.payment_status NOT NULL DEFAULT 'pending',
  notes               TEXT,
  created_by          UUID,
  created_at          TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ           NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id     UUID        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT,
  subject    TEXT,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.form_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  category    TEXT        NOT NULL DEFAULT 'general',
  file_path   TEXT        NOT NULL,
  file_name   TEXT        NOT NULL,
  file_size   INTEGER,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_by  UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. FUNCTIONS THAT REFERENCE TABLES
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.set_applicant_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.applicant_code IS NULL THEN
    NEW.applicant_code :=
      'APP-' || LPAD(nextval('public.applicant_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number :=
      'INV-' || LPAD(nextval('public.invoice_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.recalc_invoice_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invoice_id UUID;
  v_due        NUMERIC;
  v_paid       NUMERIC;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF v_invoice_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT amount_due INTO v_due
    FROM public.invoices WHERE id = v_invoice_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM public.payments
    WHERE invoice_id = v_invoice_id
      AND status IN ('verified', 'paid');

  UPDATE public.invoices
  SET
    amount_paid = v_paid,
    balance     = GREATEST(0, v_due - v_paid),
    status      = CASE
                    WHEN v_paid <= 0    THEN 'unpaid'
                    WHEN v_paid < v_due THEN 'partial'
                    ELSE                    'paid'
                  END,
    updated_at  = now()
  WHERE id = v_invoice_id;

  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'applicant')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.log_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.application_status_history
      (application_id, status, notes, changed_by)
    VALUES (NEW.id, NEW.status, NEW.admin_notes, auth.uid());

    IF NEW.applicant_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        NEW.applicant_id,
        'Application status updated',
        'Your application status is now: ' || NEW.status
      );
    END IF;
  END IF;
  RETURN NEW;
END; $$;


-- ============================================================
-- 6. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS profiles_updated ON public.profiles;
CREATE TRIGGER profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_applicant_code ON public.profiles;
CREATE TRIGGER profiles_set_applicant_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_applicant_code();

DROP TRIGGER IF EXISTS jobs_updated ON public.jobs;
CREATE TRIGGER jobs_updated
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS invoices_set_number ON public.invoices;
CREATE TRIGGER invoices_set_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

DROP TRIGGER IF EXISTS invoices_set_updated_at ON public.invoices;
CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS applications_updated ON public.applications;
CREATE TRIGGER applications_updated
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS applications_status_log ON public.applications;
CREATE TRIGGER applications_status_log
  AFTER INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.log_application_status();

DROP TRIGGER IF EXISTS set_application_details_updated_at ON public.application_details;
CREATE TRIGGER set_application_details_updated_at
  BEFORE UPDATE ON public.application_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS documents_updated ON public.documents;
CREATE TRIGGER documents_updated
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS payments_updated ON public.payments;
CREATE TRIGGER payments_updated
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS payments_recalc_invoice ON public.payments;
CREATE TRIGGER payments_recalc_invoice
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_totals();

DROP TRIGGER IF EXISTS form_templates_updated ON public.form_templates;
CREATE TRIGGER form_templates_updated
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 7. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS payments_invoice_id_idx
  ON public.payments(invoice_id);

CREATE INDEX IF NOT EXISTS applications_applicant_id_idx
  ON public.applications(applicant_id);

CREATE INDEX IF NOT EXISTS applications_job_id_idx
  ON public.applications(job_id);

CREATE INDEX IF NOT EXISTS application_status_history_application_id_idx
  ON public.application_status_history(application_id);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx
  ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS documents_user_id_idx
  ON public.documents(user_id);

CREATE INDEX IF NOT EXISTS payments_user_id_idx
  ON public.payments(user_id);


-- ============================================================
-- 8. RLS POLICIES  (DROP IF EXISTS before each CREATE)
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles self select"  ON public.profiles;
DROP POLICY IF EXISTS "profiles self update"  ON public.profiles;
DROP POLICY IF EXISTS "profiles self insert"  ON public.profiles;
DROP POLICY IF EXISTS "profiles admin insert" ON public.profiles;

CREATE POLICY "profiles self select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles self insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles admin insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── user_roles ────────────────────────────────────────────────
DROP POLICY IF EXISTS "roles self read"    ON public.user_roles;
DROP POLICY IF EXISTS "roles admin manage" ON public.user_roles;

CREATE POLICY "roles self read" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "roles admin manage" ON public.user_roles
  FOR ALL TO authenticated
  USING    (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── jobs ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "jobs public read active" ON public.jobs;
DROP POLICY IF EXISTS "jobs admin manage"       ON public.jobs;

CREATE POLICY "jobs public read active" ON public.jobs
  FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "jobs admin manage" ON public.jobs
  FOR ALL TO authenticated
  USING    (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── applications ──────────────────────────────────────────────
DROP POLICY IF EXISTS "apps owner select" ON public.applications;
DROP POLICY IF EXISTS "apps owner insert" ON public.applications;
DROP POLICY IF EXISTS "apps owner update" ON public.applications;
DROP POLICY IF EXISTS "apps admin delete" ON public.applications;
DROP POLICY IF EXISTS "apps admin manage" ON public.applications;

CREATE POLICY "apps owner select" ON public.applications
  FOR SELECT TO authenticated
  USING (auth.uid() = applicant_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "apps owner insert" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "apps owner update" ON public.applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = applicant_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "apps admin delete" ON public.applications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "apps admin manage" ON public.applications
  FOR ALL TO authenticated
  USING    (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── application_status_history ────────────────────────────────
DROP POLICY IF EXISTS "status history read"         ON public.application_status_history;
DROP POLICY IF EXISTS "status history admin insert"  ON public.application_status_history;

CREATE POLICY "status history read" ON public.application_status_history
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND a.applicant_id = auth.uid()
    )
  );

CREATE POLICY "status history admin insert" ON public.application_status_history
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── application_details ───────────────────────────────────────
DROP POLICY IF EXISTS "details owner select" ON public.application_details;
DROP POLICY IF EXISTS "details owner insert" ON public.application_details;
DROP POLICY IF EXISTS "details owner update" ON public.application_details;

CREATE POLICY "details owner select" ON public.application_details
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "details owner insert" ON public.application_details
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "details owner update" ON public.application_details
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ── documents ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "docs owner select" ON public.documents;
DROP POLICY IF EXISTS "docs owner insert" ON public.documents;
DROP POLICY IF EXISTS "docs owner update" ON public.documents;
DROP POLICY IF EXISTS "docs owner delete" ON public.documents;

CREATE POLICY "docs owner select" ON public.documents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "docs owner insert" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "docs owner update" ON public.documents
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "docs owner delete" ON public.documents
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ── invoices ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "invoices admin manage" ON public.invoices;
DROP POLICY IF EXISTS "invoices owner read"   ON public.invoices;

CREATE POLICY "invoices admin manage" ON public.invoices
  FOR ALL TO authenticated
  USING    (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "invoices owner read" ON public.invoices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ── payments ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "pay owner select" ON public.payments;
DROP POLICY IF EXISTS "pay owner insert" ON public.payments;
DROP POLICY IF EXISTS "pay admin insert" ON public.payments;
DROP POLICY IF EXISTS "pay admin update" ON public.payments;

CREATE POLICY "pay owner select" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pay owner insert" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pay admin insert" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pay admin update" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── notifications ─────────────────────────────────────────────
DROP POLICY IF EXISTS "notif owner select" ON public.notifications;
DROP POLICY IF EXISTS "notif owner update" ON public.notifications;
DROP POLICY IF EXISTS "notif admin insert" ON public.notifications;

CREATE POLICY "notif owner select" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "notif owner update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notif admin insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- ── saved_jobs ────────────────────────────────────────────────
DROP POLICY IF EXISTS "saved owner all" ON public.saved_jobs;

CREATE POLICY "saved owner all" ON public.saved_jobs
  FOR ALL TO authenticated
  USING    (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── contact_messages ──────────────────────────────────────────
DROP POLICY IF EXISTS "contact anyone insert" ON public.contact_messages;
DROP POLICY IF EXISTS "contact admin select"  ON public.contact_messages;

CREATE POLICY "contact anyone insert" ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contact admin select" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── form_templates ────────────────────────────────────────────
DROP POLICY IF EXISTS "form_templates admin manage" ON public.form_templates;
DROP POLICY IF EXISTS "form_templates read active"  ON public.form_templates;

CREATE POLICY "form_templates admin manage" ON public.form_templates
  FOR ALL TO authenticated
  USING    (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "form_templates read active" ON public.form_templates
  FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));


-- ============================================================
-- 9. GRANTS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;


-- ============================================================
-- 10. STORAGE BUCKETS & POLICIES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant-documents', 'applicant-documents', false)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('form-templates', 'form-templates', true)
ON CONFLICT DO NOTHING;

-- avatars
DROP POLICY IF EXISTS "avatars public read"  ON storage.objects;
DROP POLICY IF EXISTS "avatars owner write"  ON storage.objects;
DROP POLICY IF EXISTS "avatars owner update" ON storage.objects;

CREATE POLICY "avatars public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- applicant-documents
DROP POLICY IF EXISTS "docs owner read"   ON storage.objects;
DROP POLICY IF EXISTS "docs owner write"  ON storage.objects;
DROP POLICY IF EXISTS "docs owner delete" ON storage.objects;

CREATE POLICY "docs owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'applicant-documents' AND
    (auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "docs owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'applicant-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "docs owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'applicant-documents' AND
    (auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'))
  );

-- receipts
DROP POLICY IF EXISTS "receipts owner read"  ON storage.objects;
DROP POLICY IF EXISTS "receipts owner write" ON storage.objects;

CREATE POLICY "receipts owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "receipts owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- form-templates
DROP POLICY IF EXISTS "form_templates storage read"         ON storage.objects;
DROP POLICY IF EXISTS "form_templates storage admin write"  ON storage.objects;
DROP POLICY IF EXISTS "form_templates storage admin delete" ON storage.objects;

CREATE POLICY "form_templates storage read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'form-templates');

CREATE POLICY "form_templates storage admin write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'form-templates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "form_templates storage admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'form-templates' AND public.has_role(auth.uid(), 'admin'));


-- ============================================================
-- 11. SECURITY — revoke public execution of internal functions
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_application_status() FROM PUBLIC, anon, authenticated;
