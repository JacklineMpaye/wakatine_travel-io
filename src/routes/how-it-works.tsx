import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ClipboardList, FileCheck, CreditCard, Plane, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How It Works — Wakatine" }, { name: "description", content: "From signup to UAE deployment in six simple steps." }] }),
  component: HIW,
});

const STEPS = [
  { i: UserPlus, t: "Create your account", d: "Sign up with your phone or email in under a minute." },
  { i: ClipboardList, t: "Fill the application", d: "Multi-step form: personal info, family, passport, NIN and job choice." },
  { i: FileCheck, t: "Document review", d: "Our team verifies your NIN, passport and supporting documents." },
  { i: CreditCard, t: "Pay processing fees", d: "Only verified, transparent fees for passport, NIN, recruitment processing." },
  { i: ShieldCheck, t: "Interview & medicals", d: "We schedule UAE employer interviews and your medical check-up." },
  { i: Plane, t: "Visa & deployment", d: "Visa processing, flight booking and arrival support in the UAE." },
];

function HIW() {
  return (
    <PublicLayout>
      <section className="bg-gradient-hero text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">How It Works</h1>
          <p className="text-white/85">From signup to UAE deployment, every step explained.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid sm:grid-cols-2 gap-5">
          {STEPS.map((s, i) => (
            <Card key={s.t} className="p-6 relative">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center font-bold shadow-elegant">{i+1}</div>
              <s.i className="w-8 h-8 text-primary mb-3"/>
              <h3 className="font-bold mb-1">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/my-application"><Button size="lg" className="bg-gradient-primary">Start Your Application</Button></Link>
        </div>
      </section>
    </PublicLayout>
  );
}