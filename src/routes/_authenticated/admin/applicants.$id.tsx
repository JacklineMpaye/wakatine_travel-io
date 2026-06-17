import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, FileDown, Save, FileText, Printer, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/applicants/$id")({ component: ApplicantProfile });

// ─── Status definitions ───────────────────────────────────────────────────
// Primary workflow first (matches the required order), then legacy statuses
const ALL_STATUSES = [
  { key: "registration_submitted", label: "Submitted" },
  { key: "under_review",           label: "Under Review" },
  { key: "medical_check_pending",  label: "Medical Check Pending" },
  { key: "documents_verified",     label: "Documents Verified" },
  { key: "approved",               label: "Approved" },
  { key: "job_assigned",           label: "Job Assigned" },
  { key: "draft",                  label: "Draft" },
  { key: "documents_pending",      label: "Documents Pending" },
  { key: "interview_scheduled",    label: "Interview Scheduled" },
  { key: "interview_passed",       label: "Interview Passed" },
  { key: "visa_processing",        label: "Visa Processing" },
  { key: "visa_approved",          label: "Visa Approved" },
  { key: "flight_scheduled",       label: "Flight Scheduled" },
  { key: "deployed_abroad",        label: "Deployed Abroad" },
  { key: "rejected",               label: "Rejected" },
];
const STATUS_LABEL: Record<string, string> = Object.fromEntries(ALL_STATUSES.map((s) => [s.key, s.label]));

