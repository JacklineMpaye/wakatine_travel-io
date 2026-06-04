import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Upload, Circle, Clock, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-application")({ component: MyApplication });

const STAGES = [
  "registration_submitted","documents_pending","documents_verified","interview_scheduled",
  "interview_passed","medical_check_pending","visa_processing","visa_approved","flight_scheduled","deployed_abroad",
];
const STAGE_LABEL: Record<string,string> = {
  registration_submitted:"Registration Submitted", documents_pending:"Documents Pending", documents_verified:"Documents Verified",
  interview_scheduled:"Interview Scheduled", interview_passed:"Interview Passed", medical_check_pending:"Medical Check",
  visa_processing:"Visa Processing", visa_approved:"Visa Approved", flight_scheduled:"Flight Scheduled", deployed_abroad:"Deployed Abroad",
};

const UAE_JOBS = [
  "Cleaner","Security Guard","Driver","House Maid","Hotel Attendant","Waiter/Waitress",
  "Kitchen Helper","Chef Assistant","Laundry Attendant","Construction Worker","Caregiver",
  "Barber","Salon Worker","Packing Worker","Office Cleaner",
];

const NIN_ISSUES = [
  { v: "no_issues", l: "No issues" },
  { v: "lost_id", l: "Lost National ID" },
  { v: "wrong_info", l: "Wrong information on ID" },
  { v: "renewal_needed", l: "Renewal needed" },
  { v: "no_nin", l: "I don't have a National ID" },
];

const FEE_PASSPORT = 350000;
const FEE_NIN = 150000;

type Form = {
  full_name: string; date_of_birth: string; gender: string; phone: string; email: string;
  nationality: string; district: string; village: string; nin: string;
  father_status: string; mother_status: string;
  next_of_kin_name: string; next_of_kin_phone: string; next_of_kin_relationship: string;
  has_passport: "" | "yes" | "no"; passport_number: string;
  desired_job: string; salary_expectation_ugx: string; nin_issue: string;
};

const STEPS = ["Personal", "Family", "Documents", "Job", "Review"];

