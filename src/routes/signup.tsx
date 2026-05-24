import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Apply Now — PearlBridge" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [f, setF] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: f.full_name, phone: f.phone } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! Check your email to verify.");
    nav({ to: "/login" });
  };
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-1">Start your application</h1>
          <p className="text-sm text-muted-foreground mb-6">Free to register. Takes 2 minutes.</p>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Full Name</Label><Input required value={f.full_name} onChange={(e)=>setF({...f,full_name:e.target.value})} /></div>
            <div><Label>Email</Label><Input type="email" required value={f.email} onChange={(e)=>setF({...f,email:e.target.value})} /></div>
            <div><Label>Phone (+256…)</Label><Input required value={f.phone} onChange={(e)=>setF({...f,phone:e.target.value})} /></div>
            <div><Label>Password</Label><Input type="password" required value={f.password} onChange={(e)=>setF({...f,password:e.target.value})} /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">{loading?"Creating…":"Create Account"}</Button>
          </form>
          <p className="text-sm mt-4 text-center text-muted-foreground">Have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
        </Card>
      </div>
    </PublicLayout>
  );
}
