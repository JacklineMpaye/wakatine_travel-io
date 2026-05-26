import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(5).max(2000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Us — Wakatine" }, { name: "description", content: "Get in touch with Wakatine in Kampala." }] }),
  component: Contact,
});

function Contact() {
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(p.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Message sent!");
    setF({ name: "", email: "", phone: "", subject: "", message: "" });
  };
  return (
    <PublicLayout>
      <section className="bg-gradient-hero text-white py-16"><div className="container mx-auto px-4"><h1 className="text-4xl md:text-5xl font-bold mb-3">Get in Touch</h1><p className="text-white/85">We reply within one business day.</p></div></section>
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[{i:MapPin,t:"Visit",d:"Plot 24, Kampala Road, Kampala"},{i:Phone,t:"Call",d:"+256 700 000 000"},{i:Mail,t:"Email",d:"info@wakatine.ug"}].map((c)=>(
            <Card key={c.t} className="p-5 flex gap-4"><c.i className="w-6 h-6 text-primary shrink-0"/><div><div className="font-semibold">{c.t}</div><div className="text-sm text-muted-foreground">{c.d}</div></div></Card>
          ))}
        </div>
        <Card className="p-6 md:col-span-2">
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={f.name} onChange={(e)=>setF({...f,name:e.target.value})} required /></div>
            <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e)=>setF({...f,email:e.target.value})} required /></div>
            <div><Label>Phone</Label><Input value={f.phone} onChange={(e)=>setF({...f,phone:e.target.value})} /></div>
            <div><Label>Subject</Label><Input value={f.subject} onChange={(e)=>setF({...f,subject:e.target.value})} /></div>
            <div className="sm:col-span-2"><Label>Message</Label><Textarea rows={5} value={f.message} onChange={(e)=>setF({...f,message:e.target.value})} required /></div>
            <div className="sm:col-span-2"><Button type="submit" disabled={loading} className="bg-gradient-primary">{loading?"Sending…":"Send Message"}</Button></div>
          </form>
        </Card>
      </section>
    </PublicLayout>
  );
}
