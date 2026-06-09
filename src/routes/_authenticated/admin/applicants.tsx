import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Search, Pencil, FileSearch, UserPlus } from "lucide-react";
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
      <div className="flex justify-between flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Applicants</div>
          <h1 className="text-3xl font-bold">Applicants</h1>
          <p className="text-muted-foreground">View, search, filter and edit applicant information.</p>
        </div>
        <NewApplicant onCreated={()=>qc.invalidateQueries({ queryKey: ["admin-applicants"] })}/>
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

const PREFERRED_JOBS = ["Driver","Cleaner","House Maid","Security Guard","Hotel Attendant","Caregiver","Construction","Farm Worker","Cook","Waiter"];

function NewApplicant({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    full_name: "", phone: "", email: "", date_of_birth: "", gender: "", nationality: "Ugandan",
    district: "", village: "", nin: "", has_passport: "" as ""|"yes"|"no", passport_number: "",
    preferred_job: "", salary_expectation_ugx: "",
    next_of_kin_name: "", next_of_kin_phone: "", next_of_kin_relationship: "",
    father_status: "", mother_status: "",
    is_walk_in: true,
  });
  const save = async () => {
    if (!f.full_name.trim() || !f.phone.trim()) return toast.error("Full name and phone are required");
    setSaving(true);
    const id = crypto.randomUUID();
    const { data: prof, error: pErr } = await supabase.from("profiles").insert({
      id, full_name: f.full_name.trim(), phone: f.phone.trim(), email: f.email.trim() || null,
      date_of_birth: f.date_of_birth || null, gender: f.gender || null, nationality: f.nationality || "Ugandan",
      district: f.district || null, is_walk_in: f.is_walk_in,
    }).select("id, applicant_code").single();
    if (pErr || !prof) { setSaving(false); return toast.error(pErr?.message ?? "Could not create applicant"); }
    await supabase.from("application_details").insert({
      user_id: prof.id, full_name: f.full_name, phone: f.phone, email: f.email || null,
      date_of_birth: f.date_of_birth || null, gender: f.gender || null, nationality: f.nationality,
      district: f.district || null, village: f.village || null, nin: f.nin || null,
      has_passport: f.has_passport === "" ? null : f.has_passport === "yes",
      passport_number: f.has_passport === "yes" ? f.passport_number || null : null,
      desired_job: f.preferred_job || null,
      preferred_jobs: f.preferred_job ? [f.preferred_job] : [],
      salary_expectation_ugx: f.salary_expectation_ugx ? Number(f.salary_expectation_ugx) : null,
      next_of_kin_name: f.next_of_kin_name || null, next_of_kin_phone: f.next_of_kin_phone || null,
      next_of_kin_relationship: f.next_of_kin_relationship || null,
      father_status: f.father_status || null, mother_status: f.mother_status || null,
      submitted: true,
    } as any);
    await supabase.from("applications").insert({ applicant_id: prof.id, status: "registration_submitted" as any } as any);
    setSaving(false); setOpen(false);
    toast.success(`Applicant created: ${prof.applicant_code}`);
    onCreated();
    setF({ ...f, full_name: "", phone: "", email: "", date_of_birth: "", gender: "", district: "", village: "", nin: "", passport_number: "", preferred_job: "", salary_expectation_ugx: "", next_of_kin_name: "", next_of_kin_phone: "", next_of_kin_relationship: "", father_status: "", mother_status: "" });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-gradient-primary"><UserPlus className="w-4 h-4 mr-1"/>New applicant</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Register a new applicant</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2 text-sm">
            <Button type="button" size="sm" variant={f.is_walk_in?"default":"outline"} onClick={()=>setF({...f, is_walk_in: true})}>Walk-in</Button>
            <Button type="button" size="sm" variant={!f.is_walk_in?"default":"outline"} onClick={()=>setF({...f, is_walk_in: false})}>Registered</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Full name *</Label><Input value={f.full_name} onChange={(e)=>setF({...f, full_name: e.target.value})}/></div>
            <div><Label>Phone *</Label><Input value={f.phone} onChange={(e)=>setF({...f, phone: e.target.value})}/></div>
            <div><Label>Email</Label><Input value={f.email} onChange={(e)=>setF({...f, email: e.target.value})}/></div>
            <div><Label>Date of birth</Label><Input type="date" value={f.date_of_birth} onChange={(e)=>setF({...f, date_of_birth: e.target.value})}/></div>
            <div><Label>Gender</Label>
              <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.gender} onChange={(e)=>setF({...f, gender: e.target.value})}>
                <option value="">—</option><option value="male">Male</option><option value="female">Female</option>
              </select>
            </div>
            <div><Label>Nationality</Label><Input value={f.nationality} onChange={(e)=>setF({...f, nationality: e.target.value})}/></div>
            <div><Label>District</Label><Input value={f.district} onChange={(e)=>setF({...f, district: e.target.value})}/></div>
            <div><Label>Village</Label><Input value={f.village} onChange={(e)=>setF({...f, village: e.target.value})}/></div>
            <div className="sm:col-span-2"><Label>NIN</Label><Input value={f.nin} onChange={(e)=>setF({...f, nin: e.target.value.toUpperCase()})}/></div>
            <div><Label>Has passport?</Label>
              <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.has_passport} onChange={(e)=>setF({...f, has_passport: e.target.value as any})}>
                <option value="">—</option><option value="yes">Yes</option><option value="no">No</option>
              </select>
            </div>
            {f.has_passport === "yes" && <div><Label>Passport number</Label><Input value={f.passport_number} onChange={(e)=>setF({...f, passport_number: e.target.value})}/></div>}
            <div><Label>Preferred job</Label>
              <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.preferred_job} onChange={(e)=>setF({...f, preferred_job: e.target.value})}>
                <option value="">—</option>{PREFERRED_JOBS.map((p)=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><Label>Salary expectation (UGX)</Label><Input type="number" value={f.salary_expectation_ugx} onChange={(e)=>setF({...f, salary_expectation_ugx: e.target.value})}/></div>
            <div><Label>Father status</Label>
              <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.father_status} onChange={(e)=>setF({...f, father_status: e.target.value})}>
                <option value="">—</option><option value="alive">Alive</option><option value="deceased">Deceased</option>
              </select>
            </div>
            <div><Label>Mother status</Label>
              <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.mother_status} onChange={(e)=>setF({...f, mother_status: e.target.value})}>
                <option value="">—</option><option value="alive">Alive</option><option value="deceased">Deceased</option>
              </select>
            </div>
            <div><Label>Next of kin name</Label><Input value={f.next_of_kin_name} onChange={(e)=>setF({...f, next_of_kin_name: e.target.value})}/></div>
            <div><Label>Next of kin phone</Label><Input value={f.next_of_kin_phone} onChange={(e)=>setF({...f, next_of_kin_phone: e.target.value})}/></div>
            <div className="sm:col-span-2"><Label>Next of kin relationship</Label><Input value={f.next_of_kin_relationship} onChange={(e)=>setF({...f, next_of_kin_relationship: e.target.value})}/></div>
          </div>
          <Button onClick={save} disabled={saving} className="bg-gradient-primary w-full">{saving ? "Saving…" : "Create applicant"}</Button>
        </div>
      </DialogContent>
    </Dialog>
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