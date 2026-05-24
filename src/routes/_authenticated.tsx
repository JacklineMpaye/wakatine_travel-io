import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { LayoutDashboard, FileText, FolderOpen, CreditCard, Bell, User, LogOut, Briefcase, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({ component: AuthLayout });

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

function AuthLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground bg-gradient-primary"><Briefcase className="w-5 h-5"/></div>
          PearlBridge
        </Link>
        <nav className="flex-1 space-y-1">
          {navItems.map((i) => {
            const active = path === i.to;
            return (
              <Link key={i.to} to={i.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-gradient-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <i.icon className="w-4 h-4"/>{i.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${path.startsWith("/admin") ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              <ShieldCheck className="w-4 h-4"/>Admin
            </Link>
          )}
        </nav>
        <Button variant="ghost" onClick={async () => { await signOut(); nav({ to: "/" }); }} className="justify-start"><LogOut className="w-4 h-4 mr-2"/>Sign out</Button>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="md:hidden border-b border-border bg-card p-3 flex gap-2 overflow-x-auto">
          {navItems.map((i) => <Link key={i.to} to={i.to} className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-muted">{i.label}</Link>)}
          {isAdmin && <Link to="/admin" className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-muted">Admin</Link>}
        </div>
        <div className="p-6"><Outlet/></div>
      </main>
    </div>
  );
}
