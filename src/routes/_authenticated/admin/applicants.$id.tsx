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
import { ArrowLeft, FileDown, Briefcase, Save, FileText, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/applicants/$id")({ component: ApplicantProfile });

const STATUSES = [
  "draft","registration_submitted","under_review","approved","documents_pending","documents_verified",
  "interview_scheduled","interview_passed","medical_check_pending","visa_processing","visa_approved",
  "flight_scheduled","deployed_abroad","rejected",
];
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", registration_submitted: "Submitted", under_review: "Under Review", approved: "Approved",
  documents_pending: "Docs Pending", documents_verified: "Docs Verified",
  interview_scheduled: "Interview Scheduled", interview_passed: "Interview Passed", medical_check_pending: "Medical Processing",
  visa_processing: "Visa Processing", visa_approved: "Visa Approved", flight_scheduled: "Flight Scheduled",
  deployed_abroad: "Deployed", rejected: "Rejected",
};

function ApplicantProfile() {
  const { id } = useParams({ from: "/_authenticated/admin/applicants/$id" });
  const qc = useQueryClient();
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

  const p = data.profile;
  const app = data.apps[0]; // primary application
  const totalPaid = data.pays.filter((x: any) => x.status === "verified" || x.status === "paid").reduce((s: number, x: any) => s + Number(x.amount), 0);
  const totalOwed = data.invs.reduce((s: number, x: any) => s + Number(x.balance), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between flex-wrap gap-3 items-start">
        <div>
          <Link to="/admin/applicants" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3"/>Back to applicants</Link>
          <h1 className="text-3xl font-bold mt-1 flex items-center gap-3">
            <span className="text-primary text-sm font-mono bg-primary/10 px-2 py-1 rounded">{p.applicant_code ?? "—"}</span>
            {p.full_name ?? "(no name)"}
            {p.is_walk_in && <span className="text-[10px] uppercase bg-gold/20 text-gold px-2 py-0.5 rounded">walk-in</span>}
          </h1>
          <p className="text-muted-foreground">{p.email ?? "—"} · {p.phone ?? "—"}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportReportButton data={data} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Total paid</div><div className="text-xl font-bold">UGX {totalPaid.toLocaleString()}</div></Card>
        <Card className={`p-4 ${totalOwed > 0 ? "border-destructive/40" : ""}`}><div className="text-xs uppercase tracking-widest text-muted-foreground">Outstanding</div><div className={`text-xl font-bold ${totalOwed > 0 ? "text-destructive" : ""}`}>UGX {totalOwed.toLocaleString()}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Application status</div><div className="text-xl font-bold">{app ? STATUS_LABEL[app.status] : "—"}</div></Card>
      </div>

      <Section title="Personal details">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Field label="Full name" value={p.full_name}/>
          <Field label="Date of birth" value={p.date_of_birth}/>
          <Field label="Gender" value={p.gender}/>
          <Field label="Nationality" value={p.nationality}/>
          <Field label="District" value={p.district}/>
          <Field label="Address" value={p.address}/>
          <Field label="Profession" value={p.profession}/>
          <Field label="Years experience" value={p.years_experience}/>
          <Field label="Education" value={p.education_level}/>
        </div>
      </Section>

      <Section title="Application details">
        {data.details ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Field label="NIN" value={data.details.nin}/>
            <Field label="Passport #" value={data.details.passport_number}/>
            <Field label="Has passport" value={data.details.has_passport === null ? "—" : data.details.has_passport ? "Yes" : "No"}/>
            <Field label="Village" value={data.details.village}/>
            <Field label="Father status" value={data.details.father_status}/>
            <Field label="Mother status" value={data.details.mother_status}/>
            <Field label="Next of kin" value={data.details.next_of_kin_name}/>
            <Field label="Next of kin phone" value={data.details.next_of_kin_phone}/>
            <Field label="Relationship" value={data.details.next_of_kin_relationship}/>
            <Field label="Desired job" value={data.details.desired_job}/>
            <Field label="Expected salary" value={data.details.salary_expectation_ugx ? `UGX ${Number(data.details.salary_expectation_ugx).toLocaleString()}` : null}/>
            <Field label="Submitted" value={data.details.submitted ? "Yes" : "No"}/>
          </div>
        ) : <div className="text-sm text-muted-foreground">No registration form submitted yet.</div>}
      </Section>

      {app && (
        <Section title="Application status & job assignment">
          <ApplicationControls app={app} jobs={data.jobs} onChange={() => qc.invalidateQueries({ queryKey: ["admin-applicant-full", id] })}/>
        </Section>
      )}

      <Section title={`Documents (${data.docs.length})`}>
        {data.docs.length === 0 ? <div className="text-sm text-muted-foreground">No documents uploaded.</div> : (
          <ul className="text-sm space-y-1">{data.docs.map((d: any) => (
            <li key={d.id} className="flex justify-between border-b border-border py-1.5">
              <span><b>{d.type}</b> · {d.file_name ?? d.file_path}</span>
              <Badge variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "secondary"}>{d.status}</Badge>
            </li>
          ))}</ul>
        )}
      </Section>

      <Section title={`Payments (${data.pays.length})`}>
        {data.pays.length === 0 ? <div className="text-sm text-muted-foreground">No payments recorded.</div> : (
          <div className="space-y-1.5 text-sm">{data.pays.map((x: any) => (
            <div key={x.id} className="flex justify-between border-b border-border py-1.5">
              <span>{x.currency} {Number(x.amount).toLocaleString()} · {x.service_description ?? x.payment_type} · {x.method ?? "—"}</span>
              <Badge variant={x.status === "verified" || x.status === "paid" ? "default" : "secondary"}>{x.status === "verified" || x.status === "paid" ? "Paid" : x.status}</Badge>
            </div>
          ))}</div>
        )}
      </Section>

      <Section title={`Invoices (${data.invs.length})`}>
        {data.invs.length === 0 ? <div className="text-sm text-muted-foreground">No invoices issued.</div> : (
          <div className="space-y-1.5 text-sm">{data.invs.map((x: any) => (
            <div key={x.id} className="flex justify-between border-b border-border py-1.5">
              <span><b>{x.invoice_number}</b> · {x.service} · Due UGX {Number(x.amount_due).toLocaleString()} · Paid UGX {Number(x.amount_paid).toLocaleString()}</span>
              <Badge variant={x.status==="paid"?"default":x.status==="cancelled"?"outline":"secondary"}>{x.status}</Badge>
            </div>
          ))}</div>
        )}
      </Section>

      {app && (
        <Section title="Admin notes">
          <AdminNotes app={app} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-applicant-full", id] })}/>
        </Section>
      )}
    </div>
  );
}

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
      <div>{value ?? "—"}</div>
    </div>
  );
}

