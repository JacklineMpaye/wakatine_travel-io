import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/payments")({ component: Payments });

function Payments() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["pays", user?.id],
    queryFn: async () => {
      const [pays, inv] = await Promise.all([
        supabase.from("payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      ]);
      return { pays: pays.data ?? [], invoices: inv.data ?? [] };
    },
    enabled: !!user,
  });
  const invoices = data?.invoices ?? [];
  const pays = data?.pays ?? [];
  const outstanding = invoices.filter((i: any) => Number(i.balance) > 0 && i.status !== "cancelled");
  const totalOwed = outstanding.reduce((s: number, i: any) => s + Number(i.balance), 0);
  return (
    <div className="max-w-4xl space-y-6">
      <div><h1 className="text-3xl font-bold">Payments</h1><p className="text-muted-foreground">All recruitment fees, outstanding balances and receipts.</p></div>

      {totalOwed > 0 && (
        <Card className="p-5 border-destructive/40 bg-destructive/5">
          <div className="text-xs uppercase tracking-widest text-destructive font-semibold mb-1">Outstanding balance</div>
          <div className="text-3xl font-bold">UGX {totalOwed.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground mt-1">Please clear pending invoices at the Wakatine office.</p>
        </Card>
      )}

      <section>
        <h2 className="font-bold text-lg mb-2">Invoices</h2>
        {invoices.length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground">No invoices issued yet.</Card> : (
          <div className="grid gap-3">{invoices.map((i: any) => (
            <Card key={i.id} className="p-4 flex justify-between flex-wrap gap-3">
              <div>
                <div className="font-semibold">{i.invoice_number} · {i.service}</div>
                <div className="text-sm text-muted-foreground">Due UGX {Number(i.amount_due).toLocaleString()} · Paid UGX {Number(i.amount_paid).toLocaleString()}</div>
                {Number(i.balance) > 0 && <div className="text-xs text-destructive mt-1">Balance UGX {Number(i.balance).toLocaleString()}</div>}
              </div>
              <Badge variant={i.status==="paid"?"default":i.status==="cancelled"?"outline":i.status==="partial"?"secondary":"destructive"}>
                {i.status === "unpaid" ? "Pending" : i.status === "partial" ? "Partially Paid" : i.status === "paid" ? "Fully Paid" : "Cancelled"}
              </Badge>
            </Card>
          ))}</div>
        )}
      </section>

      <section>
        <h2 className="font-bold text-lg mb-2">Payment history</h2>
        {pays.length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground">No payments recorded yet.</Card> : (
          <div className="grid gap-3">{pays.map((p: any) => (
            <Card key={p.id} className="p-5 flex justify-between flex-wrap gap-3">
              <div>
                <div className="font-bold text-lg">{p.currency} {Number(p.amount).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{p.service_description ?? p.payment_type} · {p.method ?? "—"}{p.reference ? ` · Ref ${p.reference}` : ""}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleString()}</div>
              </div>
              <Badge variant={p.status==="paid"||p.status==="verified"?"default":p.status==="overdue"?"destructive":"secondary"}>
                {p.status === "verified" || p.status === "paid" ? "Paid" : p.status}
              </Badge>
            </Card>
          ))}</div>
        )}
      </section>
    </div>
  );
}
