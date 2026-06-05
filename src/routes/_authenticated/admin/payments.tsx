import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/payments")({ component: AdminPayments });

function AdminPayments() {
  const qc = useQueryClient();
  const { data: pays = [] } = useQuery({
    queryKey: ["admin-pays"],
    queryFn: async () => (await supabase.from("payments").select("*, profiles(full_name, email)").order("created_at", { ascending: false })).data ?? [],
  });
  const verify = async (id: string) => {
    const { error } = await supabase.from("payments").update({ status: "verified" as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Verified");
    qc.invalidateQueries({ queryKey: ["admin-pays"] });
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Payments</div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Create records, verify and update balances.</p>
        </div>
        <NewPayment onCreated={()=>qc.invalidateQueries({ queryKey: ["admin-pays"] })}/>
      </div>
      <div className="grid gap-3">
        {pays.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No payments yet.</Card> : pays.map((p: any) => (
          <Card key={p.id} className="p-4 flex justify-between flex-wrap gap-3 items-center">
            <div>
              <div className="font-semibold">{p.profiles?.full_name ?? p.profiles?.email}</div>
              <div className="text-sm text-muted-foreground">{p.currency} {Number(p.amount).toLocaleString()} · {p.payment_type ?? "—"} · {p.method ?? "—"}</div>
              {p.notes && <div className="text-xs text-muted-foreground mt-1">{p.notes}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.status==="verified"||p.status==="paid"?"default":"secondary"}>{p.status}</Badge>
              {p.status !== "verified" && <Button size="sm" onClick={()=>verify(p.id)}><CheckCircle2 className="w-4 h-4 mr-1"/>Verify</Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NewPayment({ onCreated }: { onCreated: ()=>void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<{ user_id: string; amount: string; currency: string; method: string; payment_type: "recruitment_processing" | "passport_processing" | "nin_assistance" | "other"; reference: string; notes: string }>({ user_id: "", amount: "", currency: "UGX", method: "Mobile Money", payment_type: "recruitment_processing", reference: "", notes: "" });
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles-min"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email").order("full_name")).data ?? [],
  });
  const create = async () => {
    if (!f.user_id || !f.amount) return toast.error("Applicant and amount required");
    const { error } = await supabase.from("payments").insert({
      user_id: f.user_id, amount: Number(f.amount), currency: f.currency,
      method: f.method, payment_type: f.payment_type, reference: f.reference || null, notes: f.notes || null, status: "pending",
    });
    if (error) return toast.error(error.message);
    toast.success("Payment created"); setOpen(false); onCreated();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="w-4 h-4 mr-1"/>New payment</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create payment record</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Applicant</Label>
            <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.user_id} onChange={(e)=>setF({...f, user_id: e.target.value})}>
              <option value="">Select applicant…</option>
              {profiles.map((p: any) => <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount</Label><Input type="number" value={f.amount} onChange={(e)=>setF({...f, amount: e.target.value})}/></div>
            <div><Label>Currency</Label><Input value={f.currency} onChange={(e)=>setF({...f, currency: e.target.value})}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label><Input value={f.payment_type} onChange={(e)=>setF({...f, payment_type: e.target.value})}/></div>
            <div><Label>Method</Label><Input value={f.method} onChange={(e)=>setF({...f, method: e.target.value})}/></div>
          </div>
          <div><Label>Reference</Label><Input value={f.reference} onChange={(e)=>setF({...f, reference: e.target.value})}/></div>
          <div><Label>Notes</Label><Input value={f.notes} onChange={(e)=>setF({...f, notes: e.target.value})}/></div>
          <Button className="w-full bg-gradient-primary" onClick={create}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