function ApplicationControls({ app, jobs, onChange }: { app: any; jobs: any[]; onChange: () => void }) {
  const [status, setStatus] = useState(app.status);
  const [jobId, setJobId] = useState(app.job_id ?? "");
  const [customTitle, setCustomTitle] = useState(app.assigned_job_title ?? "");
  const [customCountry, setCustomCountry] = useState(app.assigned_job_country ?? "");
  const [customDesc, setCustomDesc] = useState(app.assigned_job_description ?? "");

  const saveStatus = async () => {
    const { error } = await supabase.from("applications").update({ status: status as any }).eq("id", app.id);
    if (error) return toast.error(error.message);
    toast.success("Status updated — applicant notified"); onChange();
  };
  const saveJob = async () => {
    const payload: any = {
      job_id: jobId || app.job_id,
      assigned_job_title: customTitle || null,
      assigned_job_country: customCountry || null,
      assigned_job_description: customDesc || null,
    };
    const { error } = await supabase.from("applications").update(payload).eq("id", app.id);
    if (error) return toast.error(error.message);
    toast.success("Job assignment saved"); onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[220px]">
          <Label>Status</Label>
          <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={status} onChange={(e)=>setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <Button onClick={saveStatus}><Save className="w-4 h-4 mr-1"/>Update status</Button>
      </div>
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4 text-primary"/><span className="font-semibold text-sm">Assigned job</span></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Select from catalogue</Label>
            <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={jobId} onChange={(e)=>setJobId(e.target.value)}>
              <option value="">— None —</option>
              {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title} · {j.country}</option>)}
            </select>
          </div>
        </div>
        <div className="text-xs text-muted-foreground my-2">— or override with a custom assignment —</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Custom title</Label><Input value={customTitle} onChange={(e)=>setCustomTitle(e.target.value)} placeholder="e.g. Hotel Cleaner"/></div>
          <div><Label>Country</Label><Input value={customCountry} onChange={(e)=>setCustomCountry(e.target.value)} placeholder="e.g. UAE"/></div>
          <div className="sm:col-span-2"><Label>Job description</Label><Textarea rows={4} value={customDesc} onChange={(e)=>setCustomDesc(e.target.value)} placeholder="Paste or type the job description that will appear on the exported report…"/></div>
        </div>
        <Button className="mt-3" onClick={saveJob}><Save className="w-4 h-4 mr-1"/>Save assignment</Button>
      </div>
    </div>
  );
}

