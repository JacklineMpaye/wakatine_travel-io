import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Briefcase, FileText, CreditCard, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminHome });

function AdminHome() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [u, j, a, p, d] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "verified"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "deployed_abroad"),
      ]);
      const total = (p.data ?? []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
      return { users: u.count ?? 0, jobs: j.count ?? 0, apps: a.count ?? 0, paid: total, deployed: d.count ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin Dashboard</div>
        <h1 className="text-3xl font-bold">Operations overview</h1>
        <p className="text-muted-foreground">Manage applicants, applications, jobs and payments.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { i: Users, l: "Total applicants", v: stats?.users ?? 0 },
          { i: Briefcase, l: "Active jobs", v: stats?.jobs ?? 0 },
          { i: FileText, l: "Applications", v: stats?.apps ?? 0 },
          { i: CreditCard, l: "Total paid (UGX)", v: (stats?.paid ?? 0).toLocaleString() },
          { i: Users, l: "Deployed", v: stats?.deployed ?? 0 },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <s.i className="w-6 h-6 text-primary mb-2"/>
            <div className="text-2xl font-bold">{s.v}</div>
            <div className="text-sm text-muted-foreground">{s.l}</div>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { to: "/admin/applicants", l: "Applicants", d: "View, search and edit all applicants." },
          { to: "/admin/applications", l: "Applications", d: "Review submissions and update status." },
          { to: "/admin/payments", l: "Payments", d: "Record and verify payments." },
          { to: "/admin/receipts", l: "Receipts", d: "Generate invoices and receipts." },
          { to: "/admin/jobs", l: "Jobs", d: "Create and manage UAE job listings." },
          { to: "/admin/reports", l: "Reports", d: "Deployment, payment and applicant analytics." },
        ].map((q) => (
          <Link key={q.to} to={q.to}>
            <Card className="p-5 hover:shadow-elegant transition-shadow h-full">
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold">{q.l}</div>
                <ArrowRight className="w-4 h-4 text-muted-foreground"/>
              </div>
              <div className="text-sm text-muted-foreground">{q.d}</div>
            </Card>
          </Link>
        ))}
      </div>
      <div className="hidden"><Button>noop</Button></div>
    </div>
  );
}
