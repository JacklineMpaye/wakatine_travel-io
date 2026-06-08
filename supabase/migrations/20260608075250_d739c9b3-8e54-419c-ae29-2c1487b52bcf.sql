
ALTER TABLE public.application_details
  ADD COLUMN IF NOT EXISTS preferred_jobs text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS reason_for_abroad text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS assigned_job_employer text,
  ADD COLUMN IF NOT EXISTS assigned_job_salary text,
  ADD COLUMN IF NOT EXISTS assigned_job_benefits text,
  ADD COLUMN IF NOT EXISTS assigned_job_contract_duration text,
  ADD COLUMN IF NOT EXISTS assigned_job_description_path text;