// ─── Page ─────────────────────────────────────────────────────────────────
function ApplicantProfile() {
  const { id } = useParams({ from: "/_authenticated/admin/applicants/$id" });
  const qc = useQueryClient();
  const refetch = () => qc.invalidateQueries({ queryKey: ["admin-applicant-full", id] });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-applicant-full", id],
    queryFn: async () => {
      const [profile, details, docs, apps, pays, invs, jobs] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("application_details").select("*").eq("user_id", id).maybeSingle(),
        supabase.from("documents").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("applications").select("*, jobs(title, country, employer)").eq("applicant_id", id).order("created_at", { ascending: false }),
        supabase.from("payments").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("jobs").select("id, title, country, employer").eq("is_active", true).order("title"),
      ]);
      return {
        profile: profile.data, details: details.data, docs: docs.data ?? [],
        apps: apps.data ?? [], pays: pays.data ?? [], invs: invs.data ?? [], jobs: jobs.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!data.profile) return <div className="p-10 text-center text-muted-foreground">Applicant not found.</div>;

  const p = data.profile as any;
  const d = (data.details ?? {}) as any;
  const app = data.apps[0];
  const totalPaid = data.pays.filter((x: any) => x.status === "verified" || x.status === "paid").reduce((s: number, x: any) => s + Number(x.amount), 0);
  const totalOwed = data.invs.reduce((s: number, x: any) => s + Number(x.balance), 0);
  const verifiedPays = data.pays.filter((x: any) => x.status === "verified" || x.status === "paid");

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between flex-wrap gap-3 items-start">
        <div>
          <Link to="/admin/applicants" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3"/>Back to applicants
          </Link>
          <h1 className="text-3xl font-bold mt-1 flex items-center gap-3">
            <span className="text-primary text-sm font-mono bg-primary/10 px-2 py-1 rounded">{p.applicant_code ?? "—"}</span>
            {p.full_name ?? "(no name)"}
            {p.is_walk_in && <span className="text-[10px] uppercase bg-gold/20 text-gold px-2 py-0.5 rounded">walk-in</span>}
          </h1>
          <p className="text-muted-foreground">{p.email ?? "—"} · {p.phone ?? "—"}</p>
        </div>
        <ExportReportButton data={data}/>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Total paid</div><div className="text-xl font-bold">UGX {totalPaid.toLocaleString()}</div></Card>
        <Card className={`p-4 ${totalOwed > 0 ? "border-destructive/40" : ""}`}><div className="text-xs uppercase tracking-widest text-muted-foreground">Outstanding</div><div className={`text-xl font-bold ${totalOwed > 0 ? "text-destructive" : ""}`}>UGX {totalOwed.toLocaleString()}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Application status</div><div className="text-xl font-bold">{app ? (STATUS_LABEL[app.status] ?? app.status) : "—"}</div></Card>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="documents">Documents ({data.docs.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({data.pays.length})</TabsTrigger>
          <TabsTrigger value="receipts">Receipts ({verifiedPays.length})</TabsTrigger>
          <TabsTrigger value="job">Assigned Job</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile" className="mt-4">
          <Section title="Biodata">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Field label="Full name"        value={p.full_name}/>
              <Field label="Date of birth"    value={p.date_of_birth}/>
              <Field label="Gender"           value={p.gender}/>
              <Field label="Nationality"      value={p.nationality}/>
              <Field label="District"         value={p.district}/>
              <Field label="Address"          value={p.address}/>
              <Field label="Profession"       value={p.profession}/>
              <Field label="Years experience" value={p.years_experience}/>
              <Field label="Education"        value={p.education_level}/>
              <Field label="Phone"            value={p.phone}/>
              <Field label="Email"            value={p.email}/>
            </div>
          </Section>
        </TabsContent>

        {/* Application tab */}
        <TabsContent value="application" className="mt-4 space-y-4">
          <Section title="Registration form">
            {data.details ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Personal &amp; Residence</div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <Field label="NIN"              value={d.nin}/>
                    <Field label="Village"           value={d.village}/>
                    <Field label="District (form)"   value={d.district}/>
                    <Field label="Has passport"      value={d.has_passport === null ? "—" : d.has_passport ? "Yes" : "No"}/>
                    <Field label="Passport #"        value={d.passport_number}/>
                    <Field label="Expected salary"   value={d.salary_expectation_ugx ? `UGX ${Number(d.salary_expectation_ugx).toLocaleString()}` : null}/>
                    <Field label="Submitted"         value={d.submitted ? "Yes" : "No"}/>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Father</div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <Field label="Father's name"      value={d.father_name}/>
                    <Field label="Father's telephone" value={d.father_phone}/>
                    <Field label="Father's status"    value={d.father_status}/>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Mother</div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <Field label="Mother's name"      value={d.mother_name}/>
                    <Field label="Mother's telephone" value={d.mother_phone}/>
                    <Field label="Mother's status"    value={d.mother_status}/>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Next of Kin</div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <Field label="Next of kin"       value={d.next_of_kin_name}/>
                    <Field label="Next of kin phone" value={d.next_of_kin_phone}/>
                    <Field label="Relationship"      value={d.next_of_kin_relationship}/>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Preferred Jobs</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Field label="Primary desired job" value={d.desired_job}/>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(d.preferred_jobs ?? []).length === 0
                      ? <span className="text-sm text-muted-foreground">—</span>
                      : (d.preferred_jobs ?? []).map((j: string) => <Badge key={j} variant="secondary">{j}</Badge>)}
                  </div>
                </div>

                {d.reason_for_abroad && (
                  <div className="pt-3 border-t">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Why work abroad</div>
                    <div className="text-sm whitespace-pre-wrap mt-1">{d.reason_for_abroad}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No registration form submitted yet.</div>
            )}
          </Section>

          {app && (
            <Section title="Application status">
              <StatusControls app={app} onChange={refetch}/>
            </Section>
          )}
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="mt-4">
          <Section title={`Documents (${data.docs.length})`}>
            {data.docs.length === 0
              ? <div className="text-sm text-muted-foreground">No documents uploaded.</div>
              : <ul className="text-sm space-y-1">{data.docs.map((d: any) => (
                  <li key={d.id} className="flex justify-between border-b border-border py-1.5">
                    <span><b>{d.type}</b> · {d.file_name ?? d.file_path}</span>
                    <Badge variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "secondary"}>{d.status}</Badge>
                  </li>
                ))}</ul>}
          </Section>
        </TabsContent>

        {/* Payments tab */}
        <TabsContent value="payments" className="mt-4 space-y-4">
          <Section title={`Payments (${data.pays.length})`}>
            {data.pays.length === 0
              ? <div className="text-sm text-muted-foreground">No payments recorded.</div>
              : <div className="space-y-1.5 text-sm">{data.pays.map((x: any) => (
                  <div key={x.id} className="flex justify-between border-b border-border py-1.5">
                    <span>{x.currency} {Number(x.amount).toLocaleString()} · {x.service_description ?? x.payment_type} · {x.method ?? "—"}</span>
                    <Badge variant={x.status === "verified" || x.status === "paid" ? "default" : "secondary"}>{x.status === "verified" || x.status === "paid" ? "Paid" : x.status}</Badge>
                  </div>
                ))}</div>}
          </Section>
          <Section title={`Invoices (${data.invs.length})`}>
            {data.invs.length === 0
              ? <div className="text-sm text-muted-foreground">No invoices issued.</div>
              : <div className="space-y-1.5 text-sm">{data.invs.map((x: any) => (
                  <div key={x.id} className="flex justify-between border-b border-border py-1.5">
                    <span><b>{x.invoice_number}</b> · {x.service} · Due UGX {Number(x.amount_due).toLocaleString()} · Paid UGX {Number(x.amount_paid).toLocaleString()}</span>
                    <Badge variant={x.status === "paid" ? "default" : x.status === "cancelled" ? "outline" : "secondary"}>{x.status}</Badge>
                  </div>
                ))}</div>}
          </Section>
        </TabsContent>

        {/* Receipts tab */}
        <TabsContent value="receipts" className="mt-4">
          <Section title="Issued receipts">
            <p className="text-xs text-muted-foreground mb-2">Every verified/paid payment is a receipt.</p>
            {verifiedPays.length === 0
              ? <div className="text-sm text-muted-foreground">No receipts yet.</div>
              : <div className="space-y-1.5 text-sm">{verifiedPays.map((x: any) => (
                  <div key={x.id} className="flex justify-between border-b border-border py-1.5">
                    <span>R-{x.id.slice(0,8).toUpperCase()} · {x.currency} {Number(x.amount).toLocaleString()} · {x.service_description ?? x.payment_type}</span>
                    <Link to="/admin/receipts" className="text-primary text-xs hover:underline">Open in Receipts →</Link>
                  </div>
                ))}</div>}
          </Section>
        </TabsContent>

        {/* Job tab */}
        <TabsContent value="job" className="mt-4">
          <Section title="Assigned job (visible to applicant)">
            {app ? <JobAssignment app={app} jobs={data.jobs} onChange={refetch}/> : <div className="text-sm text-muted-foreground">No application record yet.</div>}
          </Section>
        </TabsContent>

        {/* Reports tab */}
        <TabsContent value="reports" className="mt-4">
          <Section title="Export applicant reports">
            <p className="text-sm text-muted-foreground mb-3">Generate a printable report for employers, embassies, or internal use.</p>
            <ExportReportInline data={data}/>
          </Section>
        </TabsContent>

        {/* Notes tab */}
        <TabsContent value="notes" className="mt-4">
          <Section title="Internal admin notes">
            {app ? <AdminNotes app={app} onSaved={refetch}/> : <div className="text-sm text-muted-foreground">No application yet.</div>}
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="font-bold text-lg mb-3 text-primary">{title}</h2>
      {children}
    </Card>
  );
}
function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

