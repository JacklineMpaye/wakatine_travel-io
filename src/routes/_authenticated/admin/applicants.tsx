import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Search, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/admin/applicants")({ component: Applicants });

function Applicants() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all"|"walkin"|"registered">("all");
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-applicants"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("applicant_code", { ascending: true })).data ?? [],
  });
  const filtered = rows.filter((r: any) => {
    if (filter === "walkin" && !r.is_walk_in) return false;
    if (filter === "registered" && r.is_walk_in) return false;
    return !q || [r.applicant_code, r.full_name, r.email, r.phone, r.district].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase());
  });
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Applicants</div>
        <h1 className="text-3xl font-bold">Applicants</h1>
        <p className="text-muted-foreground">View, search, filter and edit applicant information.</p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative max-w-md flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground"/>
          <Input className="pl-9" placeholder="Search by code, name, email, phone…" value={q} onChange={(e)=>setQ(e.target.value)} />
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={filter==="all"?"default":"outline"} onClick={()=>setFilter("all")}>All</Button>
          <Button size="sm" variant={filter==="registered"?"default":"outline"} onClick={()=>setFilter("registered")}>Registered</Button>
          <Button size="sm" variant={filter==="walkin"?"default":"outline"} onClick={()=>setFilter("walkin")}>Walk-in</Button>
        </div>
      </div>
      <div className="grid gap-3">
        {filtered.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No applicants found.</Card> : filtered.map((r: any) => (
          <Card key={r.id} className="p-4 flex justify-between flex-wrap gap-3 items-center">
            <div>
              <div className="font-semibold flex items-center gap-2">
                <span className="text-primary text-xs font-mono bg-primary/10 px-2 py-0.5 rounded">{r.applicant_code ?? "—"}</span>
                {r.full_name ?? "(no name)"}
                {r.is_walk_in && <span className="text-[10px] uppercase bg-gold/20 text-gold px-2 py-0.5 rounded">walk-in</span>}
              </div>
              <div className="text-sm text-muted-foreground">{r.email ?? "—"} · {r.phone ?? "—"} · {r.district ?? r.address ?? "—"}</div>
              {r.profession && <div className="text-xs text-muted-foreground mt-1">{r.profession}</div>}
            </div>
            <div className="flex gap-2">
              <ViewApplicant row={r}/>
              <EditApplicant row={r} onSaved={()=>qc.invalidateQueries({ queryKey: ["admin-applicants"] })}/>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EditApplicant({ row, onSaved }: { row: any; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ full_name: row.full_name ?? "", phone: row.phone ?? "", district: row.district ?? "", address: row.address ?? "", profession: row.profession ?? "" });
  const save = async () => {
    const { error } = await supabase.from("profiles").update(f).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Pencil className="w-4 h-4 mr-1"/>Edit</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit applicant</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Full name</Label><Input value={f.full_name} onChange={(e)=>setF({...f, full_name: e.target.value})}/></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={(e)=>setF({...f, phone: e.target.value})}/></div>
          <div><Label>District</Label><Input value={f.district} onChange={(e)=>setF({...f, district: e.target.value})}/></div>
          <div><Label>Address</Label><Input value={f.address} onChange={(e)=>setF({...f, address: e.target.value})}/></div>
          <div><Label>Profession</Label><Input value={f.profession} onChange={(e)=>setF({...f, profession: e.target.value})}/></div>
          <Button onClick={save} className="bg-gradient-primary w-full">Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ViewApplicant({ row }: { row: any }) {
  const [open, setOpen] = useState(false);
  const { data: details } = useQuery({
    queryKey: ["applicant-details", row.id],
    queryFn: async () => {
      const [appDetails, docs, apps, pays] = await Promise.all([
        supabase.from("application_details").select("*").eq("user_id", row.id).maybeSingle(),
        supabase.from("documents").select("*").eq("user_id", row.id),
        supabase.from("applications").select("*, jobs(title, country)").eq("applicant_id", row.id),
        supabase.from("payments").select("amount, currency, status, payment_type, created_at").eq("user_id", row.id),
      ]);
      return { details: appDetails.data, docs: docs.data ?? [], apps: apps.data ?? [], pays: pays.data ?? [] };
    },
    enabled: open,
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Eye className="w-4 h-4 mr-1"/>View</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{row.applicant_code} · {row.full_name ?? "(no name)"}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Email:</span> {row.email ?? "—"}</div>
            <div><span className="text-muted-foreground">Phone:</span> {row.phone ?? "—"}</div>
            <div><span className="text-muted-foreground">District:</span> {row.district ?? "—"}</div>
            <div><span className="text-muted-foreground">Profession:</span> {row.profession ?? "—"}</div>
            <div><span className="text-muted-foreground">Gender:</span> {row.gender ?? "—"}</div>
            <div><span className="text-muted-foreground">DOB:</span> {row.date_of_birth ?? "—"}</div>
          </div>
          {details?.details && (
            <div>
              <div className="font-semibold mb-1">Registration details</div>
              <div className="text-xs text-muted-foreground">NIN: {details.details.nin ?? "—"} · Passport: {details.details.passport_number ?? "—"} · Next of kin: {details.details.next_of_kin_name ?? "—"} ({details.details.next_of_kin_phone ?? "—"})</div>
              <div className="text-xs text-muted-foreground">Desired job: {details.details.desired_job ?? "—"} · Expected salary: {details.details.salary_expectation_ugx ? `UGX ${Number(details.details.salary_expectation_ugx).toLocaleString()}` : "—"}</div>
            </div>
          )}
          <div>
            <div className="font-semibold mb-1">Documents ({details?.docs.length ?? 0})</div>
            {details?.docs.length ? (
              <ul className="text-xs space-y-1">{details.docs.map((d: any) => (
                <li key={d.id} className="flex justify-between border-b border-border py-1">
                  <span>{d.type} · {d.file_name ?? d.file_path}</span>
                  <span className="text-muted-foreground">{d.status}</span>
                </li>
              ))}</ul>
            ) : <div className="text-xs text-muted-foreground">No documents uploaded.</div>}
          </div>
          <div>
            <div className="font-semibold mb-1">Applications ({details?.apps.length ?? 0})</div>
            {details?.apps.length ? details.apps.map((a: any) => (
              <div key={a.id} className="text-xs border-b border-border py-1">{a.jobs?.title ?? "—"} · {a.jobs?.country ?? "—"} · {a.status}</div>
            )) : <div className="text-xs text-muted-foreground">No applications.</div>}
          </div>
          <div>
            <div className="font-semibold mb-1">Payments ({details?.pays.length ?? 0})</div>
            {details?.pays.length ? details.pays.map((p: any, i: number) => (
              <div key={i} className="text-xs border-b border-border py-1">{p.currency} {Number(p.amount).toLocaleString()} · {p.payment_type} · {p.status}</div>
            )) : <div className="text-xs text-muted-foreground">No payments.</div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}