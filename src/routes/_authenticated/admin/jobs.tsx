import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/jobs")({ component: AdminJobs });

function AdminJobs() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: jobs = [] } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => (await supabase.from("jobs").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("jobs").update({ is_active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
  };
  const archive = async (id: string) => {
    if (!confirm("Archive this job?")) return;
    await supabase.from("jobs").update({ is_active: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-jobs"] });
  };
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const blank = { title: "", country: "United Arab Emirates", city: "", employer: "", description: "", requirements: "", salary_min: "", salary_max: "", currency: "USD", deadline: "", slots: "1" };
  const [job, setJob] = useState<any>(blank);
  const openNew = () => { setEditing(null); setJob(blank); setOpen(true); };
  const openEdit = (j: any) => {
    setEditing(j);
    setJob({ title: j.title, country: j.country, city: j.city ?? "", employer: j.employer ?? "", description: j.description ?? "", requirements: j.requirements ?? "", salary_min: j.salary_min ?? "", salary_max: j.salary_max ?? "", currency: j.currency, deadline: j.deadline ?? "", slots: String(j.slots ?? 1) });
    setOpen(true);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      title: job.title, country: job.country, city: job.city || null, employer: job.employer || null,
      description: job.description, requirements: job.requirements || null,
      salary_min: job.salary_min ? Number(job.salary_min) : null, salary_max: job.salary_max ? Number(job.salary_max) : null,
      currency: job.currency, deadline: job.deadline || null, slots: Number(job.slots) || 1,
    };
    let error;
    if (editing) ({ error } = await supabase.from("jobs").update(payload).eq("id", editing.id));
    else ({ error } = await supabase.from("jobs").insert({ ...payload, created_by: user!.id }));
    if (error) return toast.error(error.message);
    toast.success(editing ? "Job updated" : "Job created");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Jobs</div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Create, edit and archive UAE job listings.</p>
        </div>
        <Button className="bg-gradient-primary" onClick={openNew}><Plus className="w-4 h-4 mr-1"/>New job</Button>
      </div>
      <div className="grid gap-3">
        {jobs.map((j: any) => (
          <Card key={j.id} className="p-4 flex justify-between flex-wrap gap-3 items-center">
            <div>
              <div className="font-semibold flex items-center gap-2">{j.title} {!j.is_active && <Badge variant="secondary">Archived</Badge>}</div>
              <div className="text-sm text-muted-foreground">{j.country} · {j.employer ?? "—"} · {j.currency} {j.salary_min ?? "?"}–{j.salary_max ?? "?"}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={()=>openEdit(j)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={()=>toggle(j.id, j.is_active)}>{j.is_active?"Deactivate":"Activate"}</Button>
              <Button size="sm" variant="destructive" onClick={()=>archive(j.id)}>Archive</Button>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit job" : "New job"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
            <div><Label>Title</Label><Input required value={job.title} onChange={(e)=>setJob({...job,title:e.target.value})}/></div>
            <div><Label>Country</Label><Input required value={job.country} onChange={(e)=>setJob({...job,country:e.target.value})}/></div>
            <div><Label>City</Label><Input value={job.city} onChange={(e)=>setJob({...job,city:e.target.value})}/></div>
            <div><Label>Employer</Label><Input value={job.employer} onChange={(e)=>setJob({...job,employer:e.target.value})}/></div>
            <div><Label>Salary min</Label><Input type="number" value={job.salary_min} onChange={(e)=>setJob({...job,salary_min:e.target.value})}/></div>
            <div><Label>Salary max</Label><Input type="number" value={job.salary_max} onChange={(e)=>setJob({...job,salary_max:e.target.value})}/></div>
            <div><Label>Currency</Label><Input value={job.currency} onChange={(e)=>setJob({...job,currency:e.target.value})}/></div>
            <div><Label>Deadline</Label><Input type="date" value={job.deadline} onChange={(e)=>setJob({...job,deadline:e.target.value})}/></div>
            <div><Label>Slots</Label><Input type="number" value={job.slots} onChange={(e)=>setJob({...job,slots:e.target.value})}/></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={4} required value={job.description} onChange={(e)=>setJob({...job,description:e.target.value})}/></div>
            <div className="sm:col-span-2"><Label>Requirements</Label><Textarea rows={3} value={job.requirements} onChange={(e)=>setJob({...job,requirements:e.target.value})}/></div>
            <div className="sm:col-span-2"><Button type="submit" className="bg-gradient-primary w-full">{editing ? "Save changes" : "Create job"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
