import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import {
  LayoutDashboard, Users, FileText, CreditCard, Receipt,
  Briefcase, BarChart3, Bell, Settings, LogOut, ShieldCheck,
  Plane, FileSpreadsheet, ClipboardList, UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getModuleForPath } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

const adminNav = [
  { to: "/admin",               label: "Dashboard",     icon: LayoutDashboard, module: "dashboard",     exact: true },
  { to: "/admin/applicants",    label: "Applicants",    icon: Users,           module: "applicants" },
  { to: "/admin/applications",  label: "Applications",  icon: FileText,        module: "applications" },
  { to: "/admin/payments",      label: "Payments",      icon: CreditCard,      module: "payments" },
  { to: "/admin/receipts",      label: "Receipts",      icon: Receipt,         module: "receipts" },
  { to: "/admin/invoices",      label: "Invoices",      icon: FileSpreadsheet, module: "invoices" },
  { to: "/admin/forms",         label: "Forms",         icon: ClipboardList,   module: "forms" },
  { to: "/admin/jobs",          label: "Jobs",          icon: Briefcase,       module: "jobs" },
  { to: "/admin/reports",       label: "Reports",       icon: BarChart3,       module: "reports" },
  { to: "/admin/notifications", label: "Notifications", icon: Bell,            module: "notifications" },
  { to: "/admin/settings",      label: "Settings",      icon: Settings,        module: "settings" },
];

function NavItem({ to, label, icon: Icon, active }: { to: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-gradient-primary text-primary-foreground shadow-elegant"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />{label}
    </Link>
  );
}

function AdminLayout() {
  const { isAdmin, isSuperAdmin, hasPermission, loading, signOut } = useAuth();
  const nav  = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Which module does the current path belong to?
  const currentModule = getModuleForPath(path);
  // user_management is accessible to all admins; other modules check hasPermission
  const canAccessCurrent =
    !currentModule ||
    (currentModule === "user_management" ? isAdmin : hasPermission(currentModule));

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) { nav({ to: "/dashboard" }); return; }
    if (!canAccessCurrent) nav({ to: "/admin" });
  }, [loading, isAdmin, canAccessCurrent, nav]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!isAdmin) return null;
  if (!canAccessCurrent) return null;

  // Filter sidebar to only the modules this admin can see
  const visibleNav = adminNav.filter((item) =>
    item.module === "dashboard" || hasPermission(item.module)
  );

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-elegant"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plane className="w-5 h-5 text-gold" />
          </div>
          <div className="leading-tight">
            <div>Waka<span className="text-gold">tine</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Admin Portal</div>
          </div>
        </Link>

        <div className="text-xs font-medium text-primary mb-6 px-1 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          {isSuperAdmin ? "Super Administrator" : "Administrator"}
        </div>

        <nav className="flex-1 space-y-1">
          {visibleNav.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} active={active} />;
          })}

          {/* Admin Management — all admins */}
          <NavItem
            to="/admin/roles"
            label="Admin Management"
            icon={UserCog}
            active={path.startsWith("/admin/roles")}
          />
        </nav>

        <Button
          variant="ghost"
          onClick={async () => { await signOut(); nav({ to: "/" }); }}
          className="justify-start"
        >
          <LogOut className="w-4 h-4 mr-2" />Sign out
        </Button>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 md:p-6 pb-24 md:pb-6"><Outlet /></div>

        {/* Mobile bottom nav — show first 5 visible items */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border flex justify-around py-1.5 overflow-x-auto safe-bottom">
          {visibleNav.slice(0, 5).map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />{item.label}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
