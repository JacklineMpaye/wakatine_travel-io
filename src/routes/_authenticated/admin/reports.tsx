import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Plane, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({ component: Reports });

function Reports() {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const [apps, pays, deployed] = await Promise.all([
        supabase.from("applications").select("status"),
        supabase.from("payments").select("amount, currency, status"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "deployed_abroad"),
      ]);
      const byStatus: Record<string, number> = {};
      (apps.data ?? []).forEach((a: any) => { byStatus[a.status] = (byStatus[a.status] ?? 0) + 1; });
      const verifiedTotal = (pays.data ?? []).filter((p: any) => p.status === "verified").reduce((s: number, p: any) => s + Number(p.amount), 0);
      const pendingTotal = (pays.data ?? []).filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);
      return { byStatus, verifiedTotal, pendingTotal, deployed: deployed.count ?? 0, total: (apps.data ?? []).length };
    },
  });
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Reports</div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Applicant, deployment and payment summaries.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5"><Users className="w-6 h-6 text-primary mb-2"/><div className="text-3xl font-bold">{data?.total ?? 0}</div><div className="text-sm text-muted-foreground">Total applications</div></Card>
        <Card className="p-5"><Plane className="w-6 h-6 text-primary mb-2"/><div className="text-3xl font-bold">{data?.deployed ?? 0}</div><div className="text-sm text-muted-foreground">Deployed abroad</div></Card>
        <Card className="p-5"><CreditCard className="w-6 h-6 text-primary mb-2"/><div className="text-3xl font-bold">UGX {(data?.verifiedTotal ?? 0).toLocaleString()}</div><div className="text-sm text-muted-foreground">Verified payments</div></Card>
      </div>
      <Card className="p-6">
        <h2 className="font-bold text-lg mb-3">Applications by status</h2>
        <div className="space-y-2">
          {Object.entries(data?.byStatus ?? {}).map(([s, n]) => (
            <div key={s} className="flex justify-between text-sm border-b pb-1.5">
              <span>{s.replace(/_/g, " ")}</span>
              <span className="font-semibold">{n}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-bold text-lg mb-3">Payments summary</h2>
        <div className="text-sm space-y-1">
          <div className="flex justify-between"><span>Verified</span><span className="font-semibold">UGX {(data?.verifiedTotal ?? 0).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Pending</span><span className="font-semibold text-warning">UGX {(data?.pendingTotal ?? 0).toLocaleString()}</span></div>
        </div>
      </Card>
    </div>
  );
}
