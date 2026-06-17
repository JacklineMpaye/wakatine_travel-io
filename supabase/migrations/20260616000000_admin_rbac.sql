
-- ============================================================
-- Admin RBAC: named roles, granular module permissions
-- ============================================================

-- 1. admin_roles table  --------------------------------------------------
CREATE TABLE public.admin_roles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  description text,
  permissions text[]      NOT NULL DEFAULT '{}',
  created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  is_system   boolean     NOT NULL DEFAULT false
);
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER admin_roles_updated
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Extend user_roles  --------------------------------------------------
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_role_id   uuid    REFERENCES public.admin_roles(id) ON DELETE SET NULL;

-- Backward compat: every existing admin becomes a super admin
UPDATE public.user_roles SET is_super_admin = true WHERE role = 'admin';

-- 3. RLS for admin_roles  ------------------------------------------------
-- Super admins can fully manage roles
CREATE POLICY "admin_roles_super_manage" ON public.admin_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin' AND is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin' AND is_super_admin = true
    )
  );

-- All admins can read role definitions (so they know their own permissions)
CREATE POLICY "admin_roles_admin_read" ON public.admin_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. has_admin_permission() helper  --------------------------------------
CREATE OR REPLACE FUNCTION public.has_admin_permission(p_permission text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_super boolean;
  v_role_id  uuid;
  v_perms    text[];
BEGIN
  SELECT is_super_admin, admin_role_id
  INTO v_is_super, v_role_id
  FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
  LIMIT 1;

  IF NOT FOUND THEN RETURN false; END IF;
  IF v_is_super THEN RETURN true; END IF;

  IF v_role_id IS NOT NULL THEN
    SELECT permissions INTO v_perms FROM public.admin_roles WHERE id = v_role_id;
    RETURN p_permission = ANY(COALESCE(v_perms, ARRAY[]::text[]));
  END IF;

  RETURN false;
END;
$$;

-- 5. assign_admin_role RPC (super admin only)  ---------------------------
-- Grants an admin role to any registered user identified by email.
CREATE OR REPLACE FUNCTION public.assign_admin_role(p_email text, p_admin_role_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Permission denied: only super admins can assign admin roles';
  END IF;

  SELECT id INTO v_uid FROM public.profiles WHERE email = p_email LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No registered user found with email: %', p_email;
  END IF;
  IF v_uid = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own admin role';
  END IF;

  INSERT INTO public.user_roles (user_id, role, admin_role_id, is_super_admin)
  VALUES (v_uid, 'admin', p_admin_role_id, false)
  ON CONFLICT (user_id, role) DO UPDATE SET
    admin_role_id  = EXCLUDED.admin_role_id,
    is_super_admin = false;

  RETURN jsonb_build_object('user_id', v_uid);
END;
$$;

-- 6. revoke_admin_role RPC  ----------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_admin_role(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin access';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = p_user_id AND role = 'admin';

  -- Restore applicant role so the user can still log in
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'applicant')
  ON CONFLICT DO NOTHING;
END;
$$;

-- 7. get_admin_users RPC  ------------------------------------------------
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
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_super_admin = true
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
  LEFT JOIN public.profiles   p  ON p.id  = ur.user_id
  LEFT JOIN public.admin_roles ar ON ar.id = ur.admin_role_id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at;
END;
$$;
