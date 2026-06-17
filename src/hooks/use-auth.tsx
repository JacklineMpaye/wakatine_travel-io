import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "applicant";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: Role[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Module permission keys granted to this admin. Empty array means super admin (all access). */
  permissions: string[];
  /** Returns true if the current user may access the given module key. Super admins always return true. */
  hasPermission: (module: string) => boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]         = useState<Session | null>(null);
  const [roles, setRoles]             = useState<Role[]>([]);
  const [isSuperAdmin, setSuper]      = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s?.user) {
        setRoles([]);
        setSuper(false);
        setPermissions([]);
        setLoading(false);
        return;
      }

      (async () => {
        // Fetch role row – select * so new columns (is_super_admin, admin_role_id)
        // are included even before types.ts is regenerated.
        const { data: rawRows } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", s.user.id);

        type RoleRow = { role: string; is_super_admin: boolean; admin_role_id: string | null };
        const rows = (rawRows ?? []) as unknown as RoleRow[];

        setRoles(rows.map((r) => r.role as Role));

        const adminRow = rows.find((r) => r.role === "admin");
        if (!adminRow) {
          setSuper(false);
          setPermissions([]);
          setLoading(false);
          return;
        }

        setSuper(adminRow.is_super_admin);

        if (!adminRow.is_super_admin && adminRow.admin_role_id) {
          // Fetch the permission list from the assigned role
          const { data: roleData } = await (supabase as any)
            .from("admin_roles")
            .select("permissions")
            .eq("id", adminRow.admin_role_id)
            .single();
          setPermissions((roleData as any)?.permissions ?? []);
        } else {
          setPermissions([]); // super admin — no restriction list needed
        }

        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = useCallback(
    (module: string) => isSuperAdmin || permissions.includes(module),
    [isSuperAdmin, permissions],
  );

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    roles,
    isAdmin: roles.includes("admin"),
    isSuperAdmin,
    permissions,
    hasPermission,
    loading,
    signOut: async () => { await supabase.auth.signOut(); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
