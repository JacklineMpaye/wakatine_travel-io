import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { LayoutDashboard, Users, FileText, CreditCard, Receipt, Briefcase, BarChart3, Bell, Settings, LogOut, ShieldCheck, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/applicants", label: "Applicants", icon: Users },
  { to: "/admin/applications", label: "Applications", icon: FileText },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/receipts", label: "Receipts", icon: Receipt },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const { isAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !isAdmin) nav({ to: "/dashboard" });
  }, [isAdmin, loading, nav]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-elegant" style={{ background: "var(--gradient-primary)" }}><Plane className="w-5 h-5 text-gold"/></div>
          <div className="leading-tight">
            <div>Waka<span className="text-gold">tine</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Admin Portal</div>
          </div>
        </Link>
        <div className="text-xs font-medium text-primary mb-6 px-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Administrator</div>
        <nav className="flex-1 space-y-1">
          {adminNav.map((i) => {
            const active = i.exact ? path === i.to : path.startsWith(i.to);
            return (
              <Link key={i.to} to={i.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-gradient-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <i.icon className="w-4 h-4"/>{i.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" onClick={async () => { await signOut(); nav({ to: "/" }); }} className="justify-start"><LogOut className="w-4 h-4 mr-2"/>Sign out</Button>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 md:p-6 pb-24 md:pb-6"><Outlet/></div>
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border flex justify-around py-1.5 overflow-x-auto safe-bottom">
          {adminNav.slice(0,5).map((i) => {
            const active = i.exact ? path === i.to : path.startsWith(i.to);
            return (
              <Link key={i.to} to={i.to} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium ${active?"text-primary":"text-muted-foreground"}`}>
                <i.icon className="w-5 h-5"/>{i.label}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
