import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/forms")({ component: Forms });

const CATEGORY_LABELS: Record<string, string> = {
  medical:    "Medical",
  legal:      "Legal",
  employment: "Employment",
  travel:     "Travel",
  general:    "General",
};

function Forms() {
  const { data: templates = [] } = useQuery({
    queryKey: ["form-templates"],
    queryFn: async () =>
      (await supabase
        .from("form_templates")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("title")
      ).data ?? [],
  });

  const publicUrl = (path: string) =>
    supabase.storage.from("form-templates").getPublicUrl(path).data.publicUrl;

  const grouped = (templates as any[]).reduce<Record<string, any[]>>((acc, t) => {
    const cat = t.category ?? "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Form Templates</h1>
        <p className="text-muted-foreground">
          Download and complete these forms, then upload the filled copies in the{" "}
          <a href="/documents" className="text-primary underline">Documents</a> section.
        </p>
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40"/>
          No forms available yet. Check back soon.
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary px-1">
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <div className="grid gap-3">
              {items.map((t: any) => (
                <Card key={t.id} className="p-4 flex items-center gap-4">
                  <FileText className="w-8 h-8 text-primary shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{t.title}</div>
                    {t.description && (
                      <div className="text-sm text-muted-foreground mt-0.5">{t.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.file_name}
                      {t.file_size ? ` · ${(t.file_size / 1024).toFixed(1)} KB` : ""}
                    </div>
                  </div>
                  <a
                    href={publicUrl(t.file_path)}
                    download={t.file_name}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" className="bg-gradient-primary shrink-0">
                      <Download className="w-4 h-4 mr-1"/>Download
                    </Button>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
