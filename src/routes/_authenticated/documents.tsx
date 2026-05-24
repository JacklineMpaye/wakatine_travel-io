import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/documents")({ component: Documents });

const TYPES = [
  { v: "passport", l: "Passport" },
  { v: "cv", l: "CV / Resume" },
  { v: "national_id", l: "National ID" },
  { v: "passport_photo", l: "Passport Photo" },
  { v: "medical", l: "Medical Report" },
] as const;

function Documents() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [type, setType] = useState<string>("passport");
  const [uploading, setUploading] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["docs", user?.id],
    queryFn: async () => (await supabase.from("documents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${type}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("applicant-documents").upload(path, file);
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { error } = await supabase.from("documents").insert({ user_id: user.id, type: type as any, file_path: path, file_name: file.name });
    setUploading(false);
    e.target.value = "";
    if (error) return toast.error(error.message);
    toast.success("Document uploaded");
    qc.invalidateQueries({ queryKey: ["docs"] });
  };

  const del = async (id: string, path: string) => {
    await supabase.storage.from("applicant-documents").remove([path]);
    await supabase.from("documents").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["docs"] });
    toast.success("Deleted");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div><h1 className="text-3xl font-bold">Documents</h1><p className="text-muted-foreground">Upload your passport, CV, ID, photo and medicals.</p></div>
      <Card className="p-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium block mb-1">Document type</label>
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={type} onChange={(e)=>setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>
          <label className="cursor-pointer">
            <Button asChild disabled={uploading} className="bg-gradient-primary">
              <span><Upload className="w-4 h-4 mr-2"/>{uploading?"Uploading…":"Upload file"}</span>
            </Button>
            <input type="file" hidden onChange={upload} accept="image/*,application/pdf" />
          </label>
        </div>
      </Card>
      <div className="grid gap-3">
        {docs.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No documents uploaded yet.</Card> : docs.map((d: any) => (
          <Card key={d.id} className="p-4 flex items-center gap-4">
            <FileText className="w-8 h-8 text-primary"/>
            <div className="flex-1">
              <div className="font-medium">{TYPES.find((t)=>t.v===d.type)?.l ?? d.type}</div>
              <div className="text-xs text-muted-foreground">{d.file_name}</div>
            </div>
            <Badge variant={d.status==="verified"?"default":d.status==="rejected"?"destructive":"secondary"}>{d.status}</Badge>
            <Button size="icon" variant="ghost" onClick={()=>del(d.id, d.file_path)}><Trash2 className="w-4 h-4"/></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