function AdminNotes({ app, onSaved }: { app: any; onSaved: () => void }) {
  const [notes, setNotes] = useState(app.admin_notes ?? "");
  const save = async () => {
    const { error } = await supabase.from("applications").update({ admin_notes: notes }).eq("id", app.id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved"); onSaved();
  };
  return (
    <div className="space-y-2">
      <Textarea rows={4} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Internal notes about this applicant…"/>
      <Button onClick={save}><Save className="w-4 h-4 mr-1"/>Save notes</Button>
    </div>
  );
}

function ExportReportButton({ data }: { data: any }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"biodata"|"full">("biodata");
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
      <DialogTrigger asChild><Button className="bg-gradient-primary"><FileDown className="w-4 h-4 mr-1"/>Export report</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Export applicant report</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Report type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button type="button" variant={type==="biodata"?"default":"outline"} size="sm" onClick={()=>setType("biodata")}>Biodata Summary</Button>
              <Button type="button" variant={type==="full"?"default":"outline"} size="sm" onClick={()=>setType("full")}>Full Application</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {type === "biodata" ? "Personal info, contact, job applied for & application status." : "Entire registration form: personal, family, education, employment, next of kin."}
            </p>
          </div>
          <div>
            <Label>Job description (optional override)</Label>
            <Textarea rows={5} value={jobDescOverride} onChange={(e)=>setJobDescOverride(e.target.value)} placeholder="Paste or type a job description to attach to the report. Leave blank to use the assigned job's description."/>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={()=>generate(false)}><FileText className="w-4 h-4 mr-1"/>Preview</Button>
            <Button className="flex-1 bg-gradient-primary" onClick={()=>generate(true)}><Printer className="w-4 h-4 mr-1"/>Print / PDF</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildReportHtml(data: any, type: "biodata"|"full", jobDescOverride: string) {
  const p = data.profile, d = data.details ?? {}, app = data.apps[0];
  const job = app?.jobs;
  const assignedTitle = app?.assigned_job_title || job?.title || d.desired_job || "—";
  const assignedCountry = app?.assigned_job_country || job?.country || "—";
  const jobDesc = jobDescOverride.trim() || app?.assigned_job_description || "";
  const reportTitle = type === "biodata" ? "BIODATA SUMMARY" : "FULL APPLICATION REPORT";

  const row = (k: string, v: any) => `<tr><th>${k}</th><td>${v ?? "—"}</td></tr>`;

  const personal = `<h2>Personal & Contact Information</h2><table class="info">
    ${row("Applicant Code", p.applicant_code)}
    ${row("Full Name", p.full_name)}
    ${row("Date of Birth", p.date_of_birth)}
    ${row("Gender", p.gender)}
    ${row("Nationality", p.nationality)}
    ${row("Phone", p.phone)}
    ${row("Email", p.email)}
    ${row("District", p.district)}
    ${row("Address", p.address)}
    ${row("Profession", p.profession)}
  </table>`;

  const family = `<h2>Family Information</h2><table class="info">
    ${row("Father status", d.father_status)}
    ${row("Mother status", d.mother_status)}
    ${row("Next of kin", d.next_of_kin_name)}
    ${row("Next of kin phone", d.next_of_kin_phone)}
    ${row("Relationship", d.next_of_kin_relationship)}
    ${row("Village", d.village)}
  </table>`;

  const identity = `<h2>Identity & Travel</h2><table class="info">
    ${row("NIN", d.nin)}
    ${row("Has passport", d.has_passport === null || d.has_passport === undefined ? "—" : d.has_passport ? "Yes" : "No")}
    ${row("Passport number", d.passport_number)}
  </table>`;

  const employment = `<h2>Employment & Education</h2><table class="info">
    ${row("Profession", p.profession)}
    ${row("Years of experience", p.years_experience)}
    ${row("Education level", p.education_level)}
    ${row("Desired job", d.desired_job)}
    ${row("Expected salary (UGX)", d.salary_expectation_ugx ? Number(d.salary_expectation_ugx).toLocaleString() : null)}
  </table>`;

  const application = `<h2>Application</h2><table class="info">
    ${row("Assigned job", assignedTitle)}
    ${row("Country", assignedCountry)}
    ${row("Employer", job?.employer)}
    ${row("Status", app ? (app.status as string).replace(/_/g," ").toUpperCase() : "—")}
  </table>`;

  const jobBlock = (assignedTitle !== "—" || jobDesc) ? `<h2>Job Description</h2>
    <div class="job">
      <div class="job-head"><b>${assignedTitle}</b>${assignedCountry && assignedCountry !== "—" ? ` &mdash; ${assignedCountry}` : ""}</div>
      ${jobDesc ? `<div class="job-desc">${jobDesc.replace(/\n/g, "<br/>")}</div>` : `<div class="job-desc" style="color:#999">No description attached.</div>`}
    </div>` : "";

  const body = type === "biodata"
    ? `${personal}${application}${jobBlock}`
    : `${personal}${identity}${family}${employment}${application}${jobBlock}`;

  return `<!doctype html><html><head><title>${reportTitle} · ${p.full_name ?? p.applicant_code}</title>
<style>
  *{box-sizing:border-box} body{font-family:'Segoe UI',system-ui,sans-serif;padding:32px;max-width:800px;margin:auto;color:#1a1a1a}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #3b2a86;padding-bottom:14px;margin-bottom:20px}
  h1{color:#3b2a86;margin:0;font-size:22px} .gold{color:#c9a84c}
  .sub{color:#666;font-size:12px;margin-top:4px}
  .badge{background:#3b2a86;color:#fff;padding:6px 14px;border-radius:6px;font-weight:600;letter-spacing:1px;font-size:11px}
  h2{color:#3b2a86;font-size:14px;letter-spacing:2px;margin:22px 0 8px;text-transform:uppercase;border-bottom:1px solid #eee;padding-bottom:4px}
  table.info{width:100%;border-collapse:collapse;font-size:13px}
  table.info th{text-align:left;padding:6px 10px;color:#888;font-weight:600;width:35%;font-size:11px;text-transform:uppercase;letter-spacing:.5px;background:#faf8f5;border-bottom:1px solid #eee}
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
<div class="footer">CONFIDENTIAL — For internal & deployment use only.</div>
</body></html>`;
}