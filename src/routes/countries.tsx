import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { COUNTRIES } from "@/lib/countries";

export const Route = createFileRoute("/countries")({
  head: () => ({ meta: [{ title: "Countries — Wakatine" }, { name: "description", content: "Countries we place Ugandan workers in." }] }),
  component: () => (
    <PublicLayout>
      <section className="bg-gradient-hero text-white py-16"><div className="container mx-auto px-4"><h1 className="text-4xl md:text-5xl font-bold mb-3">Countries We Place Workers In</h1><p className="text-white/85">Vetted employers across 6 high-demand destinations.</p></div></section>
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 gap-6">
        {COUNTRIES.map((c) => (
          <Card key={c.code} className="p-8 hover:shadow-elegant transition-all">
            <div className="flex items-start gap-4 mb-4"><div className="text-6xl">{c.flag}</div><div><h2 className="text-2xl font-bold">{c.name}</h2><div className="text-primary font-medium">{c.averageSalary}</div></div></div>
            <p className="text-muted-foreground mb-4">{c.blurb}</p>
            <div className="flex flex-wrap gap-2 mb-4">{c.topJobs.map((j) => <Badge key={j} variant="secondary">{j}</Badge>)}</div>
            <Link to="/jobs"><Button variant="outline">See jobs</Button></Link>
          </Card>
        ))}
      </section>
    </PublicLayout>
  ),
});
