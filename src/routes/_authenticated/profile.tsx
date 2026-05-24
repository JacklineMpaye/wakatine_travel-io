import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
    enabled: !!user,
  });
  const [f, setF] = useState<any>({});
  useEffect(() => { if (data) setF(data); }, [data]);
  const save = async () => {
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name, phone: f.phone, date_of_birth: f.date_of_birth || null, gender: f.gender,
      address: f.address, profession: f.profession, years_experience: f.years_experience ? Number(f.years_experience) : null,
      education_level: f.education_level,
    }).eq("id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">My Profile</h1>
      <Card className="p-6 grid sm:grid-cols-2 gap-4">
        <div><Label>Full Name</Label><Input value={f.full_name ?? ""} onChange={(e)=>setF({...f,full_name:e.target.value})}/></div>
        <div><Label>Phone</Label><Input value={f.phone ?? ""} onChange={(e)=>setF({...f,phone:e.target.value})}/></div>
        <div><Label>Date of Birth</Label><Input type="date" value={f.date_of_birth ?? ""} onChange={(e)=>setF({...f,date_of_birth:e.target.value})}/></div>
        <div><Label>Gender</Label>
          <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={f.gender ?? ""} onChange={(e)=>setF({...f,gender:e.target.value})}>
            <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </div>
        <div className="sm:col-span-2"><Label>Address</Label><Textarea value={f.address ?? ""} onChange={(e)=>setF({...f,address:e.target.value})}/></div>
        <div><Label>Profession</Label><Input value={f.profession ?? ""} onChange={(e)=>setF({...f,profession:e.target.value})}/></div>
        <div><Label>Years experience</Label><Input type="number" value={f.years_experience ?? ""} onChange={(e)=>setF({...f,years_experience:e.target.value})}/></div>
        <div className="sm:col-span-2"><Label>Education level</Label><Input value={f.education_level ?? ""} onChange={(e)=>setF({...f,education_level:e.target.value})}/></div>
        <div className="sm:col-span-2"><Button onClick={save} className="bg-gradient-primary">Save Changes</Button></div>
      </Card>
    </div>
  );
}
