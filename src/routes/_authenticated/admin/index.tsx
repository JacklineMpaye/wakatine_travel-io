import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Briefcase, FileText, CreditCard, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminHome });

const STATUSES = [
  "registration_submitted","documents_pending","documents_verified","interview_scheduled",
  "interview_passed","medical_check_pending","visa_processing","visa_approved","flight_scheduled","deployed_abroad","rejected",
];

function AdminHome() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [u, j, a, p, d] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "verified"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "deployed_abroad"),
      ]);
      const total = (p.data ?? []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
      return { users: u.count ?? 0, jobs: j.count ?? 0, apps: a.count ?? 0, paid: total, deployed: d.count ?? 0 };
    },
  });

  const { data: apps = [] } = useQuery({
    queryKey: ["admin-apps"],
    queryFn: async () => (await supabase.from("applications").select("*, jobs(title, country), profiles(full_name, email, phone)").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => (await supabase.from("jobs").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const { error } = await supabase.from("applications").update({ status: status as any, admin_notes: notes ?? null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-apps"] });
  };

  const [job, setJob] = useState({ title: "", country: "United Arab Emirates", city: "", employer: "", description: "", requirements: "", salary_min: "", salary_max: "", currency: "USD", deadline: "", slots: "1" });
  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("jobs").insert({
      title: job.title, country: job.country, city: job.city || null, employer: job.employer || null,
      description: job.description, requirements: job.requirements || null,
      salary_min: job.salary_min ? Number(job.salary_min) : null, salary_max: job.salary_max ? Number(job.salary_max) : null,
      currency: job.currency, deadline: job.deadline || null, slots: Number(job.slots) || 1, created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Job created");
    setJob({ ...job, title: "", city: "", employer: "", description: "", requirements: "", salary_min: "", salary_max: "", deadline: "" });
    qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
  };

  const toggleJob = async (id: string, active: boolean) => {
    await supabase.from("jobs").update({ is_active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    qc.invalidateQueries({ queryKey: ["jobs"] });
  };
  const deleteJob = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-jobs"] });
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Admin Dashboard</h1><p className="text-muted-foreground">Manage applicants, applications, jobs and payments.</p></div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { i: Users, l: "Total applicants", v: stats?.users ?? 0 },
          { i: Briefcase, l: "Active jobs", v: stats?.jobs ?? 0 },
          { i: FileText, l: "Applications", v: stats?.apps ?? 0 },
          { i: CreditCard, l: "Total paid (UGX)", v: (stats?.paid ?? 0).toLocaleString() },
          { i: Users, l: "Deployed", v: stats?.deployed ?? 0 },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <s.i className="w-6 h-6 text-primary mb-2"/>
            <div className="text-2xl font-bold">{s.v}</div>
            <div className="text-sm text-muted-foreground">{s.l}</div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="apps">
        <TabsList><TabsTrigger value="apps">Applications</TabsTrigger><TabsTrigger value="jobs">Jobs</TabsTrigger><TabsTrigger value="new-job">+ New Job</TabsTrigger></TabsList>

        <TabsContent value="apps" className="space-y-3 mt-4">
          {apps.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No applications yet.</Card> : apps.map((a: any) => (
            <Card key={a.id} className="p-4">
              <div className="flex justify-between flex-wrap gap-3 mb-3">
                <div>
                  <div className="font-semibold">{a.profiles?.full_name ?? a.profiles?.email}</div>
                  <div className="text-sm text-muted-foreground">{a.jobs?.title} · {a.jobs?.country} · {a.profiles?.phone}</div>
                </div>
                <Badge>{a.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <select className="h-9 px-3 rounded-md border border-input bg-background text-sm" defaultValue={a.status} onChange={(e)=>updateStatus(a.id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                </select>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-3 mt-4">
          {jobs.map((j: any) => (
            <Card key={j.id} className="p-4 flex justify-between flex-wrap gap-3">
              <div><div className="font-semibold">{j.title}</div><div className="text-sm text-muted-foreground">{j.country} · {j.employer}</div></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={()=>toggleJob(j.id, j.is_active)}>{j.is_active?"Deactivate":"Activate"}</Button>
                <Button size="sm" variant="destructive" onClick={()=>deleteJob(j.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="new-job" className="mt-4">
          <Card className="p-6">
            <form onSubmit={createJob} className="grid sm:grid-cols-2 gap-4">
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
              <div className="sm:col-span-2"><Button type="submit" className="bg-gradient-primary"><Plus className="w-4 h-4 mr-2"/>Create Job</Button></div>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
