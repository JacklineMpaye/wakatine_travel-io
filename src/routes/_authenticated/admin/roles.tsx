import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ADMIN_MODULES } from "@/lib/permissions";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, UserPlus, ShieldX, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/roles")({ component: AdminRoles });

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: string;
}

interface AdminUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_super_admin: boolean;
  admin_role_id: string | null;
  admin_role_name: string | null;
  admin_role_permissions: string[] | null;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sb = supabase as any;

async function fetchRoles(): Promise<AdminRole[]> {
  const { data, error } = await sb.from("admin_roles").select("*").order("created_at");
  if (error) throw error;
  return data ?? [];
}

async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await sb.rpc("get_admin_users");
  if (error) throw error;
  return data ?? [];
}

// ─── Role dialog (create / edit) ─────────────────────────────────────────────

function RoleDialog({
  role,
  onClose,
}: {
  role?: AdminRole;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [name, setName]               = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [perms, setPerms]             = useState<string[]>(role?.permissions ?? []);
  const [saving, setSaving]           = useState(false);

  const toggle = (key: string) =>
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  const save = async () => {
    if (!name.trim()) { toast.error("Role name is required"); return; }
    if (perms.length === 0) { toast.error("Select at least one permission"); return; }
    setSaving(true);
    try {
      if (role) {
        const { error } = await sb.from("admin_roles").update({ name, description, permissions: perms }).eq("id", role.id);
        if (error) throw error;
        toast.success("Role updated");
      } else {
        const { error } = await sb.from("admin_roles").insert({ name, description, permissions: perms, created_by: user?.id });
        if (error) throw error;
        toast.success("Role created");
      }
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{role ? "Edit Role" : "Create Role"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1">
          <Label>Role Name</Label>
          <Input
            placeholder="e.g. Finance Admin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={role?.is_system}
          />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Textarea
            placeholder="Brief description of this role…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Module Access</Label>
          <p className="text-xs text-muted-foreground">
            Select the dashboard sections this role can access.
          </p>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
            {ADMIN_MODULES.map((mod) => (
              <label
                key={mod.key}
                className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={perms.includes(mod.key)}
                  onCheckedChange={() => toggle(mod.key)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium leading-none">{mod.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{mod.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : role ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Add Admin dialog (super admin — with role selector) ─────────────────────

function AddAdminDialog({ roles, onClose }: { roles: AdminRole[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail]   = useState("");
  const [roleId, setRoleId] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!email.trim()) { toast.error("Enter an email address"); return; }
    if (!roleId) { toast.error("Select a role"); return; }
    setSaving(true);
    try {
      const { error } = await sb.rpc("assign_admin_role", {
        p_email: email.trim().toLowerCase(),
        p_admin_role_id: roleId,
      });
      if (error) throw error;
      toast.success("Admin assigned successfully");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to assign admin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>Add Admin</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1">
          <Label>User Email</Label>
          <Input type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
          <p className="text-xs text-muted-foreground">The user must already have a registered account.</p>
        </div>
        <div className="space-y-1">
          <Label>Assign Role</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger><SelectValue placeholder="Select a role…"/></SelectTrigger>
            <SelectContent>
              {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Assigning…" : "Assign Role"}</Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Promote dialog (any admin — simple email-only promotion) ─────────────────

function PromoteAdminDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail]   = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!email.trim()) { toast.error("Enter an email address"); return; }
    setSaving(true);
    try {
      const { error } = await sb.rpc("promote_to_admin", { p_email: email.trim().toLowerCase() });
      if (error) throw error;
      toast.success("User promoted to Admin");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to promote user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>Promote to Admin</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1">
          <Label>User Email</Label>
          <Input type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
          <p className="text-xs text-muted-foreground">The user must have a registered account. They will be granted admin access without a specific module role.</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Promoting…" : "Promote to Admin"}</Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Change role dialog ───────────────────────────────────────────────────────

function ChangeRoleDialog({
  adminUser,
  roles,
  onClose,
}: {
  adminUser: AdminUser;
  roles: AdminRole[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [roleId, setRoleId] = useState(adminUser.admin_role_id ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!roleId) { toast.error("Select a role"); return; }
    setSaving(true);
    try {
      const { error } = await sb.rpc("assign_admin_role", {
        p_email: adminUser.email,
        p_admin_role_id: roleId,
      });
      if (error) throw error;
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Change Role — {adminUser.full_name ?? adminUser.email}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1">
          <Label>Role</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role…" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Update Role"}</Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function AdminRoles() {
  const { isAdmin, isSuperAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc  = useQueryClient();

  const [roleDialog, setRoleDialog]         = useState<{ open: boolean; role?: AdminRole }>({ open: false });
  const [addAdminOpen, setAddAdminOpen]     = useState(false);
  const [changeRoleUser, setChangeRoleUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) nav({ to: "/admin" });
  }, [loading, isAdmin, nav]);

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: fetchRoles,
    enabled: isAdmin,
  });

  const { data: adminUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
    enabled: isAdmin,
  });

  const revokeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await sb.rpc("remove_admin", { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Admin access removed");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to remove admin access"),
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("admin_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role deleted");
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete role"),
  });

  if (loading || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isSuperAdmin
            ? "Create custom admin roles with scoped module access, then assign them to staff."
            : "View and manage admin users. Promote registered users to admin or remove admin access."}
        </p>
      </div>

      <Tabs defaultValue={isSuperAdmin ? "roles" : "users"}>
        <TabsList>
          {isSuperAdmin && <TabsTrigger value="roles">Admin Roles</TabsTrigger>}
          <TabsTrigger value="users">Admin Users</TabsTrigger>
        </TabsList>

        {/* ── Roles tab (super admin only) ── */}
        {isSuperAdmin && (
        <TabsContent value="roles" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog
              open={roleDialog.open && !roleDialog.role}
              onOpenChange={(o) => setRoleDialog({ open: o })}
            >
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />New Role</Button>
              </DialogTrigger>
              <RoleDialog onClose={() => setRoleDialog({ open: false })} />
            </Dialog>
          </div>

          {loadingRoles ? (
            <p className="text-muted-foreground text-sm">Loading roles…</p>
          ) : roles.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No custom roles yet. Create one to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{role.name}</CardTitle>
                      <div className="flex gap-1 shrink-0">
                        {/* Edit */}
                        <Dialog
                          open={roleDialog.open && roleDialog.role?.id === role.id}
                          onOpenChange={(o) => setRoleDialog(o ? { open: true, role } : { open: false })}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <RoleDialog
                            role={role}
                            onClose={() => setRoleDialog({ open: false })}
                          />
                        </Dialog>

                        {/* Delete */}
                        {!role.is_system && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{role.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Admins assigned this role will lose all module access. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteRole.mutate(role.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((p) => {
                        const mod = ADMIN_MODULES.find((m) => m.key === p);
                        return (
                          <Badge key={p} variant="secondary" className="text-xs">
                            {mod?.label ?? p}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        )}

        {/* ── Admin Users tab ── */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={isSuperAdmin && roles.length === 0}>
                  <UserPlus className="w-4 h-4 mr-1" />{isSuperAdmin ? "Add Admin" : "Promote to Admin"}
                </Button>
              </DialogTrigger>
              {isSuperAdmin
                ? <AddAdminDialog roles={roles} onClose={() => setAddAdminOpen(false)} />
                : <PromoteAdminDialog onClose={() => setAddAdminOpen(false)} />
              }
            </Dialog>
          </div>

          {isSuperAdmin && roles.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Create at least one role before adding admins.
            </p>
          )}

          {loadingUsers ? (
            <p className="text-muted-foreground text-sm">Loading admins…</p>
          ) : adminUsers.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No admin users found.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Name / Email</th>
                    <th className="text-left px-4 py-2.5 font-medium">Role</th>
                    <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Permissions</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {adminUsers.map((u) => (
                    <tr key={u.user_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium leading-tight">{u.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_super_admin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                            <ShieldCheck className="w-3.5 h-3.5" />Super Admin
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-xs">{u.admin_role_name ?? "No role"}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {u.is_super_admin ? (
                          <span className="text-xs text-muted-foreground">All modules</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(u.admin_role_permissions ?? []).map((p) => {
                              const mod = ADMIN_MODULES.find((m) => m.key === p);
                              return (
                                <Badge key={p} variant="secondary" className="text-xs">
                                  {mod?.label ?? p}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!u.is_super_admin && (
                          <div className="flex items-center gap-1 justify-end">
                            {/* Change role — super admin only */}
                            {isSuperAdmin && (
                              <Dialog
                                open={changeRoleUser?.user_id === u.user_id}
                                onOpenChange={(o) => setChangeRoleUser(o ? u : null)}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                                    <Pencil className="w-3 h-3 mr-1" />Role
                                  </Button>
                                </DialogTrigger>
                                {changeRoleUser?.user_id === u.user_id && (
                                  <ChangeRoleDialog
                                    adminUser={u}
                                    roles={roles}
                                    onClose={() => setChangeRoleUser(null)}
                                  />
                                )}
                              </Dialog>
                            )}

                            {/* Remove admin */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-destructive hover:text-destructive"
                                >
                                  <ShieldX className="w-3 h-3 mr-1" />Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove admin access?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.full_name ?? u.email} will lose all admin privileges and be
                                    downgraded to a regular applicant account.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => revokeAdmin.mutate(u.user_id)}
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
