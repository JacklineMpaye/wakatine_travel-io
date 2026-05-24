import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({ component: Notifications });

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["notif", user?.id],
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });
  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notif"] });
  };
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Notifications</h1><p className="text-muted-foreground">Status, payment & interview alerts.</p></div><Button variant="outline" onClick={markAll}><CheckCheck className="w-4 h-4 mr-2"/>Mark all read</Button></div>
      {items.length === 0 ? <Card className="p-10 text-center text-muted-foreground"><Bell className="w-10 h-10 mx-auto mb-2 opacity-50"/>You're all caught up.</Card> : items.map((n: any) => (
        <Card key={n.id} className={`p-4 ${!n.read ? "border-primary/50 bg-primary/5" : ""}`}>
          <div className="flex justify-between gap-3">
            <div><div className="font-semibold">{n.title}</div><div className="text-sm text-muted-foreground">{n.message}</div></div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(n.created_at).toLocaleString()}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