// ─── Status controls ──────────────────────────────────────────────────────
function StatusControls({ app, onChange }: { app: any; onChange: () => void }) {
  const [status, setStatus] = useState(app.status);
  const saveStatus = async () => {
    const { error } = await supabase.from("applications").update({ status: status as any }).eq("id", app.id);
    if (error) return toast.error(error.message);
    toast.success("Status updated — applicant notified");
    onChange();
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">The primary workflow is: Submitted → Under Review → Medical Check Pending → Documents Verified → Approved → Job Assigned</p>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[240px]">
          <Label>Status</Label>
          <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
            {ALL_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <Button onClick={saveStatus}><Save className="w-4 h-4 mr-1"/>Update status</Button>
      </div>
    </div>
  );
}

// ─── Job assignment ───────────────────────────────────────────────────────
function JobAssignment({ app, jobs, onChange }: { app: any; jobs: any[]; onChange: () => void }) {
  const [jobId, setJobId]       = useState(app.job_id ?? "");
  const [title, setTitle]       = useState(app.assigned_job_title ?? "");
  const [country, setCountry]   = useState(app.assigned_job_country ?? "");
  const [employer, setEmployer] = useState(app.assigned_job_employer ?? "");
  const [salary, setSalary]     = useState(app.assigned_job_salary ?? "");
  const [benefits, setBenefits] = useState(app.assigned_job_benefits ?? "");
  const [contract, setContract] = useState(app.assigned_job_contract_duration ?? "");
  const [desc, setDesc]         = useState(app.assigned_job_description ?? "");
  const [jdFile, setJdFile]     = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const onPickJob = (id: string) => {
    setJobId(id);
    const j = jobs.find((x) => x.id === id);
    if (j) {
      if (!title)   setTitle(j.title ?? "");
      if (!country) setCountry(j.country ?? "");
      if (!employer) setEmployer(j.employer ?? "");
    }
  };

  const save = async () => {
    setUploading(true);
    let jdPath = app.assigned_job_description_path ?? null;
    if (jdFile) {
      const path = `${app.applicant_id}/job-description-${Date.now()}-${jdFile.name}`;
      const { error: upErr } = await supabase.storage.from("applicant-documents").upload(path, jdFile, { upsert: true });
      if (upErr) { setUploading(false); return toast.error(upErr.message); }
      jdPath = path;
    }
    const { error } = await supabase.from("applications").update({
      job_id: jobId || null,
      assigned_job_title:             title   || null,
      assigned_job_country:           country || null,
      assigned_job_employer:          employer || null,
      assigned_job_salary:            salary  || null,
      assigned_job_benefits:          benefits || null,
      assigned_job_contract_duration: contract || null,
      assigned_job_description:       desc    || null,
      assigned_job_description_path:  jdPath,
    } as any).eq("id", app.id);
    setUploading(false);
    if (error) return toast.error(error.message);
    setJdFile(null);
    toast.success("Assignment saved — visible on applicant dashboard");
    onChange();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Pick from job catalogue</Label>
        <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={jobId} onChange={(e) => onPickJob(e.target.value)}>
          <option value="">— None / custom —</option>
          {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title} · {j.country}{j.employer ? ` · ${j.employer}` : ""}</option>)}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Job title *</Label><Input value={title}    onChange={(e) => setTitle(e.target.value)}    placeholder="e.g. Hotel Cleaner"/></div>
        <div><Label>Country *</Label><Input value={country}   onChange={(e) => setCountry(e.target.value)}   placeholder="e.g. UAE"/></div>
        <div><Label>Employer</Label><Input value={employer}  onChange={(e) => setEmployer(e.target.value)}  placeholder="e.g. Al Habtoor"/></div>
        <div><Label>Salary</Label><Input value={salary}    onChange={(e) => setSalary(e.target.value)}    placeholder="e.g. AED 1,500/month"/></div>
        <div><Label>Contract duration</Label><Input value={contract}  onChange={(e) => setContract(e.target.value)}  placeholder="e.g. 2 years"/></div>
        <div><Label>Benefits</Label><Input value={benefits}  onChange={(e) => setBenefits(e.target.value)}  placeholder="Food, accommodation…"/></div>
        <div className="sm:col-span-2"><Label>Job description</Label><Textarea rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Full job description…"/></div>
        <div className="sm:col-span-2">
          <Label>Or upload a job-description document</Label>
          <label className="flex items-center gap-3 p-3 border border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/40">
            <Upload className="w-5 h-5 text-primary"/>
            <span className="text-sm">{jdFile ? jdFile.name : app.assigned_job_description_path ? `Current: ${(app.assigned_job_description_path as string).split("/").pop()}` : "Tap to choose a PDF/DOCX"}</span>
            <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => setJdFile(e.target.files?.[0] ?? null)}/>
          </label>
        </div>
      </div>
      <Button onClick={save} disabled={uploading}><Save className="w-4 h-4 mr-1"/>{uploading ? "Saving…" : "Save assignment"}</Button>
    </div>
  );
}

