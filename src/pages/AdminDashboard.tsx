import { useEffect, useState } from "react";
import { Shield, Users, Ticket, DollarSign, AlertTriangle, CheckCircle, TrendingUp, Activity, Briefcase, UserCheck } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ clients: 0, tickets: 0, scans: 0, events: 0, revenue: 0, pending: 0, scansToday: 0, sr: 0, srOpen: 0 });
  const [events, setEvents] = useState<any[]>([]);
  const [ticketTrend, setTicketTrend] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [assignFor, setAssignFor] = useState<any | null>(null);

  const load = async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const dayAgo = new Date(now.getTime() - 86400000).toISOString();

    const [clientsRes, ticketsRes, scansRes, eventsRes, invoicesRes, pendingRes, scansTodayRes, srRes, techRolesRes] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("tickets").select("id", { count: "exact", head: true }).neq("status", "closed"),
      supabase.from("scans").select("id", { count: "exact", head: true }),
      supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(6),
      supabase.from("invoices").select("amount, status, paid_at"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("approved", false),
      supabase.from("scans").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
      supabase.from("service_requests").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("user_roles").select("user_id").eq("role", "technician"),
    ]);

    const paid = (invoicesRes.data || []).filter((i: any) => i.status === "paid");
    const revenue = paid.filter((i: any) => i.paid_at && i.paid_at >= monthStart)
      .reduce((a: number, i: any) => a + Number(i.amount), 0);

    const srList = srRes.data || [];
    setStats({
      clients: clientsRes.count || 0,
      tickets: ticketsRes.count || 0,
      scans: scansRes.count || 0,
      events: (eventsRes.data || []).length,
      revenue, pending: pendingRes.count || 0,
      scansToday: scansTodayRes.count || 0,
      sr: srList.length,
      srOpen: srList.filter((r: any) => !["completed", "cancelled"].includes(r.status)).length,
    });
    setEvents(eventsRes.data || []);
    setRequests(srList);

    const techIds = (techRolesRes.data || []).map((r: any) => r.user_id);
    const userIds = Array.from(new Set([...srList.map((r: any) => r.client_id), ...srList.map((r: any) => r.assigned_technician).filter(Boolean), ...techIds]));
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, phone").in("id", userIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
      setTechnicians(techIds.map(id => ({ id, ...map[id] })).filter(t => t.full_name));
    }

    const { data: recentTickets } = await supabase.from("tickets").select("created_at")
      .gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      days[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
    }
    (recentTickets || []).forEach((t: any) => {
      const d = new Date(t.created_at).toLocaleDateString("en-US", { weekday: "short" });
      if (days[d] !== undefined) days[d]++;
    });
    setTicketTrend(Object.entries(days).map(([day, count]) => ({ day, tickets: count })));
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "security_events" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const assign = async (techId: string) => {
    if (!assignFor) return;
    const { error } = await supabase.from("service_requests")
      .update({ assigned_technician: techId, status: "assigned" }).eq("id", assignFor.id);
    if (error) return toast.error(error.message);
    toast.success("Technician assigned");
    setAssignFor(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary text-glow-green">ADMIN COMMAND CENTER</h1>
        <p className="text-sm text-muted-foreground font-mono">Full control • Real-time operations overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Briefcase} title="Service Requests" value={String(stats.sr)} variant="orange" />
        <MetricCard icon={Users} title="Active Clients" value={String(stats.clients)} variant="cyan" />
        <MetricCard icon={Ticket} title="Open Tickets" value={String(stats.tickets)} variant="orange" />
        <MetricCard icon={DollarSign} title="Revenue (KES)" value={stats.revenue > 0 ? `${(stats.revenue / 1000).toFixed(0)}K` : "0"} variant="green" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Activity} title="Open SRs" value={String(stats.srOpen)} variant="red" />
        <MetricCard icon={Shield} title="Scans Today" value={String(stats.scansToday)} variant="purple" />
        <MetricCard icon={UserCheck} title="Pending Approvals" value={String(stats.pending)} variant="orange" />
        <MetricCard icon={CheckCircle} title="System" value="ONLINE" variant="green" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-display text-sm text-secondary mb-3 text-glow-cyan">TICKET TREND (7D)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ticketTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-display text-sm text-secondary mb-3 text-glow-cyan">LIVE SECURITY EVENTS</h3>
          <div className="space-y-2 max-h-[180px] overflow-y-auto">
            {events.length === 0
              ? <p className="text-sm text-muted-foreground font-mono text-center py-4">No events</p>
              : events.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-muted/30 text-sm">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${e.severity === "critical" ? "text-destructive" : e.severity === "warning" ? "text-warning" : "text-secondary"}`} />
                  <span className="flex-1 text-foreground text-xs">{e.description || e.event_type}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm text-secondary text-glow-cyan">SERVICE REQUEST OVERSIGHT</h3>
          <span className="text-[10px] text-muted-foreground font-mono">{requests.length} recent</span>
        </div>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-8">No service requests yet.</p>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {requests.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-md bg-muted/20 border border-border">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">{r.title}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/30">
                      {r.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">{r.priority}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-muted-foreground">
                    <span>Client: {profiles[r.client_id]?.full_name || "—"}</span>
                    <span>Tech: {r.assigned_technician ? (profiles[r.assigned_technician]?.full_name || "assigned") : "unassigned"}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAssignFor(r)}>
                  {r.assigned_technician ? "Reassign" : "Assign"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-primary">Assign Technician</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Pick a technician for: <span className="text-foreground font-semibold">{assignFor?.title}</span></p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {technicians.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No technicians available. Assign the technician role in Settings.</p>
              : technicians.map(t => (
                <button key={t.id} onClick={() => assign(t.id)}
                  className="w-full text-left p-3 rounded border border-border hover:border-primary hover:bg-primary/5 transition">
                  <p className="text-sm font-semibold">{t.full_name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{t.phone || "no phone"}</p>
                </button>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignFor(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
