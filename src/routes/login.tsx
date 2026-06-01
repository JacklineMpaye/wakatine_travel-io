import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — PearlBridge" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    const uid = data.user?.id;
    let isAdmin = false;
    if (uid) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      isAdmin = (roles ?? []).some((r) => r.role === "admin");
    }
    nav({ to: isAdmin ? "/admin" : "/dashboard" });
  };
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your applicant dashboard.</p>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">{loading?"Signing in…":"Sign In"}</Button>
          </form>
          <div className="text-sm mt-4 flex justify-between"><Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link><Link to="/signup" className="text-primary hover:underline">Create account</Link></div>
        </Card>
      </div>
    </PublicLayout>
  );
}
