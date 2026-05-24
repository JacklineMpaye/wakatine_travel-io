import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/payments")({ component: Payments });

function Payments() {
  const { user } = useAuth();
  const { data: pays = [] } = useQuery({
    queryKey: ["pays", user?.id],
    queryFn: async () => (await supabase.from("payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });
  return (
    <div className="max-w-4xl space-y-6">
      <div><h1 className="text-3xl font-bold">Payments</h1><p className="text-muted-foreground">All recruitment fees & receipts.</p></div>
      {pays.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No payments recorded yet. An admin will record them as you progress.</Card> : (
        <div className="grid gap-3">{pays.map((p: any) => (
          <Card key={p.id} className="p-5 flex justify-between flex-wrap gap-3">
            <div>
              <div className="font-bold text-lg">{p.currency} {Number(p.amount).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{p.method ?? "—"} · Ref: {p.reference ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleString()}</div>
            </div>
            <Badge variant={p.status==="paid"||p.status==="verified"?"default":p.status==="overdue"?"destructive":"secondary"}>{p.status}</Badge>
          </Card>
        ))}</div>
      )}
    </div>
  );
}
