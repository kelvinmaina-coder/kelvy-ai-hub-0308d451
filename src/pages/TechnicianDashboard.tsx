import { useEffect, useState } from "react";
import { Wrench, CheckCircle2, Clock, Zap, MapPin, DollarSign, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MetricCard from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-destructive border-destructive/40 bg-destructive/10",
  high: "text-warning border-warning/40 bg-warning/10",
  medium: "text-secondary border-secondary/40 bg-secondary/10",
  low: "text-muted-foreground border-border bg-muted/20",
};

export default function TechnicianDashboard() {
  const { user, profile } = useAuth();
  const [available, setAvailable] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [clients, setClients] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("in_progress");

  const load = async () => {
    if (!user) return;
    const { data: avail } = await supabase.from("service_requests")
      .select("*").is("assigned_technician", null).eq("status", "pending")
      .order("priority", { ascending: false }).order("created_at", { ascending: true });
    const { data: my } = await supabase.from("service_requests")
      .select("*").eq("assigned_technician", user.id)
      .order("created_at", { ascending: false });
    setAvailable(avail || []);
    setMine(my || []);

    const ids = Array.from(new Set([...(avail || []), ...(my || [])].map(r => r.client_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, phone, company").in("id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; });
      setClients(map);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("tech-sr")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const claim = async (id: string) => {
    const { error } = await supabase.from("service_requests")
      .update({ assigned_technician: user!.id, status: "assigned" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Job claimed — client has been notified");
    load();
  };

  const openUpdate = (r: any) => {
    setSelected(r);
    setNotes(r.technician_notes || "");
    setNewStatus(r.status === "assigned" ? "in_progress" : r.status);
  };

  const saveUpdate = async () => {
    if (!selected) return;
    const payload: any = { technician_notes: notes, status: newStatus };
    if (newStatus === "completed") payload.completed_at = new Date().toISOString();
    const { error } = await supabase.from("service_requests").update(payload).eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setSelected(null);
    load();
  };

  const activeMine = mine.filter(r => !["completed", "cancelled"].includes(r.status));
  const doneMine = mine.filter(r => r.status === "completed");

  const Card = ({ r, action }: { r: any; action: "claim" | "update" }) => {
    const c = clients[r.client_id];
    return (
      <div className="p-3 rounded-md border border-border bg-muted/20 hover:border-primary/40 transition">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${PRIORITY_COLORS[r.priority] || ""}`}>
                {r.priority.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{r.category.replace("_", " ")}</span>
            </div>
            <h4 className="font-semibold text-sm text-foreground">{r.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] font-mono text-muted-foreground">
              {c && <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.full_name || "Client"}</span>}
              {r.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.location}</span>}
              {r.budget_kes && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />KES {Number(r.budget_kes).toLocaleString()}</span>}
            </div>
          </div>
          {action === "claim" ? (
            <Button size="sm" onClick={() => claim(r.id)} className="bg-primary text-primary-foreground">
              <Zap className="w-3 h-3 mr-1" /> Claim
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => openUpdate(r)}>Update</Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary text-glow-green">
          TECHNICIAN — {(profile?.full_name || "").toUpperCase()}
        </h1>
        <p className="text-sm text-muted-foreground font-mono">Available jobs & your active workload</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Zap} title="Available Jobs" value={String(available.length)} variant="orange" />
        <MetricCard icon={Wrench} title="My Active" value={String(activeMine.length)} variant="cyan" />
        <MetricCard icon={CheckCircle2} title="Completed" value={String(doneMine.length)} variant="green" />
        <MetricCard icon={Clock} title="Total Handled" value={String(mine.length)} variant="purple" />
      </div>

      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">Available ({available.length})</TabsTrigger>
          <TabsTrigger value="mine">My Jobs ({activeMine.length})</TabsTrigger>
          <TabsTrigger value="history">History ({doneMine.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="space-y-2 mt-4">
          {available.length === 0
            ? <p className="text-sm text-muted-foreground font-mono text-center py-8">No open jobs right now.</p>
            : available.map(r => <Card key={r.id} r={r} action="claim" />)}
        </TabsContent>
        <TabsContent value="mine" className="space-y-2 mt-4">
          {activeMine.length === 0
            ? <p className="text-sm text-muted-foreground font-mono text-center py-8">You have no active jobs.</p>
            : activeMine.map(r => <Card key={r.id} r={r} action="update" />)}
        </TabsContent>
        <TabsContent value="history" className="space-y-2 mt-4">
          {doneMine.length === 0
            ? <p className="text-sm text-muted-foreground font-mono text-center py-8">No completed jobs yet.</p>
            : doneMine.map(r => <Card key={r.id} r={r} action="update" />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-primary">{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{selected?.description}</p>
            <div>
              <label className="text-xs font-mono text-muted-foreground">Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                className="w-full mt-1 bg-background border border-border rounded px-3 py-2 text-sm">
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground">Notes for client</label>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Progress update, findings, next steps..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={saveUpdate}>Save Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
