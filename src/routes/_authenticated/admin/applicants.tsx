import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Search, Pencil, FileSearch } from "lucide-react";
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
              <Link to="/admin/applicants/$id" params={{ id: r.id }}>
                <Button size="sm" variant="outline"><FileSearch className="w-4 h-4 mr-1"/>Open profile</Button>
              </Link>
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