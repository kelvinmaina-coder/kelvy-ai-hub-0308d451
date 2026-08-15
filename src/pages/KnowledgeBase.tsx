import { useEffect, useState } from "react";
import { BookOpen, Search, Plus, Eye, Tag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function KnowledgeBase() {
  const { user, hasAnyRole } = useAuth();
  const canWrite = hasAnyRole(["super_admin", "manager", "technician", "security_analyst"]);
  const [articles, setArticles] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "general", tags: "", published: true });

  const load = async () => {
    setLoading(true);
    let query = supabase.from("kb_articles").select("*").order("created_at", { ascending: false }).limit(100);
    if (q.trim()) query = query.or(`title.ilike.%${q.trim()}%,body.ilike.%${q.trim()}%`);
    const { data } = await query;
    setArticles(data || []);
    setLoading(false);
  };

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  const openArticle = async (a: any) => {
    setReading(a);
    await supabase.from("kb_articles").update({ views: (a.views || 0) + 1 }).eq("id", a.id);
  };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) return toast.error("Title and body are required");
    setSaving(true);
    const { error } = await supabase.from("kb_articles").insert({
      title: form.title,
      body: form.body,
      category: form.category,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      published: form.published,
      created_by: user!.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Article published to the knowledge base");
    setForm({ title: "", body: "", category: "general", tags: "", published: true });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary text-glow-green">KNOWLEDGE BASE</h1>
          <p className="text-sm text-muted-foreground font-mono">Solutions captured from resolved work — searchable by everyone.</p>
        </div>
        {canWrite && (
          <Button onClick={() => setOpen(true)} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" /> New Article
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search articles, symptoms, fixes…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : articles.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground font-mono">No articles yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {articles.map(a => (
            <button key={a.id} onClick={() => openArticle(a)}
              className="text-left rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-secondary/30 bg-secondary/10 text-secondary uppercase">
                  {a.category}
                </span>
                {!a.published && <span className="text-[10px] font-mono text-warning">DRAFT</span>}
                <span className="ml-auto text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {a.views || 0}
                </span>
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition line-clamp-2">{a.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{a.body}</p>
              {a.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {a.tags.slice(0, 4).map((t: string) => (
                    <span key={t} className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" />{t}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!reading} onOpenChange={(o) => !o && setReading(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{reading?.title}</DialogTitle></DialogHeader>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">{reading?.category} • {reading && new Date(reading.created_at).toLocaleDateString()}</p>
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{reading?.body}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="font-display text-primary">New KB Article</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Fixing Windows boot loop after update" /></div>
            <div><Label>Body *</Label><Textarea rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Symptoms, root cause, step-by-step fix…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="windows, boot" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <span className="text-xs font-mono text-muted-foreground">Publish immediately</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Article"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
