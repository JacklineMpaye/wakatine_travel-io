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

// Primary workflow first, then legacy/extended statuses
const STATUSES = [
  "registration_submitted","under_review","medical_check_pending","documents_verified","approved","job_assigned",
  "draft","documents_pending","interview_scheduled","interview_passed",
  "visa_processing","visa_approved","flight_scheduled","deployed_abroad","rejected",
];

const STATUS_LABEL: Record<string, string> = {
  registration_submitted: "Submitted",
  under_review:           "Under Review",
  medical_check_pending:  "Medical Check Pending",
  documents_verified:     "Documents Verified",
  approved:               "Approved",
  job_assigned:           "Job Assigned",
  draft:                  "Draft",
  documents_pending:      "Documents Pending",
  interview_scheduled:    "Interview Scheduled",
  interview_passed:       "Interview Passed",
  visa_processing:        "Visa Processing",
  visa_approved:          "Visa Approved",
  flight_scheduled:       "Flight Scheduled",
  deployed_abroad:        "Deployed Abroad",
  rejected:               "Rejected",
};

function AdminApplications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const { data: apps = [] } = useQuery({
    queryKey: ["admin-apps-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(title, country)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const apps = data ?? [];
      const ids = apps.map((a: any) => a.applicant_id).filter(Boolean);
      if (ids.length) {
        const [{ data: profiles }, { data: details }] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, phone, applicant_code").in("id", ids),
          supabase.from("application_details").select("user_id, preferred_jobs, salary_expectation_ugx, desired_job").in("user_id", ids),
        ]);
        const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
        const detailMap  = new Map((details  ?? []).map((d: any) => [d.user_id, d]));
        apps.forEach((a: any) => {
          a.profiles = profileMap.get(a.applicant_id);
          a.details  = detailMap.get(a.applicant_id);
        });
      }
      return apps;
    },
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
          <Button key={s} size="sm" variant={filter===s?"default":"outline"} onClick={()=>setFilter(s)}>{STATUS_LABEL[s] ?? s.replace(/_/g," ")}</Button>
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
          <div className="font-semibold flex items-center gap-2">
            {a.profiles?.applicant_code && <span className="text-primary text-xs font-mono bg-primary/10 px-2 py-0.5 rounded">{a.profiles.applicant_code}</span>}
            {a.profiles?.full_name ?? a.profiles?.email ?? "(no name)"}
          </div>
          <div className="text-sm text-muted-foreground">{a.profiles?.phone ?? "—"} · Submitted {new Date(a.created_at).toLocaleDateString()}</div>
          {a.details?.preferred_jobs?.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">Preferred: {a.details.preferred_jobs.join(", ")}{a.details.salary_expectation_ugx ? ` · Expect UGX ${Number(a.details.salary_expectation_ugx).toLocaleString()}` : ""}</div>
          )}
          {a.assigned_job_title && (
            <div className="text-xs text-primary mt-1">Assigned: {a.assigned_job_title}{a.assigned_job_country ? ` · ${a.assigned_job_country}` : ""}{a.assigned_job_employer ? ` · ${a.assigned_job_employer}` : ""}</div>
          )}
          {a.jobs?.title && !a.assigned_job_title && (
            <div className="text-xs text-primary mt-1">Job: {a.jobs.title} · {a.jobs.country}</div>
          )}
        </div>
        <Badge>{a.status}</Badge>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select className="h-9 px-3 rounded-md border border-input bg-background text-sm" defaultValue={a.status} onChange={(e)=>onStatus(a.id, e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s.replace(/_/g," ")}</option>)}
        </select>
        <a href={`/admin/applicants/${a.applicant_id}`} className="text-xs text-primary underline">Open case file →</a>
      </div>
      <div className="space-y-2">
        <Textarea rows={2} placeholder="Admin notes…" value={notes} onChange={(e)=>setNotes(e.target.value)}/>
        <Button size="sm" onClick={()=>onNotes(a.id, notes)}>Save notes</Button>
      </div>
    </Card>
  );
}
