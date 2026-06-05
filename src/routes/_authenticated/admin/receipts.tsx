import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Receipt as ReceiptIcon, Download, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/receipts")({ component: AdminReceipts });

function generateReceiptNo(id: string) {
  return "WKT-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function buildReceiptHtml(p: any, adminName: string) {
  const no = generateReceiptNo(p.id);
  const amount = Number(p.amount);
  const total = Number(p.total_amount ?? amount);
  const balance = Number(p.balance ?? Math.max(0, total - amount));
  const service = p.service_description || p.payment_type?.replace(/_/g, " ") || "Service";
  return `<!doctype html><html><head><title>Receipt ${no}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,sans-serif;padding:32px;max-width:720px;margin:auto;color:#1a1a1a}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #3b2a86;padding-bottom:16px;margin-bottom:24px}
  h1{color:#3b2a86;margin:0;font-size:24px}
  .gold{color:#c9a84c}
  .sub{color:#666;font-size:13px;margin-top:4px}
  .badge{background:#3b2a86;color:#fff;padding:6px 14px;border-radius:6px;font-weight:600;letter-spacing:1px;font-size:12px}
  h2{margin:0 0 16px;color:#3b2a86;font-size:18px;letter-spacing:2px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:20px;font-size:14px}
  .grid div strong{display:block;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#f5f3ee;text-align:left;padding:10px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#666}
  td{padding:12px 10px;border-bottom:1px solid #eee}
  .totals{margin-top:16px;padding:16px;background:#faf8f5;border-radius:8px}
  .row{display:flex;justify-content:space-between;padding:4px 0}
  .row.big{font-size:1.3em;font-weight:bold;color:#3b2a86;border-top:2px solid #3b2a86;margin-top:8px;padding-top:10px}
  .row.bal{color:#c44}
  .footer{margin-top:40px;text-align:center;color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px}
  .sig{display:flex;justify-content:space-between;margin-top:48px;font-size:12px}
  .sig div{border-top:1px solid #333;padding-top:6px;width:40%;text-align:center;color:#666}
  @media print{body{padding:20px}}
</style></head><body>
<div class="head">
  <div>
    <h1>Waka<span class="gold">tine</span> Tours &amp; Travel Co. Ltd</h1>
    <div class="sub">Iganga, behind Stanbic Bank · +256 789 431 312 / +256 740 052 907</div>
    <div class="sub">info@wakatine.ug</div>
  </div>
  <div class="badge">OFFICIAL RECEIPT</div>
</div>
<div class="grid">
  <div><strong>Receipt No</strong>${no}</div>
  <div><strong>Date</strong>${new Date(p.created_at).toLocaleDateString()}</div>
  <div><strong>Applicant Code</strong>${p.profiles?.applicant_code ?? "—"}</div>
  <div><strong>Received from</strong>${p.profiles?.full_name ?? p.profiles?.email ?? "—"}</div>
  <div><strong>Phone</strong>${p.profiles?.phone ?? "—"}</div>
  <div><strong>Method</strong>${p.method ?? "—"}${p.reference ? " · Ref " + p.reference : ""}</div>
</div>
<h2>PAYMENT DETAILS</h2>
<table>
  <tr><th>Service / Description</th><th style="text-align:right">Amount</th></tr>
  <tr><td>${service}${p.notes ? "<br/><span style='color:#888;font-size:12px'>"+p.notes+"</span>" : ""}</td><td style="text-align:right">${p.currency} ${amount.toLocaleString()}</td></tr>
</table>
<div class="totals">
  <div class="row"><span>Total fee</span><span>${p.currency} ${total.toLocaleString()}</span></div>
  <div class="row"><span>Amount paid</span><span>${p.currency} ${amount.toLocaleString()}</span></div>
  <div class="row bal big"><span>Balance due</span><span>${p.currency} ${balance.toLocaleString()}</span></div>
</div>
<div class="sig">
  <div>Applicant signature</div>
  <div>${adminName}<br/><span style="color:#999">Authorised by</span></div>
</div>
<div class="footer">Thank you for choosing Wakatine Tours &amp; Travel. This is a computer-generated receipt.</div>
</body></html>`;
}

function openReceiptWindow(p: any, adminName: string, autoPrint: boolean) {
  const html = buildReceiptHtml(p, adminName);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html); w.document.close();
  if (autoPrint) setTimeout(()=>w.print(), 400);
}

function downloadReceipt(p: any, adminName: string) {
  const html = buildReceiptHtml(p, adminName);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${generateReceiptNo(p.id)}.html`;
  a.click(); URL.revokeObjectURL(url);
}

function AdminReceipts() {
  const [q, setQ] = useState("");
  const { data: me } = useQuery({
    queryKey: ["me-name"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "Administrator";
      const { data: p } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single();
      return p?.full_name ?? p?.email ?? "Administrator";
    },
  });
  const { data: pays = [] } = useQuery({
    queryKey: ["admin-receipts"],
    queryFn: async () => (await supabase.from("payments").select("*, profiles(full_name, email, phone, applicant_code)").in("status", ["verified", "paid"]).order("created_at", { ascending: false })).data ?? [],
  });
  const adminName = me ?? "Administrator";
  const filtered = pays.filter((p: any) => !q || [
    generateReceiptNo(p.id), p.profiles?.full_name, p.profiles?.email, p.profiles?.phone, p.profiles?.applicant_code, p.service_description,
  ].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Receipts</div>
        <h1 className="text-3xl font-bold">Receipts</h1>
        <p className="text-muted-foreground">Generate, print, download and reprint receipts for verified payments.</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground"/>
        <Input className="pl-9" placeholder="Search by receipt no, applicant, code…" value={q} onChange={(e)=>setQ(e.target.value)}/>
      </div>
      <div className="grid gap-3">
        {filtered.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No verified payments yet. Verify payments to generate receipts.</Card> : filtered.map((p: any) => (
          <Card key={p.id} className="p-4 flex justify-between flex-wrap gap-3 items-center">
            <div>
              <div className="font-semibold flex items-center gap-2"><ReceiptIcon className="w-4 h-4 text-gold"/>{generateReceiptNo(p.id)}</div>
              <div className="text-sm text-muted-foreground">
                {p.profiles?.applicant_code ?? ""} · {p.profiles?.full_name ?? p.profiles?.email} · {p.profiles?.phone ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {p.service_description ?? p.payment_type} · {p.currency} {Number(p.amount).toLocaleString()}
                {Number(p.balance) > 0 && <span className="text-destructive"> · Balance {p.currency} {Number(p.balance).toLocaleString()}</span>}
                {" · "}{new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={()=>openReceiptWindow(p, adminName, false)}><ReceiptIcon className="w-4 h-4 mr-1"/>View</Button>
              <Button size="sm" onClick={()=>openReceiptWindow(p, adminName, true)}><Printer className="w-4 h-4 mr-1"/>Print</Button>
              <Button size="sm" variant="outline" onClick={()=>downloadReceipt(p, adminName)}><Download className="w-4 h-4 mr-1"/>Download</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
