import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, DollarSign, Calendar, Briefcase, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/jobs/$jobId")({ component: JobDetail });

function JobDetail() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cover, setCover] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      if (error) throw error;
      return data;
    },
  });
  const apply = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({ applicant_id: user.id, job_id: jobId, cover_letter: cover });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted!");
    navigate({ to: "/dashboard" });
  };
  if (isLoading) return <PublicLayout><div className="container mx-auto px-4 py-10">Loading…</div></PublicLayout>;
  if (!job) return <PublicLayout><div className="container mx-auto px-4 py-10">Job not found.</div></PublicLayout>;
  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-10">
        <Link to="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="w-4 h-4 mr-1"/>Back to jobs</Link>
        <Card className="p-8">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div><h1 className="text-3xl font-bold mb-2">{job.title}</h1><div className="text-muted-foreground">{job.employer ?? "Verified Employer"}</div></div>
            <Badge className="bg-gradient-primary text-primary-foreground">{(job.employment_type ?? "full_time").replace("_"," ")}</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/>{job.city?`${job.city}, `:""}{job.country}</span>
            {job.salary_min && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4"/>{job.currency} {job.salary_min}{job.salary_max?` - ${job.salary_max}`:""}</span>}
            {job.deadline && <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/>{new Date(job.deadline).toLocaleDateString()}</span>}
            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4"/>{job.slots} slot(s)</span>
          </div>
          <h3 className="font-bold text-lg mb-2">Job Description</h3>
          <p className="whitespace-pre-wrap text-foreground/90 mb-4">{job.description}</p>
          {job.requirements && (<><h3 className="font-bold text-lg mt-4 mb-2">Requirements</h3><p className="whitespace-pre-wrap text-foreground/90">{job.requirements}</p></>)}
          <div className="border-t border-border pt-6 mt-6">
            <h3 className="font-bold text-lg mb-2">Apply for this role</h3>
            <Textarea rows={5} placeholder="Cover letter (optional)" value={cover} onChange={(e)=>setCover(e.target.value)} />
            <Button className="mt-3 bg-gradient-primary" onClick={apply} disabled={submitting}>{submitting?"Submitting…":user?"Submit Application":"Sign in to Apply"}</Button>
          </div>
        </Card>
      </section>
    </PublicLayout>
  );
}
