import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COUNTRIES } from "@/lib/countries";
import { Plane, ShieldCheck, Users, CheckCircle2, ArrowRight, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PearlBridge — Get Jobs Abroad from Uganda" },
      { name: "description", content: "Licensed Ugandan recruitment agency. Apply for verified jobs in UAE, Qatar, Saudi Arabia, UK, Canada, and USA." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative container mx-auto px-4 py-24 md:py-32 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-sm mb-6">
              <ShieldCheck className="w-4 h-4" /> Licensed by Uganda Ministry of Gender, Labour & Social Development
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
              Your bridge to a <span className="block bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #fff, #f8c8ff)" }}>career abroad.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 mb-8 max-w-2xl">
              Trusted overseas placements for Ugandans in the Gulf, UK, Canada and USA — from application to deployment.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/jobs"><Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elegant">Browse Jobs <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
              <Link to="/signup"><Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">Start Application</Button></Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-xl">
              {[{ n: "5,200+", l: "Deployed" }, { n: "12", l: "Countries" }, { n: "98%", l: "Visa Success" }].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl md:text-4xl font-bold">{s.n}</div>
                  <div className="text-sm text-white/70">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COUNTRIES */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Where Ugandans are working</h2>
            <p className="text-muted-foreground">Verified employers across 6 high-demand destinations.</p>
          </div>
          <Link to="/countries"><Button variant="ghost">View all <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COUNTRIES.map((c) => (
            <Card key={c.code} className="p-6 hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer group">
              <div className="text-5xl mb-3">{c.flag}</div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{c.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{c.blurb}</p>
              <div className="text-sm font-medium text-primary">{c.averageSalary}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary/40 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { i: Users, t: "Register", d: "Create your profile in 5 minutes." },
              { i: CheckCircle2, t: "Verify", d: "Upload passport, CV, ID, medicals." },
              { i: ShieldCheck, t: "Match", d: "We match you to vetted employers." },
              { i: Plane, t: "Deploy", d: "Visa processing, flights, arrival support." },
            ].map((s, i) => (
              <Card key={s.t} className="p-6 relative">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center font-bold shadow-elegant">{i + 1}</div>
                <s.i className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold text-lg mb-1">{s.t}</h3>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Real Ugandans. Real placements.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "Sarah N.", r: "Caregiver in UK", q: "PearlBridge handled everything — from my CV polish to my flight. I'm now sending money home every month." },
            { n: "James O.", r: "Security in UAE", q: "Within 4 months of registering I was in Dubai. The status tracker kept me informed every step." },
            { n: "Aisha K.", r: "Nurse in Saudi Arabia", q: "Professional, transparent fees, and they truly care. Highly recommend." },
          ].map((t) => (
            <Card key={t.n} className="p-6 glass">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-warning text-warning" />)}</div>
              <p className="text-foreground/90 mb-4 italic">"{t.q}"</p>
              <div>
                <div className="font-semibold">{t.n}</div>
                <div className="text-sm text-muted-foreground">{t.r}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <Card className="p-10 md:p-16 text-center text-white relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to work abroad?</h2>
          <p className="text-white/85 mb-6 max-w-xl mx-auto">Free registration. Pay only when matched. Verified employers only.</p>
          <Link to="/signup"><Button size="lg" className="bg-white text-primary hover:bg-white/90">Start Your Application</Button></Link>
        </Card>
      </section>
    </PublicLayout>
  );
}
