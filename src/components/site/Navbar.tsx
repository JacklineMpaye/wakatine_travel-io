import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/jobs", label: "UAE Jobs" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-elegant" style={{ background: "var(--gradient-primary)" }}>
            <Plane className="w-5 h-5 text-gold" />
          </div>
          <div className="leading-tight">
            <div className="text-base">Waka<span className="text-gold">tine</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Tours & Travel</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && <Link to="/admin"><Button variant="ghost" size="sm">Admin</Button></Link>}
              <Link to="/dashboard"><Button size="sm">Dashboard</Button></Link>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/signup"><Button size="sm" className="shadow-elegant" style={{ background: "var(--gradient-primary)" }}>Apply Now</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-md">
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="flex-1"><Button className="w-full">Dashboard</Button></Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="flex-1"><Button variant="outline" className="w-full">Sign In</Button></Link>
                  <Link to="/signup" onClick={() => setOpen(false)} className="flex-1"><Button className="w-full">Apply</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}