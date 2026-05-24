import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Globe, Heart, Award } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — PearlBridge Recruitment" },
      { name: "description", content: "Licensed Ugandan overseas recruitment agency with a decade of experience placing workers in the Gulf, UK, Canada and USA." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PublicLayout>
      <section className="bg-gradient-hero text-white py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">About PearlBridge</h1>
          <p className="text-xl text-white/85 max-w-2xl">A licensed Ugandan agency built to make overseas employment safe, transparent, and life-changing.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground mb-4">We exist to connect skilled and semi-skilled Ugandans with verified overseas employers — without the broker chaos, hidden fees, or visa risks.</p>
          <p className="text-muted-foreground">Every applicant gets a digital file, a status tracker, and human support from the moment they apply to the moment they board.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { i: ShieldCheck, t: "Licensed", d: "Reg. by MoGLSD" },
            { i: Globe, t: "12 Countries", d: "Active partners" },
            { i: Heart, t: "5,200+", d: "Workers placed" },
            { i: Award, t: "98%", d: "Visa success rate" },
          ].map((s) => (
            <Card key={s.t} className="p-5 text-center">
              <s.i className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="font-bold">{s.t}</div>
              <div className="text-xs text-muted-foreground">{s.d}</div>
            </Card>
          ))}
        </div>
      </section>
      <section className="bg-secondary/40 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: "Transparency", d: "Clear fees. Clear timelines. No hidden surprises." },
              { t: "Worker safety", d: "We only partner with vetted, ethical employers." },
              { t: "Long-term support", d: "We stay with you even after deployment." },
            ].map((v) => (
              <Card key={v.t} className="p-6">
                <h3 className="font-bold text-lg mb-2">{v.t}</h3>
                <p className="text-muted-foreground text-sm">{v.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}