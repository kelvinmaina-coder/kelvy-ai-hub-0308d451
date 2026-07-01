import { useEffect, useState } from "react";
import { Plus, Clock, CheckCircle2, Wrench, AlertCircle, Sparkles, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MetricCard from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  assigned: "bg-secondary/10 text-secondary border-secondary/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-primary/20 text-primary border-primary/50",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "it_support",
    priority: "medium", location: "", budget_kes: "",
  });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("service_requests")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("client-sr")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `client_id=eq.${user?.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const submit = async () => {
    if (!user || !form.title || !form.description) {
      toast.error("Please fill in title and description");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("service_requests").insert({
      client_id: user.id,
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      location: form.location || null,
      budget_kes: form.budget_kes ? Number(form.budget_kes) : null,
      status: "pending",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Request submitted — a technician will pick it up shortly");
    setForm({ title: "", description: "", category: "it_support", priority: "medium", location: "", budget_kes: "" });
    setOpen(false);
    load();
  };

  const counts = {
    pending: requests.filter(r => r.status === "pending").length,
    active: requests.filter(r => ["assigned", "in_progress"].includes(r.status)).length,
    done: requests.filter(r => r.status === "completed").length,
    total: requests.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary text-glow-green">
            WELCOME, {(profile?.full_name || "CLIENT").toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">Request tech services — our team responds fast.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Request Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-primary">New Service Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Laptop won't boot" />
              </div>
              <div>
                <Label>Describe the issue *</Label>
                <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's happening? When did it start?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it_support">IT Support</SelectItem>
                      <SelectItem value="network">Network / WiFi</SelectItem>
                      <SelectItem value="hardware">Hardware Repair</SelectItem>
                      <SelectItem value="software">Software / Install</SelectItem>
                      <SelectItem value="security">Cybersecurity</SelectItem>
                      <SelectItem value="cctv">CCTV / Cameras</SelectItem>
                      <SelectItem value="web">Web / Development</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Nairobi, Westlands" />
                </div>
                <div>
                  <Label>Budget (KES)</Label>
                  <Input type="number" value={form.budget_kes} onChange={(e) => setForm({ ...form, budget_kes: e.target.value })} placeholder="5000" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>{saving ? "Sending..." : "Submit Request"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Clock} title="Pending" value={String(counts.pending)} variant="orange" />
        <MetricCard icon={Wrench} title="In Progress" value={String(counts.active)} variant="cyan" />
        <MetricCard icon={CheckCircle2} title="Completed" value={String(counts.done)} variant="green" />
        <MetricCard icon={Sparkles} title="Total Requests" value={String(counts.total)} variant="purple" />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm text-secondary text-glow-cyan">MY SERVICE REQUESTS</h3>
          <Link to="/chat" className="text-xs text-primary hover:underline flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Chat with support
          </Link>
        </div>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground font-mono">No requests yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Request Service" to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="p-3 rounded-md border border-border bg-muted/20 hover:bg-muted/40 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-foreground">{r.title}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${STATUS_STYLES[r.status] || ""}`}>
                        {r.status.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">• {r.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                    {r.technician_notes && (
                      <p className="text-xs text-primary/80 mt-2 border-l-2 border-primary pl-2">
                        <span className="font-mono text-[10px]">TECHNICIAN:</span> {r.technician_notes}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