// ─── Notes ────────────────────────────────────────────────────────────────
function AdminNotes({ app, onSaved }: { app: any; onSaved: () => void }) {
  const [notes, setNotes] = useState(app.admin_notes ?? "");
  const save = async () => {
    const { error } = await supabase.from("applications").update({ admin_notes: notes }).eq("id", app.id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved"); onSaved();
  };
  return (
    <div className="space-y-2">
      <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this applicant…"/>
      <Button onClick={save}><Save className="w-4 h-4 mr-1"/>Save notes</Button>
    </div>
  );
}

// ─── Report export (inline + button) ─────────────────────────────────────
function ExportReportInline({ data }: { data: any }) {
  const [type, setType]                   = useState<"biodata"|"full">("biodata");
  const [jobDescOverride, setJobDescOverride] = useState("");
  const generate = (print: boolean) => {
    const html = buildReportHtml(data, type, jobDescOverride);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html); w.document.close();
    if (print) setTimeout(() => w.print(), 400);
  };
  return (
    <div className="space-y-3 max-w-2xl">
      <div>
        <Label>Report type</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Button type="button" variant={type==="biodata"?"default":"outline"} size="sm" onClick={() => setType("biodata")}>Biodata Summary</Button>
          <Button type="button" variant={type==="full"?"default":"outline"} size="sm" onClick={() => setType("full")}>Full Application</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "biodata" ? "Personal, contact, family contacts, preferred jobs, assigned job." : "Complete form: personal, identity, parents, next of kin, education, employment."}
        </p>
      </div>
      <div>
        <Label>Extra job description (optional override)</Label>
        <Textarea rows={4} value={jobDescOverride} onChange={(e) => setJobDescOverride(e.target.value)} placeholder="Leave blank to use the saved assigned-job description."/>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => generate(false)}><FileText className="w-4 h-4 mr-1"/>Preview</Button>
        <Button className="flex-1 bg-gradient-primary" onClick={() => generate(true)}><Printer className="w-4 h-4 mr-1"/>Print / PDF</Button>
      </div>
    </div>
  );
}

