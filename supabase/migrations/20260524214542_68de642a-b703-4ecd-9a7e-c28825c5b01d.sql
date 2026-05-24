
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.log_application_status() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

DROP POLICY IF EXISTS "notif admin insert" ON public.notifications;
CREATE POLICY "notif admin insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
