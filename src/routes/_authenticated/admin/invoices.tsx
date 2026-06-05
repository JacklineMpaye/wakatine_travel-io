import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, FileSpreadsheet, Printer, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/invoices")({ component: AdminInvoices });

const STATUSES = ["unpaid", "partial", "paid", "cancelled"] as const;

function printInvoice(inv: any) {
  const balance = Number(inv.balance ?? (inv.amount_due - inv.amount_paid));
  const html = `<!doctype html><html><head><title>${inv.invoice_number}</title>
<style>body{font-family:system-ui;padding:32px;max-width:720px;margin:auto;color:#1a1a1a}
h1{color:#3b2a86;margin:0}.gold{color:#c9a84c}
.head{display:flex;justify-content:space-between;border-bottom:3px solid #3b2a86;padding-bottom:16px;margin-bottom:24px}
.badge{background:#3b2a86;color:#fff;padding:6px 14px;border-radius:6px;font-weight:600;font-size:12px;letter-spacing:1px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th{background:#f5f3ee;text-align:left;padding:10px;font-size:12px;text-transform:uppercase}
td{padding:12px 10px;border-bottom:1px solid #eee}
.totals{margin-top:16px;padding:16px;background:#faf8f5;border-radius:8px}
.row{display:flex;justify-content:space-between;padding:4px 0}
.row.big{font-size:1.3em;font-weight:bold;color:#3b2a86;border-top:2px solid #3b2a86;margin-top:8px;padding-top:10px}
</style></head><body>
<div class="head"><div><h1>Waka<span class="gold">tine</span> Tours &amp; Travel</h1>
<div style="color:#666;font-size:13px">Iganga, behind Stanbic Bank · +256 789 431 312</div></div>
<div class="badge">INVOICE</div></div>
<p><strong>Invoice No:</strong> ${inv.invoice_number}<br/>
<strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString()}<br/>
<strong>Bill to:</strong> ${inv.profiles?.applicant_code ?? ""} ${inv.profiles?.full_name ?? inv.profiles?.email ?? "—"}<br/>
<strong>Phone:</strong> ${inv.profiles?.phone ?? "—"}</p>
<table><tr><th>Service</th><th style="text-align:right">Amount</th></tr>
<tr><td>${inv.service}${inv.notes ? "<br/><span style='color:#888;font-size:12px'>"+inv.notes+"</span>" : ""}</td>
<td style="text-align:right">UGX ${Number(inv.amount_due).toLocaleString()}</td></tr></table>
<div class="totals">
<div class="row"><span>Amount due</span><span>UGX ${Number(inv.amount_due).toLocaleString()}</span></div>
<div class="row"><span>Amount paid</span><span>UGX ${Number(inv.amount_paid).toLocaleString()}</span></div>
<div class="row big"><span>Balance</span><span>UGX ${balance.toLocaleString()}</span></div>
</div></body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); setTimeout(()=>w.print(), 400); }
}

function AdminInvoices() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => (await supabase.from("invoices").select("*, profiles(full_name, email, phone, applicant_code)").order("created_at", { ascending: false })).data ?? [],
  });
  const filtered = rows.filter((r: any) => !q || [r.invoice_number, r.profiles?.full_name, r.profiles?.applicant_code, r.service]
    .filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Invoices</div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Issue invoices, track balances and print copies.</p>
        </div>
        <NewInvoice onCreated={()=>qc.invalidateQueries({ queryKey: ["admin-invoices"] })}/>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground"/>
        <Input className="pl-9" placeholder="Search invoice no, applicant…" value={q} onChange={(e)=>setQ(e.target.value)}/>
      </div>
      <div className="grid gap-3">
        {filtered.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No invoices yet.</Card> : filtered.map((inv: any) => (
          <Card key={inv.id} className="p-4 flex justify-between flex-wrap gap-3 items-center">
            <div>
              <div className="font-semibold flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-gold"/>{inv.invoice_number}</div>
              <div className="text-sm text-muted-foreground">
                {inv.profiles?.applicant_code} · {inv.profiles?.full_name ?? inv.profiles?.email} · {inv.service}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Due UGX {Number(inv.amount_due).toLocaleString()} · Paid UGX {Number(inv.amount_paid).toLocaleString()}
                {Number(inv.balance) > 0 && <span className="text-destructive"> · Balance UGX {Number(inv.balance).toLocaleString()}</span>}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Badge variant={inv.status === "paid" ? "default" : inv.status === "cancelled" ? "outline" : "secondary"}>{inv.status}</Badge>
              <EditInvoice row={inv} onSaved={()=>qc.invalidateQueries({ queryKey: ["admin-invoices"] })}/>
              <Button size="sm" onClick={()=>printInvoice(inv)}><Printer className="w-4 h-4 mr-1"/>Print</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NewInvoice({ onCreated }: { onCreated: ()=>void }) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState({ user_id: "", service: "", amount_due: "", amount_paid: "0", status: "unpaid", notes: "" });
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles-min-inv"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email, applicant_code").order("applicant_code")).data ?? [],
  });
  const submit = async () => {
    const e: Record<string,string> = {};
    if (!f.user_id) e.user_id = "Select an applicant";
    if (!f.service.trim()) e.service = "Service is required";
    const due = Number(f.amount_due);
    if (!f.amount_due || isNaN(due) || due <= 0) e.amount_due = "Enter a valid amount due";
    setErrors(e);
    if (Object.keys(e).length) return toast.error("Please fix the highlighted fields");
    const paid = Number(f.amount_paid || 0);
    const balance = Math.max(0, due - paid);
    const status = balance === 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("invoices").insert({
      user_id: f.user_id, service: f.service.trim(), amount_due: due, amount_paid: paid, balance,
      status, notes: f.notes || null, created_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Invoice created"); setOpen(false); setErrors({});
    setF({ user_id: "", service: "", amount_due: "", amount_paid: "0", status: "unpaid", notes: "" });
    onCreated();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="w-4 h-4 mr-1"/>New invoice</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create invoice</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Applicant <span className="text-destructive">*</span></Label>
            <select className={`h-10 px-3 rounded-md border bg-background w-full ${errors.user_id?"border-destructive":"border-input"}`} value={f.user_id} onChange={(e)=>setF({...f, user_id: e.target.value})}>
              <option value="">Select applicant…</option>
              {profiles.map((p: any) => <option key={p.id} value={p.id}>{p.applicant_code ?? "APP-????"} — {p.full_name ?? p.email}</option>)}
            </select>
            {errors.user_id && <p className="text-xs text-destructive mt-1">{errors.user_id}</p>}
          </div>
          <div>
            <Label>Service <span className="text-destructive">*</span></Label>
            <Input value={f.service} onChange={(e)=>setF({...f, service: e.target.value})} className={errors.service?"border-destructive":""}/>
            {errors.service && <p className="text-xs text-destructive mt-1">{errors.service}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount due (UGX) <span className="text-destructive">*</span></Label>
              <Input type="number" value={f.amount_due} onChange={(e)=>setF({...f, amount_due: e.target.value})} className={errors.amount_due?"border-destructive":""}/>
              {errors.amount_due && <p className="text-xs text-destructive mt-1">{errors.amount_due}</p>}
            </div>
            <div><Label>Amount paid (UGX)</Label><Input type="number" value={f.amount_paid} onChange={(e)=>setF({...f, amount_paid: e.target.value})}/></div>
          </div>
          <div><Label>Notes</Label><Input value={f.notes} onChange={(e)=>setF({...f, notes: e.target.value})}/></div>
          <Button className="w-full bg-gradient-primary" onClick={submit}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditInvoice({ row, onSaved }: { row: any; onSaved: ()=>void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    amount_due: String(row.amount_due ?? ""), amount_paid: String(row.amount_paid ?? ""),
    status: row.status, notes: row.notes ?? "", service: row.service ?? "",
  });
  const save = async () => {
    const due = Number(f.amount_due), paid = Number(f.amount_paid);
    if (isNaN(due) || due < 0 || isNaN(paid) || paid < 0) return toast.error("Invalid amounts");
    const balance = Math.max(0, due - paid);
    const { error } = await supabase.from("invoices").update({
      amount_due: due, amount_paid: paid, balance, status: f.status,
      service: f.service, notes: f.notes || null,
    }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Updated"); setOpen(false); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="w-4 h-4"/></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit invoice</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Service</Label><Input value={f.service} onChange={(e)=>setF({...f, service: e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount due</Label><Input type="number" value={f.amount_due} onChange={(e)=>setF({...f, amount_due: e.target.value})}/></div>
            <div><Label>Amount paid</Label><Input type="number" value={f.amount_paid} onChange={(e)=>setF({...f, amount_paid: e.target.value})}/></div>
          </div>
          <div>
            <Label>Status</Label>
            <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.status} onChange={(e)=>setF({...f, status: e.target.value})}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><Label>Notes</Label><Input value={f.notes} onChange={(e)=>setF({...f, notes: e.target.value})}/></div>
          <Button className="w-full bg-gradient-primary" onClick={save}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}