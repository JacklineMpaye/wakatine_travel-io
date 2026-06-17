import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { LayoutDashboard, FolderOpen, CreditCard, Bell, User, LogOut, Plane, ClipboardCheck, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({ component: AuthLayout });

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/my-application", label: "My Application", icon: ClipboardCheck },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/forms", label: "Forms", icon: FileDown },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

function AuthLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/login" }); return; }
    // Admins are not allowed in the applicant portal
    if (isAdmin && !path.startsWith("/admin")) nav({ to: "/admin" });
  }, [user, loading, isAdmin, nav, path]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  // While redirecting admins, render nothing under applicant layout
  if (isAdmin && !path.startsWith("/admin")) return null;
  // Admin section uses its own layout
  if (path.startsWith("/admin")) return <Outlet />;

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-elegant" style={{ background: "var(--gradient-primary)" }}><Plane className="w-5 h-5 text-gold"/></div>
          <div className="leading-tight">
            <div>Waka<span className="text-gold">tine</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Applicant Portal</div>
          </div>
        </Link>
        <div className="text-xs text-muted-foreground mb-6 px-1">Signed in as Applicant</div>
        <nav className="flex-1 space-y-1">
          {navItems.map((i) => {
            const active = path === i.to;
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
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border flex justify-around py-1.5 safe-bottom">
          {navItems.slice(0,5).map((i) => {
            const active = path === i.to;
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
