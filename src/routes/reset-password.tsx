import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Min 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/login" });
  };
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-1">Set new password</h1>
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div><Label>New password</Label><Input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">{loading?"Saving…":"Update Password"}</Button>
          </form>
        </Card>
      </div>
    </PublicLayout>
  );
}
