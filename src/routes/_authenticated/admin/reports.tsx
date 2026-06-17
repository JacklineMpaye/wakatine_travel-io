import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plane, CreditCard, Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({ component: Reports });

function exportListing(title: string, rows: { headers: string[]; data: (string | number | null)[][] }) {
  const html = `<!doctype html><html><head><title>${title}</title>
<style>body{font-family:system-ui;padding:32px;max-width:1100px;margin:auto;color:#1a1a1a}
h1{color:#3b2a86;border-bottom:3px solid #3b2a86;padding-bottom:10px}
table{width:100%;border-collapse:collapse;margin-top:14px;font-size:11px}
th{background:#f5f3ee;text-align:left;padding:7px 8px;text-transform:uppercase;font-size:10px;letter-spacing:.5px;white-space:nowrap}
td{padding:7px 8px;border-bottom:1px solid #eee;vertical-align:top}
.meta{color:#666;font-size:12px;margin-bottom:8px}
@media print{body{padding:18px}}
</style></head><body>
<h1>Wakatine · ${title}</h1>
<div class="meta">Generated ${new Date().toLocaleString()}</div>
<table><thead><tr>${rows.headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
<tbody>${rows.data.map(r=>`<tr>${r.map(c=>`<td>${c ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody></table>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html); w.document.close();
  setTimeout(() => w.print(), 400);
}

function Reports() {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const [apps, pays, deployed, profiles, appDetails, deployedRows, payRows] = await Promise.all([
        supabase.from("applications").select("status"),
        supabase.from("payments").select("amount, currency, status"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "deployed_abroad"),
        supabase.from("profiles")
          .select("id, applicant_code, full_name, phone, district, profession, is_walk_in, created_at")
          .order("applicant_code"),
        // Fetch family/contact fields from application_details
        supabase.from("application_details")
          .select("user_id, father_name, father_phone, mother_name, mother_phone, next_of_kin_name, next_of_kin_phone, next_of_kin_relationship"),
        supabase.from("applications")
          .select("status, created_at, profiles(applicant_code, full_name), jobs(title, country)")
          .eq("status", "deployed_abroad")
          .order("created_at", { ascending: false }),
        supabase.from("payments")
          .select("amount, currency, status, payment_type, method, created_at, profiles(applicant_code, full_name)")
          .order("created_at", { ascending: false }),
      ]);

      const byStatus: Record<string, number> = {};
      (apps.data ?? []).forEach((a: any) => { byStatus[a.status] = (byStatus[a.status] ?? 0) + 1; });
      const verifiedTotal = (pays.data ?? []).filter((p: any) => p.status === "verified").reduce((s: number, p: any) => s + Number(p.amount), 0);
      const pendingTotal  = (pays.data ?? []).filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);

      // Merge application_details family fields into profiles by user_id
      const detailMap = new Map((appDetails.data ?? []).map((d: any) => [d.user_id, d]));
      const enrichedProfiles = (profiles.data ?? []).map((p: any) => ({
        ...p,
        ...(detailMap.get(p.id) ?? {}),
      }));

      return {
        byStatus, verifiedTotal, pendingTotal, deployed: deployed.count ?? 0, total: (apps.data ?? []).length,
        profiles: enrichedProfiles, deployedRows: deployedRows.data ?? [], payRows: payRows.data ?? [],
      };
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
        <h2 className="font-bold text-lg mb-1">Export reports</h2>
        <p className="text-xs text-muted-foreground mb-4">All reports include family contact details (father, mother, next of kin) and district of residence.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {/* Applicant / Biodata report */}
          <Button variant="outline" onClick={() => exportListing("Biodata Summary Report", {
            headers: [
              "Code","Full Name","Phone","District",
              "Father Name","Father Phone",
              "Mother Name","Mother Phone",
              "Next of Kin","Next of Kin Phone","Kin Relationship",
              "Profession","Type","Joined",
            ],
            data: (data?.profiles ?? []).map((r: any) => [
              r.applicant_code, r.full_name, r.phone, r.district,
              r.father_name,    r.father_phone,
              r.mother_name,    r.mother_phone,
              r.next_of_kin_name, r.next_of_kin_phone, r.next_of_kin_relationship,
              r.profession, r.is_walk_in ? "Walk-in" : "Registered",
              new Date(r.created_at).toLocaleDateString(),
            ]),
          })}>
            <Printer className="w-4 h-4 mr-1"/>Biodata Report
          </Button>

          {/* Payment report */}
          <Button variant="outline" onClick={() => exportListing("Payment Report", {
            headers: ["Code","Applicant","Amount","Currency","Type","Method","Status","Date"],
            data: (data?.payRows ?? []).map((r: any) => [
              r.profiles?.applicant_code, r.profiles?.full_name,
              Number(r.amount).toLocaleString(), r.currency,
              r.payment_type, r.method, r.status,
              new Date(r.created_at).toLocaleDateString(),
            ]),
          })}>
            <Printer className="w-4 h-4 mr-1"/>Payments
          </Button>

          {/* Deployment report */}
          <Button variant="outline" onClick={() => exportListing("Deployment Report", {
            headers: ["Code","Applicant","Job","Country","Deployed"],
            data: (data?.deployedRows ?? []).map((r: any) => [
              r.profiles?.applicant_code, r.profiles?.full_name,
              r.jobs?.title, r.jobs?.country,
              new Date(r.created_at).toLocaleDateString(),
            ]),
          })}>
            <Printer className="w-4 h-4 mr-1"/>Deployments
          </Button>
        </div>
      </Card>

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
