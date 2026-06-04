import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notifications")({ component: AdminNotif });

function AdminNotif() {
  const qc = useQueryClient();
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles-min"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email").order("full_name")).data ?? [],
  });
  const [target, setTarget] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const send = async () => {
    if (!title || !message) return toast.error("Title and message required");
    const recipients = target === "all" ? profiles.map((p: any) => p.id) : [target];
    const rows = recipients.map((id: string) => ({ user_id: id, title, message }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Sent to ${recipients.length} applicant(s)`);
    setTitle(""); setMessage("");
    qc.invalidateQueries({ queryKey: ["admin-sent-notif"] });
  };
  const { data: sent = [] } = useQuery({
    queryKey: ["admin-sent-notif"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Notifications</div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Broadcast updates to applicants.</p>
      </div>
      <Card className="p-6 space-y-3">
        <div>
          <Label>Recipient</Label>
          <select className="h-10 px-3 rounded-md border border-input bg-background w-full" value={target} onChange={(e)=>setTarget(e.target.value)}>
            <option value="all">All applicants</option>
            {profiles.map((p: any) => <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>)}
          </select>
        </div>
        <div><Label>Title</Label><Input value={title} onChange={(e)=>setTitle(e.target.value)}/></div>
        <div><Label>Message</Label><Textarea rows={3} value={message} onChange={(e)=>setMessage(e.target.value)}/></div>
        <Button onClick={send} className="bg-gradient-primary"><Send className="w-4 h-4 mr-1"/>Send</Button>
      </Card>
      <div>
        <h2 className="font-bold text-lg mb-3">Recent notifications</h2>
        <div className="grid gap-2">
          {sent.map((n: any) => (
            <Card key={n.id} className="p-3">
              <div className="font-semibold text-sm">{n.title}</div>
              <div className="text-sm text-muted-foreground">{n.message}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
