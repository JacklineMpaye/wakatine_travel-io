import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Briefcase, MapPin, Calendar, DollarSign, Search } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

export const Route = createFileRoute("/jobs")({
  head: () => ({ meta: [{ title: "Jobs Abroad — PearlBridge" }, { name: "description", content: "Verified overseas jobs for Ugandans." }] }),
  component: JobsPage,
});

function JobsPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("all");
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const filtered = jobs.filter((j) => (country === "all" || j.country === country) && (q === "" || j.title.toLowerCase().includes(q.toLowerCase())));
  return (
    <PublicLayout>
      <section className="bg-gradient-hero text-white py-16"><div className="container mx-auto px-4"><h1 className="text-4xl md:text-5xl font-bold mb-3">Open Positions</h1><p className="text-white/85">Verified jobs from licensed overseas employers.</p></div></section>
      <section className="container mx-auto px-4 py-10">
        <Card className="p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"/><Input className="pl-9" placeholder="Search…" value={q} onChange={(e)=>setQ(e.target.value)} /></div>
          <select className="h-9 px-3 rounded-md border border-input bg-background text-sm" value={country} onChange={(e)=>setCountry(e.target.value)}>
            <option value="all">All countries</option>
            {COUNTRIES.map((c)=><option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
          </select>
        </Card>
        {isLoading ? <p>Loading…</p> : filtered.length === 0 ? (
          <Card className="p-12 text-center"><Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3"/><h3 className="font-bold text-lg mb-1">No jobs yet</h3><p className="text-muted-foreground text-sm">Admins can post jobs from the admin dashboard. Check back soon.</p></Card>
        ) : (
          <div className="grid gap-4">{filtered.map((j)=>(
            <Card key={j.id} className="p-6 hover:shadow-elegant transition-all">
              <div className="flex justify-between flex-wrap gap-4">
                <div>
                  <Link to="/jobs/$jobId" params={{ jobId: j.id }} className="text-xl font-bold hover:text-primary">{j.title}</Link>
                  <div className="text-sm text-muted-foreground">{j.employer ?? "Verified Employer"}</div>
                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/>{j.city?`${j.city}, `:""}{j.country}</span>
                    {j.salary_min && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4"/>{j.currency} {j.salary_min}{j.salary_max?` - ${j.salary_max}`:""}</span>}
                    {j.deadline && <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/>{new Date(j.deadline).toLocaleDateString()}</span>}
                    <Badge variant="secondary">{j.employment_type.replace("_"," ")}</Badge>
                  </div>
                </div>
                <Link to="/jobs/$jobId" params={{ jobId: j.id }}><Button className="bg-gradient-primary">View & Apply</Button></Link>
              </div>
            </Card>
          ))}</div>
        )}
      </section>
    </PublicLayout>
  );
}
