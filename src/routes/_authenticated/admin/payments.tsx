import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, CheckCircle2, Pencil, UserPlus, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/payments")({ component: AdminPayments });

const PAYMENT_TYPES = [
  { value: "recruitment_processing", label: "Recruitment processing" },
  { value: "passport_processing", label: "Passport processing" },
  { value: "nin_assistance", label: "NIN assistance" },
  { value: "other", label: "Other" },
] as const;

function AdminPayments() {
  const qc = useQueryClient();
  const { data: pays = [] } = useQuery({
    queryKey: ["admin-pays"],
    queryFn: async () => (await supabase.from("payments").select("*, profiles(full_name, email, phone, applicant_code), invoices(invoice_number, service)").order("created_at", { ascending: false })).data ?? [],
  });
  const verify = async (id: string) => {
    const { error } = await supabase.from("payments").update({ status: "verified" as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Verified");
    qc.invalidateQueries({ queryKey: ["admin-pays"] });
    qc.invalidateQueries({ queryKey: ["admin-invoices"] });
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Payments</div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Record verified payments instantly. For money still owed, create an invoice from the Invoices page.</p>
        </div>
        <NewPayment onCreated={()=>qc.invalidateQueries({ queryKey: ["admin-pays"] })}/>
      </div>
      <div className="grid gap-3">
        {pays.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No payments yet.</Card> : pays.map((p: any) => (
          <Card key={p.id} className="p-4 flex justify-between flex-wrap gap-3 items-center">
            <div>
              <div className="font-semibold">{p.profiles?.applicant_code ? `${p.profiles.applicant_code} · ` : ""}{p.profiles?.full_name ?? p.profiles?.email ?? "(no applicant)"}</div>
              <div className="text-sm text-muted-foreground">
                Paid {p.currency} {Number(p.amount).toLocaleString()}
                {p.total_amount ? ` of ${p.currency} ${Number(p.total_amount).toLocaleString()}` : ""}
                {" · "}{p.service_description ?? p.payment_type ?? "—"} · {p.method ?? "—"}
              </div>
              {p.invoices?.invoice_number && <div className="text-xs text-primary mt-1">Applied to {p.invoices.invoice_number} — {p.invoices.service}</div>}
              {Number(p.balance) > 0 && <div className="text-xs text-destructive mt-1">Balance: {p.currency} {Number(p.balance).toLocaleString()}</div>}
              {p.notes && <div className="text-xs text-muted-foreground mt-1">{p.notes}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.status==="verified"||p.status==="paid"?"default":"secondary"}>{p.status}</Badge>
              <EditPayment row={p} onSaved={()=>qc.invalidateQueries({ queryKey: ["admin-pays"] })}/>
              {p.status !== "verified" && <Button size="sm" onClick={()=>verify(p.id)}><CheckCircle2 className="w-4 h-4 mr-1"/>Verify</Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

type Mode = "existing" | "walkin";
type Errors = Partial<Record<"user_id" | "full_name" | "phone" | "amount" | "payment_type" | "method", string>>;

function NewPayment({ onCreated }: { onCreated: ()=>void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("existing");
  const [errors, setErrors] = useState<Errors>({});
  const [f, setF] = useState({
    user_id: "", full_name: "", phone: "", district: "", nin: "",
    amount: "", total_amount: "", currency: "UGX", method: "Mobile Money",
    payment_type: "recruitment_processing" as "recruitment_processing" | "passport_processing" | "nin_assistance" | "other",
    service_description: "", reference: "", notes: "", invoice_id: "",
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles-min"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email, applicant_code").order("applicant_code")).data ?? [],
  });
  const { data: openInvoices = [] } = useQuery({
    queryKey: ["open-invoices-for", f.user_id],
    queryFn: async () => (await supabase.from("invoices").select("id, invoice_number, service, amount_due, balance, status").eq("user_id", f.user_id).in("status", ["unpaid", "partial"])).data ?? [],
    enabled: !!f.user_id && mode === "existing",
  });

  const validate = (): Errors => {
    const e: Errors = {};
    if (mode === "existing" && !f.user_id) e.user_id = "Select an applicant";
    if (mode === "walkin") {
      if (!f.full_name.trim()) e.full_name = "Full name is required";
      if (!f.phone.trim()) e.phone = "Phone is required";
    }
    const amt = Number(f.amount);
    if (!f.amount || isNaN(amt) || amt <= 0) e.amount = "Enter a valid amount greater than 0";
    if (!f.payment_type) e.payment_type = "Select a service type";
    if (!f.method.trim()) e.method = "Method is required";
    return e;
  };

  const create = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return toast.error("Please fix the highlighted fields");

    let userId = f.user_id;

    if (mode === "walkin") {
      const { data: prof, error: pErr } = await supabase.from("profiles").insert({
        id: crypto.randomUUID(),
        full_name: f.full_name.trim(),
        phone: f.phone.trim(),
        district: f.district.trim() || null,
        is_walk_in: true,
      }).select("id, applicant_code").single();
      if (pErr || !prof) return toast.error(pErr?.message ?? "Could not create applicant");
      userId = prof.id;
      toast.success(`Walk-in applicant created: ${prof.applicant_code}`);
    }

    const amount = Number(f.amount);
    const total = f.total_amount ? Number(f.total_amount) : amount;
    const balance = Math.max(0, total - amount);

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("payments").insert({
      user_id: userId, amount, total_amount: total, balance,
      currency: f.currency, method: f.method,
      payment_type: f.payment_type, service_description: f.service_description || null,
      reference: f.reference || null, notes: f.notes || null,
      status: "verified", created_by: user?.id ?? null,
      invoice_id: f.invoice_id || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Payment recorded & verified");
    setOpen(false); setErrors({});
    setF({ user_id: "", full_name: "", phone: "", district: "", nin: "", amount: "", total_amount: "", currency: "UGX", method: "Mobile Money", payment_type: "recruitment_processing", service_description: "", reference: "", notes: "", invoice_id: "" });
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="w-4 h-4 mr-1"/>Record payment</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Record verified payment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground bg-secondary/40 p-2 rounded">Use this when cash has been received. The payment will appear on the applicant's account as <b>Verified</b> immediately. To bill for money <i>owed</i>, create an Invoice instead.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode==="existing"?"default":"outline"} size="sm" onClick={()=>{setMode("existing"); setErrors({});}}><UserCheck className="w-4 h-4 mr-1"/>Existing applicant</Button>
            <Button type="button" variant={mode==="walkin"?"default":"outline"} size="sm" onClick={()=>{setMode("walkin"); setErrors({});}}><UserPlus className="w-4 h-4 mr-1"/>Walk-in applicant</Button>
          </div>

          {mode === "existing" ? (
            <div>
              <Label>Applicant <span className="text-destructive">*</span></Label>
              <select className={`h-10 px-3 rounded-md border bg-background w-full ${errors.user_id ? "border-destructive" : "border-input"}`} value={f.user_id} onChange={(e)=>setF({...f, user_id: e.target.value})}>
                <option value="">Select applicant…</option>
                {profiles.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.applicant_code ?? "APP-????"} — {p.full_name ?? p.email ?? "(no name)"}
                  </option>
                ))}
              </select>
              {errors.user_id && <p className="text-xs text-destructive mt-1">{errors.user_id}</p>}
              {openInvoices.length > 0 && (
                <div className="mt-2">
                  <Label>Apply to invoice (optional)</Label>
                  <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.invoice_id} onChange={(e)=>setF({...f, invoice_id: e.target.value})}>
                    <option value="">— Standalone payment —</option>
                    {openInvoices.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>{inv.invoice_number} · {inv.service} · balance UGX {Number(inv.balance).toLocaleString()}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">Applying to an invoice will automatically update its balance and status.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 border border-border rounded-md p-3 bg-secondary/30">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">New walk-in applicant</div>
              <div>
                <Label>Full name <span className="text-destructive">*</span></Label>
                <Input value={f.full_name} onChange={(e)=>setF({...f, full_name: e.target.value})} className={errors.full_name ? "border-destructive" : ""}/>
                {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone <span className="text-destructive">*</span></Label>
                  <Input value={f.phone} onChange={(e)=>setF({...f, phone: e.target.value})} className={errors.phone ? "border-destructive" : ""}/>
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
                <div><Label>District</Label><Input value={f.district} onChange={(e)=>setF({...f, district: e.target.value})}/></div>
              </div>
              <div><Label>NIN (optional)</Label><Input value={f.nin} onChange={(e)=>setF({...f, nin: e.target.value})}/></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount paid <span className="text-destructive">*</span></Label>
              <Input type="number" value={f.amount} onChange={(e)=>setF({...f, amount: e.target.value})} className={errors.amount ? "border-destructive" : ""}/>
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount}</p>}
            </div>
            <div><Label>Total fee (optional)</Label><Input type="number" placeholder="For balance tracking" value={f.total_amount} onChange={(e)=>setF({...f, total_amount: e.target.value})}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Currency</Label><Input value={f.currency} onChange={(e)=>setF({...f, currency: e.target.value})}/></div>
            <div>
              <Label>Method <span className="text-destructive">*</span></Label>
              <Input value={f.method} onChange={(e)=>setF({...f, method: e.target.value})} className={errors.method ? "border-destructive" : ""}/>
              {errors.method && <p className="text-xs text-destructive mt-1">{errors.method}</p>}
            </div>
          </div>
          <div>
            <Label>Service type <span className="text-destructive">*</span></Label>
            <select className={`h-10 px-3 rounded-md border bg-background w-full ${errors.payment_type ? "border-destructive" : "border-input"}`} value={f.payment_type} onChange={(e)=>setF({...f, payment_type: e.target.value as typeof f.payment_type})}>
              {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {errors.payment_type && <p className="text-xs text-destructive mt-1">{errors.payment_type}</p>}
          </div>
          <div><Label>Service description (printed on receipt)</Label><Input value={f.service_description} onChange={(e)=>setF({...f, service_description: e.target.value})} placeholder="e.g. UAE visa processing"/></div>
          <div><Label>Reference</Label><Input value={f.reference} onChange={(e)=>setF({...f, reference: e.target.value})}/></div>
          <div><Label>Notes</Label><Input value={f.notes} onChange={(e)=>setF({...f, notes: e.target.value})}/></div>
          <Button className="w-full bg-gradient-primary" onClick={create}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditPayment({ row, onSaved }: { row: any; onSaved: ()=>void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    amount: String(row.amount ?? ""),
    total_amount: String(row.total_amount ?? row.amount ?? ""),
    method: row.method ?? "",
    reference: row.reference ?? "",
    notes: row.notes ?? "",
    service_description: row.service_description ?? "",
    status: row.status ?? "pending",
  });
  const save = async () => {
    const amount = Number(f.amount);
    const total = Number(f.total_amount || amount);
    if (isNaN(amount) || amount <= 0) return toast.error("Amount must be > 0");
    const balance = Math.max(0, total - amount);
    const { error } = await supabase.from("payments").update({
      amount, total_amount: total, balance, method: f.method,
      reference: f.reference || null, notes: f.notes || null,
      service_description: f.service_description || null,
      status: f.status as any,
    }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Updated"); setOpen(false); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="w-4 h-4"/></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit payment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount paid</Label><Input type="number" value={f.amount} onChange={(e)=>setF({...f, amount: e.target.value})}/></div>
            <div><Label>Total fee</Label><Input type="number" value={f.total_amount} onChange={(e)=>setF({...f, total_amount: e.target.value})}/></div>
          </div>
          <div><Label>Method</Label><Input value={f.method} onChange={(e)=>setF({...f, method: e.target.value})}/></div>
          <div><Label>Reference</Label><Input value={f.reference} onChange={(e)=>setF({...f, reference: e.target.value})}/></div>
          <div><Label>Service description</Label><Input value={f.service_description} onChange={(e)=>setF({...f, service_description: e.target.value})}/></div>
          <div><Label>Notes</Label><Input value={f.notes} onChange={(e)=>setF({...f, notes: e.target.value})}/></div>
          <div>
            <Label>Status</Label>
            <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.status} onChange={(e)=>setF({...f, status: e.target.value})}>
              <option value="pending">pending</option>
              <option value="partial">partial</option>
              <option value="verified">verified</option>
              <option value="paid">paid</option>
              <option value="overdue">overdue</option>
            </select>
          </div>
          <Button className="w-full bg-gradient-primary" onClick={save}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
