
DROP POLICY IF EXISTS "status history admin insert" ON public.application_status_history;
CREATE POLICY "status history admin insert" ON public.application_status_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_application_status() FROM PUBLIC, anon, authenticated;
