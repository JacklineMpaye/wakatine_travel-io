
-- 1. Applicant code + walk-in flag on profiles
CREATE SEQUENCE IF NOT EXISTS public.applicant_code_seq START 1;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS applicant_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_walk_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS district text;

CREATE OR REPLACE FUNCTION public.set_applicant_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.applicant_code IS NULL THEN
    NEW.applicant_code := 'APP-' || LPAD(nextval('public.applicant_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_set_applicant_code ON public.profiles;
CREATE TRIGGER profiles_set_applicant_code
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_applicant_code();

-- Backfill existing profiles
UPDATE public.profiles
SET applicant_code = 'APP-' || LPAD(nextval('public.applicant_code_seq')::text, 4, '0')
WHERE applicant_code IS NULL;

-- Admin can insert profiles (for walk-in applicants)
DROP POLICY IF EXISTS "profiles admin insert" ON public.profiles;
CREATE POLICY "profiles admin insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Payments: balance, total, service description, created_by, walk-in fields
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS total_amount numeric,
  ADD COLUMN IF NOT EXISTS balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_description text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Admin can insert payments for any user (walk-in or existing)
DROP POLICY IF EXISTS "pay admin insert" ON public.payments;
CREATE POLICY "pay admin insert" ON public.payments
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  service text NOT NULL,
  amount_due numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.invoice_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS invoices_set_number ON public.invoices;
CREATE TRIGGER invoices_set_number
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

DROP TRIGGER IF EXISTS invoices_set_updated_at ON public.invoices;
CREATE TRIGGER invoices_set_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices admin manage" ON public.invoices
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "invoices owner read" ON public.invoices
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
