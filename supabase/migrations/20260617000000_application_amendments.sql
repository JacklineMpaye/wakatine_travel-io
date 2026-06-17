
-- ============================================================
-- Application Amendments: status flow, family fields, admin mgmt
-- ============================================================

-- 1. New status: job_assigned  ----------------------------------------
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'job_assigned';

-- 2. New family columns on application_details  -----------------------
ALTER TABLE public.application_details
  ADD COLUMN IF NOT EXISTS father_name  text,
  ADD COLUMN IF NOT EXISTS father_phone text,
  ADD COLUMN IF NOT EXISTS mother_name  text,
  ADD COLUMN IF NOT EXISTS mother_phone text;

-- 3. Update get_admin_users — now callable by any admin  --------------
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id                uuid,
  email                  text,
  full_name              text,
  is_super_admin         boolean,
  admin_role_id          uuid,
  admin_role_name        text,
  admin_role_permissions text[],
  created_at             timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN QUERY
  SELECT
    ur.user_id,
    p.email,
    p.full_name,
    ur.is_super_admin,
    ur.admin_role_id,
    ar.name          AS admin_role_name,
    ar.permissions   AS admin_role_permissions,
    ur.created_at
  FROM public.user_roles ur
  LEFT JOIN public.profiles    p  ON p.id  = ur.user_id
  LEFT JOIN public.admin_roles ar ON ar.id = ur.admin_role_id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at;
END;
$$;

-- 4. promote_to_admin — any admin can promote a registered user  ------
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_email text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT id INTO v_uid FROM public.profiles WHERE email = p_email LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No registered user found with email: %', p_email;
  END IF;
  IF v_uid = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  -- Make them an admin (no specific role, non-super)
  INSERT INTO public.user_roles (user_id, role, is_super_admin)
  VALUES (v_uid, 'admin', false)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('user_id', v_uid);
END;
$$;

-- 5. remove_admin — any admin can remove non-super-admin users  --------
CREATE OR REPLACE FUNCTION public.remove_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove your own admin access';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin' AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Cannot remove a Super Admin. Contact the system owner.';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = p_user_id AND role = 'admin';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'applicant')
  ON CONFLICT DO NOTHING;
END;
$$;