function MyApplication() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tracker, setTracker] = useState<{ status: string; admin_notes: string | null } | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [f, setF] = useState<Form>({
    full_name: "", date_of_birth: "", gender: "", phone: "", email: user?.email ?? "",
    nationality: "Ugandan", district: "", village: "", nin: "",
    father_status: "", mother_status: "",
    next_of_kin_name: "", next_of_kin_phone: "", next_of_kin_relationship: "",
    has_passport: "", passport_number: "",
    desired_job: "", salary_expectation_ugx: "", nin_issue: "no_issues",
  });

  // Load existing draft
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("application_details").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setSavedId(data.id);
        setSubmitted(Boolean((data as any).submitted));
        setF((prev) => ({
          ...prev,
          full_name: data.full_name ?? "", date_of_birth: data.date_of_birth ?? "", gender: data.gender ?? "",
          phone: data.phone ?? "", email: data.email ?? prev.email, nationality: data.nationality ?? "Ugandan",
          district: data.district ?? "", village: data.village ?? "", nin: data.nin ?? "",
          father_status: data.father_status ?? "", mother_status: data.mother_status ?? "",
          next_of_kin_name: data.next_of_kin_name ?? "", next_of_kin_phone: data.next_of_kin_phone ?? "",
          next_of_kin_relationship: data.next_of_kin_relationship ?? "",
          has_passport: data.has_passport === null ? "" : data.has_passport ? "yes" : "no",
          passport_number: data.passport_number ?? "",
          desired_job: data.desired_job ?? "", salary_expectation_ugx: data.salary_expectation_ugx?.toString() ?? "",
          nin_issue: data.nin_issue ?? "no_issues",
        }));
      }
      const { data: app } = await supabase.from("applications").select("status, admin_notes").eq("applicant_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (app) setTracker({ status: app.status as string, admin_notes: (app.admin_notes as string | null) ?? null });
    })();
  }, [user]);

  const upd = (k: keyof Form, v: string) => setF({ ...f, [k]: v });

  const save = async (markSubmitted = false): Promise<string | null> => {
    if (!user) return null;
    const payload = {
      user_id: user.id,
      full_name: f.full_name || null, date_of_birth: f.date_of_birth || null, gender: f.gender || null,
      phone: f.phone || null, email: f.email || null, nationality: f.nationality || "Ugandan",
      district: f.district || null, village: f.village || null, nin: f.nin || null,
      father_status: f.father_status || null, mother_status: f.mother_status || null,
      next_of_kin_name: f.next_of_kin_name || null, next_of_kin_phone: f.next_of_kin_phone || null,
      next_of_kin_relationship: f.next_of_kin_relationship || null,
      has_passport: f.has_passport === "" ? null : f.has_passport === "yes",
      passport_number: f.has_passport === "yes" ? f.passport_number || null : null,
      desired_job: f.desired_job || null,
      salary_expectation_ugx: f.salary_expectation_ugx ? Number(f.salary_expectation_ugx) : null,
      nin_issue: f.nin_issue || "no_issues",
      submitted: markSubmitted || undefined,
    };
    const { data, error } = await supabase.from("application_details").upsert(payload, { onConflict: "user_id" }).select().single();
    if (error) { toast.error(error.message); return null; }
    setSavedId(data.id);
    return data.id;
  };

  const next = async () => {
    // step-specific validation
    if (step === 0) {
      if (!f.full_name || !f.date_of_birth || !f.gender || !f.phone || !f.district || !f.nin) {
        return toast.error("Please fill all required fields");
      }
      if (!/^\d{14}$/.test(f.nin.replace(/\s/g, ""))) {
        return toast.error("NIN should be 14 characters");
      }
    }
    if (step === 1) {
      if (!f.father_status || !f.mother_status || !f.next_of_kin_name || !f.next_of_kin_phone || !f.next_of_kin_relationship) {
        return toast.error("Please complete family details");
      }
    }
    if (step === 2) {
      if (!f.has_passport) return toast.error("Tell us about your passport");
      if (f.has_passport === "yes" && !f.passport_number) return toast.error("Enter passport number");
    }
    if (step === 3) {
      if (!f.desired_job || !f.salary_expectation_ugx) return toast.error("Choose a job and salary expectation");
    }
    await save();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    const id = await save(true);
    if (!id) { setLoading(false); return; }

    // Upload passport photo if provided
    if (passportFile) {
      const path = `${user.id}/passport-photo-${Date.now()}-${passportFile.name}`;
      const { error: upErr } = await supabase.storage.from("applicant-documents").upload(path, passportFile, { upsert: true });
      if (!upErr) {
        await supabase.from("documents").insert({ user_id: user.id, type: "passport_photo" as any, file_path: path, file_name: passportFile.name });
        await supabase.from("application_details").update({ passport_photo_path: path }).eq("user_id", user.id);
      }
    }

    // Auto-create payment requirements
    const fees: any[] = [];
    if (f.has_passport === "no") {
      fees.push({ user_id: user.id, amount: FEE_PASSPORT, currency: "UGX", status: "pending", payment_type: "passport_processing", notes: "Passport processing fee — required because you do not have a passport." });
    }
    if (f.nin_issue && f.nin_issue !== "no_issues") {
      fees.push({ user_id: user.id, amount: FEE_NIN, currency: "UGX", status: "pending", payment_type: "nin_assistance", notes: `NIN assistance fee — ${NIN_ISSUES.find((x)=>x.v===f.nin_issue)?.l ?? f.nin_issue}.` });
    }
    if (fees.length) await supabase.from("payments").insert(fees);

    // Notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Application submitted",
      message: fees.length
        ? `Your application is received. ${fees.length} payment requirement(s) have been added to your account.`
        : "Your application is received. Our team will contact you shortly.",
    });

    setLoading(false);
    setSubmitted(true);
    setEditing(false);
    toast.success("Application submitted!");
  };

  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  const requiresPassportFee = f.has_passport === "no";
  const requiresNinFee = f.nin_issue && f.nin_issue !== "no_issues";

  if (submitted && !editing) {
    const status = tracker?.status ?? "registration_submitted";
    const idx = STAGES.indexOf(status);
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Application</h1>
            <p className="text-muted-foreground text-sm">Wakatine UAE Recruitment</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setEditing(true); setStep(0); }}><Pencil className="w-4 h-4 mr-1"/>Edit details</Button>
        </div>
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Application progress</h2>
            <Badge className="bg-gradient-primary text-primary-foreground">{STAGE_LABEL[status] ?? status}</Badge>
          </div>
          <div className="space-y-1">
            {STAGES.map((s, i) => {
              const done = i < idx, current = i === idx;
              return (
                <div key={s} className={`flex items-center gap-3 py-1.5 ${done?"text-success":current?"text-primary font-medium":"text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="w-4 h-4"/> : current ? <Clock className="w-4 h-4 animate-pulse"/> : <Circle className="w-4 h-4"/>}
                  <span className="text-sm">{STAGE_LABEL[s]}</span>
                </div>
              );
            })}
          </div>
          {tracker?.admin_notes && <div className="mt-4 p-3 bg-muted rounded-lg text-sm"><span className="font-medium">Admin notes:</span> {tracker.admin_notes}</div>}
        </Card>
        <Card className="p-6 space-y-2">
          <h2 className="font-bold text-lg mb-2">Submitted details</h2>
          <Review label="Full Name" v={f.full_name}/>
          <Review label="Phone" v={f.phone}/>
          <Review label="NIN" v={f.nin}/>
          <Review label="District / Village" v={`${f.district}${f.village ? ` · ${f.village}` : ""}`}/>
          <Review label="Next of Kin" v={`${f.next_of_kin_name} (${f.next_of_kin_relationship}) — ${f.next_of_kin_phone}`}/>
          <Review label="Passport" v={f.has_passport === "yes" ? `Yes — ${f.passport_number}` : "No (processing required)"}/>
          <Review label="Desired Job" v={f.desired_job}/>
          <Review label="Salary expectation" v={f.salary_expectation_ugx ? `UGX ${Number(f.salary_expectation_ugx).toLocaleString()}` : "—"}/>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{editing ? "Edit Application" : "Start Your Application"}</h1>
        <p className="text-muted-foreground text-sm">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
      </div>
      <Progress value={pct} className="h-2"/>

      <Card className="p-5 md:p-7">
        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name *"><Input value={f.full_name} onChange={(e)=>upd("full_name",e.target.value)}/></Field>
            <Field label="Date of Birth *"><Input type="date" value={f.date_of_birth} onChange={(e)=>upd("date_of_birth",e.target.value)}/></Field>
            <Field label="Gender *">
              <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.gender} onChange={(e)=>upd("gender",e.target.value)}>
                <option value="">Select…</option><option>Male</option><option>Female</option>
              </select>
            </Field>
            <Field label="Phone Number *"><Input type="tel" inputMode="tel" placeholder="+256…" value={f.phone} onChange={(e)=>upd("phone",e.target.value)}/></Field>
            <Field label="Email"><Input type="email" value={f.email} onChange={(e)=>upd("email",e.target.value)}/></Field>
            <Field label="Nationality"><Input value={f.nationality} onChange={(e)=>upd("nationality",e.target.value)}/></Field>
            <Field label="District *"><Input value={f.district} onChange={(e)=>upd("district",e.target.value)}/></Field>
            <Field label="Village / Address"><Input value={f.village} onChange={(e)=>upd("village",e.target.value)}/></Field>
            <Field label="National ID Number (NIN) *" hint="14 characters">
              <Input inputMode="text" maxLength={14} value={f.nin} onChange={(e)=>upd("nin",e.target.value.toUpperCase())}/>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Father Status *">
                <RadioGroup value={f.father_status} onChange={(v)=>upd("father_status",v)} opts={["Alive","Deceased"]}/>
              </Field>
              <Field label="Mother Status *">
                <RadioGroup value={f.mother_status} onChange={(v)=>upd("mother_status",v)} opts={["Alive","Deceased"]}/>
              </Field>
            </div>
            <div className="pt-2 border-t">
              <h3 className="font-semibold mb-3">Next of Kin</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name *"><Input value={f.next_of_kin_name} onChange={(e)=>upd("next_of_kin_name",e.target.value)}/></Field>
                <Field label="Telephone *"><Input type="tel" value={f.next_of_kin_phone} onChange={(e)=>upd("next_of_kin_phone",e.target.value)}/></Field>
                <Field label="Relationship *"><Input placeholder="e.g. Brother, Spouse" value={f.next_of_kin_relationship} onChange={(e)=>upd("next_of_kin_relationship",e.target.value)}/></Field>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="Do you have a passport? *">
              <RadioGroup value={f.has_passport} onChange={(v)=>upd("has_passport",v as any)} opts={[{v:"yes",l:"Yes"},{v:"no",l:"No"}]}/>
            </Field>
            {f.has_passport === "yes" && (
              <Field label="Passport Number *"><Input value={f.passport_number} onChange={(e)=>upd("passport_number",e.target.value.toUpperCase())}/></Field>
            )}
            {f.has_passport === "no" && (
              <FeeNotice
                title="Passport processing required"
                desc={`Wakatine can process your passport. A fee of UGX ${FEE_PASSPORT.toLocaleString()} will be added to your account after submission.`}
              />
            )}
            <Field label="Upload Passport Photo (optional now)">
              <label className="flex items-center gap-3 p-4 border border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/40">
                <Upload className="w-5 h-5 text-primary"/>
                <span className="text-sm">{passportFile ? passportFile.name : "Tap to choose a photo"}</span>
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e)=>setPassportFile(e.target.files?.[0] ?? null)}/>
              </label>
            </Field>

            <div className="pt-2 border-t">
              <Field label="Do you have any issues with your National ID?">
                <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.nin_issue} onChange={(e)=>upd("nin_issue",e.target.value)}>
                  {NIN_ISSUES.map((o)=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </Field>
              {requiresNinFee && (
                <FeeNotice
                  title="NIN assistance required"
                  desc={`Wakatine can help resolve your NIN issue. A fee of UGX ${FEE_NIN.toLocaleString()} will be added to your account after submission.`}
                />
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Field label="Desired Job in UAE *">
              <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={f.desired_job} onChange={(e)=>upd("desired_job",e.target.value)}>
                <option value="">Select a job…</option>
                {UAE_JOBS.map((j)=><option key={j} value={j}>{j}</option>)}
              </select>
            </Field>
            <Field label="Salary Expectation (UGX/month) *">
              <Input type="number" inputMode="numeric" value={f.salary_expectation_ugx} onChange={(e)=>upd("salary_expectation_ugx",e.target.value)} placeholder="e.g. 1500000"/>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Review & Submit</h3>
            <Review label="Full Name" v={f.full_name}/>
            <Review label="Phone" v={f.phone}/>
            <Review label="NIN" v={f.nin}/>
            <Review label="District / Village" v={`${f.district} ${f.village ? `· ${f.village}` : ""}`}/>
            <Review label="Next of Kin" v={`${f.next_of_kin_name} (${f.next_of_kin_relationship}) — ${f.next_of_kin_phone}`}/>
            <Review label="Passport" v={f.has_passport === "yes" ? `Yes — ${f.passport_number}` : "No (processing required)"}/>
            <Review label="Desired Job" v={f.desired_job}/>
            <Review label="Salary" v={f.salary_expectation_ugx ? `UGX ${Number(f.salary_expectation_ugx).toLocaleString()}` : "—"}/>
            <Review label="NIN Issue" v={NIN_ISSUES.find((x)=>x.v===f.nin_issue)?.l ?? "—"}/>

            {(requiresPassportFee || requiresNinFee) && (
              <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
                <div className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning"/>Fees to be added</div>
                <ul className="text-sm space-y-1">
                  {requiresPassportFee && <li>• Passport processing — UGX {FEE_PASSPORT.toLocaleString()}</li>}
                  {requiresNinFee && <li>• NIN assistance — UGX {FEE_NIN.toLocaleString()}</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" disabled={step===0} onClick={()=>setStep((s)=>Math.max(0,s-1))}>
            <ChevronLeft className="w-4 h-4 mr-1"/>Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} className="bg-gradient-primary">Save & Continue <ChevronRight className="w-4 h-4 ml-1"/></Button>
          ) : (
            <Button onClick={submit} disabled={loading} className="bg-gradient-primary">
              <CheckCircle2 className="w-4 h-4 mr-1"/>{loading?"Submitting…":"Submit Application"}
            </Button>
          )}
        </div>
        {savedId && <div className="text-xs text-muted-foreground mt-3">✓ Draft saved automatically</div>}
      </Card>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function RadioGroup({ value, onChange, opts }: { value: string; onChange: (v: string)=>void; opts: (string | { v: string; l: string })[] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {opts.map((o) => {
        const v = typeof o === "string" ? o : o.v;
        const l = typeof o === "string" ? o : o.l;
        const active = value === v;
        return (
          <button key={v} type="button" onClick={()=>onChange(v)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${active?"border-primary bg-primary/10 text-primary":"border-input hover:bg-muted"}`}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

function FeeNotice({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5"/>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function Review({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border/50 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{v || <Badge variant="secondary">Not set</Badge>}</span>
    </div>
  );
}