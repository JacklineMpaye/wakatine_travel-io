import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/applications")({ component: Applications });

const STAGES = [
  "registration_submitted","documents_pending","documents_verified","interview_scheduled",
  "interview_passed","medical_check_pending","visa_processing","visa_approved","flight_scheduled","deployed_abroad",
];
const LABEL: Record<string,string> = {
  registration_submitted:"Registration Submitted", documents_pending:"Documents Pending", documents_verified:"Documents Verified",
  interview_scheduled:"Interview Scheduled", interview_passed:"Interview Passed", medical_check_pending:"Medical Check",
  visa_processing:"Visa Processing", visa_approved:"Visa Approved", flight_scheduled:"Flight Scheduled", deployed_abroad:"Deployed Abroad",
};

function Applications() {
  const { user } = useAuth();
  const { data: apps = [] } = useQuery({
    queryKey: ["my-apps", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("*, jobs(title, country, employer)").eq("applicant_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div><h1 className="text-3xl font-bold">My Applications</h1><p className="text-muted-foreground">Track every stage of your journey.</p></div>
      {apps.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No applications yet.</Card> : apps.map((a: any) => {
        const idx = STAGES.indexOf(a.status);
        return (
          <Card key={a.id} className="p-6">
            <div className="flex justify-between flex-wrap gap-2 mb-4">
              <div><h2 className="text-xl font-bold">{a.jobs?.title}</h2><div className="text-sm text-muted-foreground">{a.jobs?.employer} · {a.jobs?.country}</div></div>
              <Badge className="bg-gradient-primary text-primary-foreground">{LABEL[a.status]}</Badge>
            </div>
            <div className="space-y-1">
              {STAGES.map((s, i) => {
                const done = i < idx, current = i === idx;
                return (
                  <div key={s} className={`flex items-center gap-3 py-1.5 ${done?"text-success":current?"text-primary font-medium":"text-muted-foreground"}`}>
                    {done ? <CheckCircle2 className="w-4 h-4"/> : current ? <Clock className="w-4 h-4 animate-pulse"/> : <Circle className="w-4 h-4"/>}
                    <span className="text-sm">{LABEL[s]}</span>
                  </div>
                );
              })}
            </div>
            {a.admin_notes && <div className="mt-4 p-3 bg-muted rounded-lg text-sm"><span className="font-medium">Admin notes:</span> {a.admin_notes}</div>}
          </Card>
        );
      })}
    </div>
  );
}
