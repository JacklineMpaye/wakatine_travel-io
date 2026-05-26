import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FolderOpen, CreditCard, Bell, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

const STATUS_LABEL: Record<string, string> = {
  registration_submitted: "Registration", documents_pending: "Docs Pending", documents_verified: "Docs Verified",
  interview_scheduled: "Interview Scheduled", interview_passed: "Interview Passed", medical_check_pending: "Medical",
  visa_processing: "Visa Processing", visa_approved: "Visa Approved", flight_scheduled: "Flight Scheduled", deployed_abroad: "Deployed", rejected: "Rejected",
};

function Dashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [apps, docs, pays, notif, profile] = await Promise.all([
        supabase.from("applications").select("*, jobs(title, country)").eq("applicant_id", user.id).order("created_at", { ascending: false }),
        supabase.from("documents").select("*").eq("user_id", user.id),
        supabase.from("payments").select("*").eq("user_id", user.id),
        supabase.from("notifications").select("*").eq("user_id", user.id).eq("read", false),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      return { apps: apps.data ?? [], docs: docs.data ?? [], pays: pays.data ?? [], notif: notif.data ?? [], profile: profile.data };
    },
    enabled: !!user,
  });

  const profileFields = data?.profile ? [data.profile.full_name, data.profile.phone, data.profile.date_of_birth, data.profile.address, data.profile.profession].filter(Boolean).length : 0;
  const profilePct = Math.round((profileFields / 5) * 100);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Welcome back{data?.profile?.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""} 👋</h1>
        <p className="text-muted-foreground">Here's your overseas employment journey at a glance.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { i: Briefcase, l: "Applications", v: data?.apps.length ?? 0, c: "from-purple-500 to-pink-500" },
          { i: FolderOpen, l: "Documents", v: data?.docs.length ?? 0, c: "from-blue-500 to-cyan-500" },
          { i: CreditCard, l: "Payments", v: data?.pays.length ?? 0, c: "from-emerald-500 to-teal-500" },
          { i: Bell, l: "Unread alerts", v: data?.notif.length ?? 0, c: "from-amber-500 to-orange-500" },
        ].map((s) => (
          <Card key={s.l} className="p-5 glass">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center text-white mb-3`}><s.i className="w-5 h-5"/></div>
            <div className="text-3xl font-bold">{s.v}</div>
            <div className="text-sm text-muted-foreground">{s.l}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div><h2 className="font-bold text-lg">Profile completion</h2><p className="text-sm text-muted-foreground">Complete your profile to be matched faster.</p></div>
          <Link to="/profile"><Button size="sm" variant="outline">Edit Profile <ArrowRight className="w-4 h-4 ml-1"/></Button></Link>
        </div>
        <Progress value={profilePct}/>
        <div className="text-sm mt-2 text-muted-foreground">{profilePct}% complete</div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Your applications</h2>
          <Link to="/apply"><Button size="sm" className="bg-gradient-primary">Continue Application</Button></Link>
        </div>
        {(data?.apps.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-muted-foreground"><Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50"/><p>No applications yet. <Link to="/apply" className="text-primary underline">Start your application →</Link></p></div>
        ) : (
          <div className="space-y-3">{data!.apps.map((a: any) => (
            <div key={a.id} className="flex justify-between items-center p-3 rounded-lg border border-border hover:bg-muted/40">
              <div><div className="font-medium">{a.jobs?.title ?? "Job"}</div><div className="text-sm text-muted-foreground">{a.jobs?.country}</div></div>
              <Badge variant="secondary">{STATUS_LABEL[a.status]}</Badge>
            </div>
          ))}</div>
        )}
      </Card>
    </div>
  );
}
