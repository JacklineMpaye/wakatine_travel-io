import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/applications")({ component: AdminApplications });

const STATUSES = [
  "draft","registration_submitted","under_review","approved","documents_pending","documents_verified",
  "interview_scheduled","interview_passed","medical_check_pending","visa_processing","visa_approved",
  "flight_scheduled","deployed_abroad","rejected",
];

function AdminApplications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const { data: apps = [] } = useQuery({
    queryKey: ["admin-apps-page"],
    queryFn: async () => (await supabase.from("applications").select("*, jobs(title, country), profiles(full_name, email, phone)").order("created_at", { ascending: false })).data ?? [],
  });
  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("applications").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["admin-apps-page"] });
  };
  const saveNotes = async (id: string, notes: string) => {
    const { error } = await supabase.from("applications").update({ admin_notes: notes }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
    qc.invalidateQueries({ queryKey: ["admin-apps-page"] });
  };
  const filtered = filter === "all" ? apps : apps.filter((a: any) => a.status === filter);
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Applications</div>
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="text-muted-foreground">Review submissions, update status and add notes.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filter==="all"?"default":"outline"} onClick={()=>setFilter("all")}>All</Button>
        {STATUSES.map((s)=>(
          <Button key={s} size="sm" variant={filter===s?"default":"outline"} onClick={()=>setFilter(s)}>{s.replace(/_/g," ")}</Button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No applications.</Card> : filtered.map((a: any)=>(
          <ApplicationCard key={a.id} a={a} onStatus={updateStatus} onNotes={saveNotes}/>
        ))}
      </div>
    </div>
  );
}

function ApplicationCard({ a, onStatus, onNotes }: { a: any; onStatus: (id: string, s: string)=>void; onNotes: (id: string, n: string)=>void }) {
  const [notes, setNotes] = useState(a.admin_notes ?? "");
  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <div className="font-semibold">{a.profiles?.full_name ?? a.profiles?.email}</div>
          <div className="text-sm text-muted-foreground">{a.jobs?.title} · {a.jobs?.country} · {a.profiles?.phone}</div>
        </div>
        <Badge>{a.status}</Badge>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select className="h-9 px-3 rounded-md border border-input bg-background text-sm" defaultValue={a.status} onChange={(e)=>onStatus(a.id, e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Textarea rows={2} placeholder="Admin notes…" value={notes} onChange={(e)=>setNotes(e.target.value)}/>
        <Button size="sm" onClick={()=>onNotes(a.id, notes)}>Save notes</Button>
      </div>
    </Card>
  );
}
