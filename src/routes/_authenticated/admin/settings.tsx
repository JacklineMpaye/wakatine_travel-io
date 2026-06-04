import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Settings</div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Administrator account and platform settings.</p>
      </div>
      <Card className="p-6 space-y-2">
        <h2 className="font-bold text-lg">Account</h2>
        <div className="text-sm"><span className="text-muted-foreground">Email:</span> {user?.email}</div>
        <div className="text-sm"><span className="text-muted-foreground">User ID:</span> <code className="text-xs">{user?.id}</code></div>
        <div className="text-sm"><span className="text-muted-foreground">Role:</span> <span className="text-primary font-semibold">Administrator</span></div>
      </Card>
      <Card className="p-6 space-y-2">
        <h2 className="font-bold text-lg">Company</h2>
        <div className="text-sm">Wakatine Tours & Travel Company Limited</div>
        <div className="text-sm text-muted-foreground">Iganga, behind Stanbic Bank · +256 789 431 312 · +256 740 052 907</div>
      </Card>
    </div>
  );
}
