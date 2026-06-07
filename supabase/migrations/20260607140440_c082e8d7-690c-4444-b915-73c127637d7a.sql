
-- 1) New application statuses
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'approved';

-- 2) Payment ↔ Invoice link
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON public.payments(invoice_id);

-- 3) Job assignment on applications (custom or override of catalogue job)
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS assigned_job_title text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS assigned_job_country text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS assigned_job_description text;

-- 4) Auto-recalc invoice totals when payments are inserted/updated/deleted
CREATE OR REPLACE FUNCTION public.recalc_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id uuid;
  v_due numeric;
  v_paid numeric;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF v_invoice_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT amount_due INTO v_due FROM public.invoices WHERE id = v_invoice_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM public.payments
    WHERE invoice_id = v_invoice_id AND status IN ('verified', 'paid');

  UPDATE public.invoices
  SET amount_paid = v_paid,
      balance = GREATEST(0, v_due - v_paid),
      status = CASE
        WHEN v_paid <= 0 THEN 'unpaid'
        WHEN v_paid < v_due THEN 'partial'
        ELSE 'paid'
      END,
      updated_at = now()
  WHERE id = v_invoice_id;

  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS payments_recalc_invoice ON public.payments;
CREATE TRIGGER payments_recalc_invoice
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_totals();

-- 5) Ensure new application rows + status changes still log history & notify
-- (Trigger log_application_status already exists, just ensure it's attached.)
DROP TRIGGER IF EXISTS applications_status_log ON public.applications;
CREATE TRIGGER applications_status_log
AFTER INSERT OR UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.log_application_status();
