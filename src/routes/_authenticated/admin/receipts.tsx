import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Receipt as ReceiptIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/receipts")({ component: AdminReceipts });

function generateReceiptNo(id: string) {
  return "WKT-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function printReceipt(p: any) {
  const no = generateReceiptNo(p.id);
  const html = `<!doctype html><html><head><title>Receipt ${no}</title>
  <style>body{font-family:system-ui;padding:40px;max-width:600px;margin:auto}
  h1{color:#3b2a86;margin:0}.gold{color:#c9a84c}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}
  .total{font-size:1.5em;font-weight:bold}</style></head><body>
  <h1>Waka<span class="gold">tine</span> Tours & Travel Co. Ltd</h1>
  <p>Iganga, behind Stanbic Bank · +256 789 431 312</p>
  <hr/>
  <h2>OFFICIAL RECEIPT</h2>
  <p><strong>Receipt No:</strong> ${no}<br/>
  <strong>Date:</strong> ${new Date(p.created_at).toLocaleDateString()}<br/>
  <strong>Received from:</strong> ${p.profiles?.full_name ?? p.profiles?.email ?? "—"}<br/>
  <strong>For:</strong> ${p.payment_type ?? "Service"}<br/>
  <strong>Method:</strong> ${p.method ?? "—"} ${p.reference ? "· Ref: " + p.reference : ""}</p>
  <table><tr><th>Description</th><th style="text-align:right">Amount</th></tr>
  <tr><td>${p.notes ?? p.payment_type ?? "Payment"}</td><td style="text-align:right">${p.currency} ${Number(p.amount).toLocaleString()}</td></tr>
  </table>
  <p class="total" style="text-align:right;margin-top:20px">Total: ${p.currency} ${Number(p.amount).toLocaleString()}</p>
  <p style="margin-top:40px;text-align:center;color:#888">Thank you for choosing Wakatine Tours & Travel.</p>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); setTimeout(()=>w.print(), 300); }
}

function AdminReceipts() {
  const { data: pays = [] } = useQuery({
    queryKey: ["admin-receipts"],
    queryFn: async () => (await supabase.from("payments").select("*, profiles(full_name, email)").eq("status", "verified").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Receipts</div>
        <h1 className="text-3xl font-bold">Receipts & Invoices</h1>
        <p className="text-muted-foreground">Generate receipts for verified payments.</p>
      </div>
      <div className="grid gap-3">
        {pays.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No verified payments yet.</Card> : pays.map((p: any) => (
          <Card key={p.id} className="p-4 flex justify-between flex-wrap gap-3 items-center">
            <div>
              <div className="font-semibold flex items-center gap-2"><ReceiptIcon className="w-4 h-4 text-gold"/>{generateReceiptNo(p.id)}</div>
              <div className="text-sm text-muted-foreground">{p.profiles?.full_name ?? p.profiles?.email} · {p.currency} {Number(p.amount).toLocaleString()} · {new Date(p.created_at).toLocaleDateString()}</div>
            </div>
            <Button size="sm" onClick={()=>printReceipt(p)}><Printer className="w-4 h-4 mr-1"/>Print</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