function ExportReportButton({ data }: { data: any }) {
  const [open, setOpen]                   = useState(false);
  const [type, setType]                   = useState<"biodata"|"full">("biodata");
  const [jobDescOverride, setJobDescOverride] = useState("");
  const generate = (print: boolean) => {
    const html = buildReportHtml(data, type, jobDescOverride);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html); w.document.close();
    if (print) setTimeout(() => w.print(), 400);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary"><FileDown className="w-4 h-4 mr-1"/>Export report</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Export applicant report</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Report type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button type="button" variant={type==="biodata"?"default":"outline"} size="sm" onClick={() => setType("biodata")}>Biodata Summary</Button>
              <Button type="button" variant={type==="full"?"default":"outline"} size="sm" onClick={() => setType("full")}>Full Application</Button>
            </div>
          </div>
          <div>
            <Label>Job description (optional override)</Label>
            <Textarea rows={4} value={jobDescOverride} onChange={(e) => setJobDescOverride(e.target.value)} placeholder="Leave blank to use the assigned job's description."/>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => generate(false)}><FileText className="w-4 h-4 mr-1"/>Preview</Button>
            <Button className="flex-1 bg-gradient-primary" onClick={() => generate(true)}><Printer className="w-4 h-4 mr-1"/>Print / PDF</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Report HTML builder ──────────────────────────────────────────────────
