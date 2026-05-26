import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — Wakatine" }, { name: "description", content: "Frequently asked questions about working in the UAE through Wakatine." }] }),
  component: FAQ,
});

const Q = [
  { q: "Is Wakatine a licensed recruitment agency?", a: "Yes. We are licensed by the Uganda Ministry of Gender, Labour & Social Development." },
  { q: "Do I need a passport to apply?", a: "No. You can start your application without a passport. Wakatine can process one for you for a service fee of UGX 350,000." },
  { q: "What if I have problems with my National ID?", a: "We can help with lost IDs, wrong information, or renewals. A NIN assistance fee of UGX 150,000 applies." },
  { q: "How much do I pay in total?", a: "Registration is free. You only pay verified processing fees as your application progresses — no hidden charges." },
  { q: "How long does the process take?", a: "Typically 2–6 months from application to deployment, depending on the role and visa processing." },
  { q: "What jobs are available in the UAE?", a: "Cleaner, security guard, driver, house maid, hotel staff, construction, caregiver, salon worker and more." },
  { q: "Will I have a contract?", a: "Yes. All Wakatine placements include a written contract with salary, hours and benefits clearly stated." },
  { q: "Can I track my application?", a: "Yes — log in to your dashboard any time to see your stage, payments and notifications." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <PublicLayout>
      <section className="bg-gradient-hero text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-white/85">Everything you need to know before applying.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 max-w-3xl space-y-3">
        {Q.map((item, i) => (
          <Card key={i} className="overflow-hidden">
            <button onClick={()=>setOpen(open===i?null:i)} className="w-full p-5 flex justify-between items-center text-left hover:bg-muted/30">
              <span className="font-semibold pr-3">{item.q}</span>
              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open===i?"rotate-180":""}`}/>
            </button>
            {open===i && <div className="px-5 pb-5 text-muted-foreground">{item.a}</div>}
          </Card>
        ))}
      </section>
    </PublicLayout>
  );
}