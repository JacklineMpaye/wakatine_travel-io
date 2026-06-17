import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Eye, EyeOff, Plus, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/forms")({ component: AdminForms });

const CATEGORIES = [
  { v: "medical",    l: "Medical" },
  { v: "legal",      l: "Legal" },
  { v: "employment", l: "Employment" },
  { v: "travel",     l: "Travel" },
  { v: "general",    l: "General" },
];

function AdminForms() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState({ title: "", description: "", category: "medical" });
  const [file, setFile] = useState<File | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["admin-form-templates"],
    queryFn: async () =>
      (await supabase.from("form_templates").select("*").order("category").order("created_at", { ascending: false })).data ?? [],
  });

  const upload = async () => {
    if (!f.title.trim()) return toast.error("Title is required");
    if (!file)           return toast.error("Please select a file");
    setUploading(true);
    const path = `${f.category}/${Date.now()}-${file.name}`;
    const { error: storErr } = await supabase.storage.from("form-templates").upload(path, file);
    if (storErr) { setUploading(false); return toast.error(storErr.message); }
    const { error } = await supabase.from("form_templates").insert({
      title:       f.title.trim(),
      description: f.description.trim() || null,
      category:    f.category,
      file_path:   path,
      file_name:   file.name,
      file_size:   file.size,
      created_by:  user!.id,
    } as any);
    setUploading(false);
    if (error) {
      await supabase.storage.from("form-templates").remove([path]);
      return toast.error(error.message);
    }
    toast.success("Template uploaded");
    setOpen(false);
    setF({ title: "", description: "", category: "medical" });
    setFile(null);
    qc.invalidateQueries({ queryKey: ["admin-form-templates"] });
    qc.invalidateQueries({ queryKey: ["form-templates"] });
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("form_templates").update({ is_active: !current } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(current ? "Hidden from applicants" : "Now visible to applicants");
    qc.invalidateQueries({ queryKey: ["admin-form-templates"] });
    qc.invalidateQueries({ queryKey: ["form-templates"] });
  };

  const del = async (id: string, path: string) => {
    if (!confirm("Delete this template permanently?")) return;
    await supabase.storage.from("form-templates").remove([path]);
    await supabase.from("form_templates").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-form-templates"] });
    qc.invalidateQueries({ queryKey: ["form-templates"] });
    toast.success("Deleted");
  };

  const publicUrl = (path: string) =>
    supabase.storage.from("form-templates").getPublicUrl(path).data.publicUrl;

  // Group by category for display
  const grouped = (templates as any[]).reduce<Record<string, any[]>>((acc, t) => {
    const cat = t.category ?? "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin · Forms</div>
          <h1 className="text-3xl font-bold">Form Templates</h1>
          <p className="text-muted-foreground">Upload forms (medical, legal, etc.) that applicants can download and fill in.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary"><Plus className="w-4 h-4 mr-1"/>Upload template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload form template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input
                  placeholder="e.g. Medical Examination Form"
                  value={f.title}
                  onChange={(e) => setF({ ...f, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  placeholder="Brief instructions for the applicant…"
                  value={f.description}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="mt-1 h-10 px-3 rounded-md border border-input bg-background w-full text-sm"
                  value={f.category}
                  onChange={(e) => setF({ ...f, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              <div>
                <Label>File</Label>
                <label className="mt-1 flex items-center gap-3 cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span><Upload className="w-4 h-4 mr-1"/>{file ? "Change file" : "Choose file"}</span>
                  </Button>
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file && (
                    <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                      {file.name} <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                    </span>
                  )}
                </label>
                <p className="text-xs text-muted-foreground mt-1">Accepted: PDF, Word (.doc/.docx), Excel (.xls/.xlsx)</p>
              </div>
              <Button onClick={upload} disabled={uploading} className="bg-gradient-primary w-full">
                {uploading ? "Uploading…" : "Upload template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40"/>
          No templates yet. Click "Upload template" to add the first one.
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary px-1">
              {CATEGORIES.find((c) => c.v === cat)?.l ?? cat}
            </h2>
            <div className="space-y-2">
              {items.map((t: any) => (
                <Card key={t.id} className="p-4 flex items-center gap-4 flex-wrap">
                  <FileText className="w-8 h-8 text-primary shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex flex-wrap items-center gap-2">
                      {t.title}
                      <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">
                        {t.is_active ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                    {t.description && (
                      <div className="text-sm text-muted-foreground mt-0.5">{t.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.file_name}
                      {t.file_size ? ` · ${(t.file_size / 1024).toFixed(1)} KB` : ""}
                      {" · "}Uploaded {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={publicUrl(t.file_path)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3.5 h-3.5 mr-1"/>Preview
                      </Button>
                    </a>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(t.id, t.is_active)}>
                      {t.is_active
                        ? <><EyeOff className="w-3.5 h-3.5 mr-1"/>Hide</>
                        : <><Eye    className="w-3.5 h-3.5 mr-1"/>Show</>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del(t.id, t.file_path)}>
                      <Trash2 className="w-4 h-4 text-destructive"/>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