function buildReportHtml(data: any, type: "biodata"|"full", jobDescOverride: string) {
  const p = data.profile as any;
  const d = (data.details ?? {}) as any;
  const app = data.apps[0];
  const job = app?.jobs;

  const assignedTitle    = app?.assigned_job_title    || job?.title    || d.desired_job || "—";
  const assignedCountry  = app?.assigned_job_country  || job?.country  || "—";
  const assignedEmployer = app?.assigned_job_employer || job?.employer || "—";
  const assignedSalary   = app?.assigned_job_salary   || "—";
  const assignedBenefits = app?.assigned_job_benefits || "—";
  const assignedContract = app?.assigned_job_contract_duration || "—";
  const jobDesc          = jobDescOverride.trim() || app?.assigned_job_description || "";
  const preferredJobs: string[] = d.preferred_jobs ?? [];
  const reason: string = d.reason_for_abroad ?? "";
  const reportTitle = type === "biodata" ? "BIODATA SUMMARY" : "FULL APPLICATION REPORT";

  const row = (k: string, v: any) => `<tr><th>${k}</th><td>${v ?? "—"}</td></tr>`;

  const personal = `<h2>Personal &amp; Contact Information</h2><table class="info">
    ${row("Applicant Code", p.applicant_code)}
    ${row("Full Name",      p.full_name)}
    ${row("Date of Birth",  p.date_of_birth)}
    ${row("Gender",         p.gender)}
    ${row("Nationality",    p.nationality)}
    ${row("Phone",          p.phone)}
    ${row("Email",          p.email)}
    ${row("District of Residence", d.district || p.district)}
    ${row("Village / Address",     d.village  || p.address)}
    ${row("Profession",     p.profession)}
  </table>`;

  const family = `<h2>Family Information</h2><table class="info">
    ${row("Father's Full Name",      d.father_name)}
    ${row("Father's Telephone",      d.father_phone)}
    ${row("Father's Status",         d.father_status)}
    ${row("Mother's Full Name",      d.mother_name)}
    ${row("Mother's Telephone",      d.mother_phone)}
    ${row("Mother's Status",         d.mother_status)}
    ${row("Next of Kin",             d.next_of_kin_name)}
    ${row("Next of Kin Telephone",   d.next_of_kin_phone)}
    ${row("Relationship to Applicant", d.next_of_kin_relationship)}
  </table>`;

  const identity = `<h2>Identity &amp; Travel</h2><table class="info">
    ${row("NIN",            d.nin)}
    ${row("Has Passport",   d.has_passport === null || d.has_passport === undefined ? "—" : d.has_passport ? "Yes" : "No")}
    ${row("Passport Number", d.passport_number)}
  </table>`;

  const employment = `<h2>Employment &amp; Education</h2><table class="info">
    ${row("Profession",          p.profession)}
    ${row("Years of Experience", p.years_experience)}
    ${row("Education Level",     p.education_level)}
    ${row("Primary Desired Job", d.desired_job)}
    ${row("Other Preferred Jobs", preferredJobs.length ? preferredJobs.join(", ") : null)}
    ${row("Expected Salary (UGX/mo)", d.salary_expectation_ugx ? Number(d.salary_expectation_ugx).toLocaleString() : null)}
    ${row("Why Work Abroad",     reason ? reason.replace(/\n/g,"<br/>") : null)}
  </table>`;

  const preferredBlock = `<h2>Preferred Jobs (Applicant's Choices)</h2><table class="info">
    ${row("Primary Desired",     d.desired_job)}
    ${row("Also Willing To Do",  preferredJobs.length ? preferredJobs.join(", ") : null)}
    ${row("Expected Salary (UGX/mo)", d.salary_expectation_ugx ? Number(d.salary_expectation_ugx).toLocaleString() : null)}
    ${row("Why Work Abroad",     reason ? reason.replace(/\n/g,"<br/>") : null)}
  </table>`;

  const assignedBlock = `<h2>Assigned Job (Wakatine)</h2><table class="info">
    ${row("Job Title",         assignedTitle)}
    ${row("Country",           assignedCountry)}
    ${row("Employer",          assignedEmployer)}
    ${row("Salary",            assignedSalary)}
    ${row("Contract Duration", assignedContract)}
    ${row("Benefits",          assignedBenefits)}
    ${row("Application Status", app ? (STATUS_LABEL[app.status] ?? (app.status as string).replace(/_/g," ")) : "—")}
  </table>`;

  const jobBlock = (assignedTitle !== "—" || jobDesc)
    ? `<h2>Job Description</h2>
       <div class="job">
         <div class="job-head"><b>${assignedTitle}</b>${assignedCountry && assignedCountry !== "—" ? ` &mdash; ${assignedCountry}` : ""}</div>
         ${jobDesc ? `<div class="job-desc">${jobDesc.replace(/\n/g,"<br/>")}</div>` : `<div class="job-desc" style="color:#999">No description attached.</div>`}
         ${app?.assigned_job_description_path ? `<div class="job-desc" style="margin-top:8px;color:#666;font-size:11px"><em>Document on file: ${(app.assigned_job_description_path as string).split("/").pop()}</em></div>` : ""}
       </div>` : "";

  const body = type === "biodata"
    ? `${personal}${family}${preferredBlock}${assignedBlock}${jobBlock}`
    : `${personal}${identity}${family}${employment}${preferredBlock}${assignedBlock}${jobBlock}`;

  return `<!doctype html><html><head><title>${reportTitle} · ${p.full_name ?? p.applicant_code}</title>
<style>
  *{box-sizing:border-box} body{font-family:'Segoe UI',system-ui,sans-serif;padding:32px;max-width:800px;margin:auto;color:#1a1a1a}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #3b2a86;padding-bottom:14px;margin-bottom:20px}
  h1{color:#3b2a86;margin:0;font-size:22px} .gold{color:#c9a84c}
  .sub{color:#666;font-size:12px;margin-top:4px}
  .badge{background:#3b2a86;color:#fff;padding:6px 14px;border-radius:6px;font-weight:600;letter-spacing:1px;font-size:11px}
  h2{color:#3b2a86;font-size:14px;letter-spacing:2px;margin:22px 0 8px;text-transform:uppercase;border-bottom:1px solid #eee;padding-bottom:4px}
  table.info{width:100%;border-collapse:collapse;font-size:13px}
  table.info th{text-align:left;padding:6px 10px;color:#888;font-weight:600;width:38%;font-size:11px;text-transform:uppercase;letter-spacing:.5px;background:#faf8f5;border-bottom:1px solid #eee}
  table.info td{padding:6px 10px;border-bottom:1px solid #eee}
  .job{border:1px solid #eee;border-radius:6px;padding:14px;background:#faf8f5}
  .job-head{color:#3b2a86;margin-bottom:8px;font-size:14px}
  .job-desc{font-size:13px;line-height:1.55}
  .footer{margin-top:36px;border-top:1px solid #eee;padding-top:12px;font-size:11px;color:#888;text-align:center}
  .sig{display:flex;justify-content:space-between;margin-top:42px;font-size:11px}
  .sig div{border-top:1px solid #333;padding-top:5px;width:40%;text-align:center;color:#666}
  @media print{body{padding:18px}}
</style></head><body>
<div class="head">
  <div>
    <h1>Waka<span class="gold">tine</span> Tours &amp; Travel Co. Ltd</h1>
    <div class="sub">Iganga, behind Stanbic Bank · +256 789 431 312 · info@wakatine.ug</div>
  </div>
  <div class="badge">${reportTitle}</div>
</div>
<div style="font-size:12px;color:#666;margin-bottom:8px">Generated ${new Date().toLocaleString()} · Applicant ${p.applicant_code ?? "—"}</div>
${body}
<div class="sig"><div>Applicant signature</div><div>Wakatine Administrator</div></div>
<div class="footer">CONFIDENTIAL — For internal &amp; deployment use only.</div>
</body></html>`;
}
