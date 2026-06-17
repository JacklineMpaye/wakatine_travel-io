-- Form templates: admins upload, applicants download & fill

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

DROP TRIGGER IF EXISTS form_templates_updated ON public.form_templates;
CREATE TRIGGER form_templates_updated
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "form_templates admin manage" ON public.form_templates;
DROP POLICY IF EXISTS "form_templates read active"  ON public.form_templates;

CREATE POLICY "form_templates admin manage" ON public.form_templates
  FOR ALL TO authenticated
  USING    (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "form_templates read active" ON public.form_templates
  FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('form-templates', 'form-templates', true)
ON CONFLICT DO NOTHING;

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
