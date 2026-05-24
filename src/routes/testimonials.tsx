import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
const stories = [
  { n: "Sarah Namutebi", r: "Caregiver, Manchester UK", q: "Within 6 months I was working in the UK. The team supported me through visa interviews." },
  { n: "James Okello", r: "Security, Dubai UAE", q: "I came from Gulu with nothing but ambition. Today I send school fees home every month." },
  { n: "Aisha Kabugo", r: "Nurse, Riyadh KSA", q: "Professional, honest, very supportive. Contract renewing for a 3rd year." },
  { n: "Peter Ssebuliba", r: "Truck Driver, Toronto", q: "From Kampala to Canada in 9 months. The status tracker was a lifesaver." },
  { n: "Mariam Nakato", r: "Hospitality, Doha", q: "Best decision I ever made. PearlBridge is genuine." },
  { n: "David Mugisha", r: "Farm Worker, Texas USA", q: "Seasonal H-2A program. I'm going back next season." },
];
export const Route = createFileRoute("/testimonials")({
  head: () => ({ meta: [{ title: "Success Stories — PearlBridge" }, { name: "description", content: "Real Ugandans now working abroad." }] }),
  component: () => (
    <PublicLayout>
      <section className="bg-gradient-hero text-white py-16"><div className="container mx-auto px-4"><h1 className="text-4xl md:text-5xl font-bold mb-3">Success Stories</h1><p className="text-white/85">Ugandans whose lives changed when they took the leap.</p></div></section>
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
        {stories.map((s) => (
          <Card key={s.n} className="p-6">
            <div className="flex mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-warning text-warning" />)}</div>
            <p className="italic text-foreground/90 mb-4">"{s.q}"</p>
            <div className="font-semibold">{s.n}</div><div className="text-sm text-muted-foreground">{s.r}</div>
          </Card>
        ))}
      </section>
    </PublicLayout>
  ),
});
