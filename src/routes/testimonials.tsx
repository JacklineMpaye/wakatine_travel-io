import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
const stories = [
  { n: "James Okello", r: "Security Guard, Dubai UAE", q: "I came from Gulu with nothing but ambition. Today I send school fees home every month." },
  { n: "Grace Nabirye", r: "Housemaid, Abu Dhabi UAE", q: "Wakatine handled everything — visa, medical, flight. I arrived safe and started work within days." },
  { n: "Brian Tumwine", r: "Driver, Sharjah UAE", q: "Professional and honest. My contract is for 2 years and they even helped me open a bank account." },
  { n: "Fatuma Nalwoga", r: "Hotel Attendant, Dubai UAE", q: "I was nervous about going abroad alone but the team checked on me every week. Truly grateful." },
  { n: "Ronald Kizza", r: "Kitchen Helper, Abu Dhabi UAE", q: "From application to deployment in 3 months. Everything was transparent — no hidden fees." },
  { n: "Prossy Nakamatte", r: "Caregiver, Dubai UAE", q: "My employer is kind and my salary comes on time. Wakatine matched me perfectly." },
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
