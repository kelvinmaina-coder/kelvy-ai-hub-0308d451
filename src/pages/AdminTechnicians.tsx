import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Power, Star, Briefcase, Mail, Wrench } from "lucide-react";
import MetricCard from "@/components/MetricCard";

interface TechRow {
  user_id: string;
  full_name: string | null;
  email?: string;
  specialty: string;
  availability: string;
  active: boolean;
  rating: number;
  jobs_completed: number;
  invited_at: string;
  activated_at: string | null;
  open_jobs: number;
}

export default function AdminTechnicians() {
  const [rows, setRows] = useState<TechRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", specialty: "general" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: techRoles } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
    const ids = (techRoles ?? []).map(r => r.user_id);
    if (ids.length === 0) { setRows([]); setLoading(false); return; }

    const [{ data: profs }, { data: tps }, { data: srs }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", ids),
      supabase.from("technician_profiles").select("*").in("user_id", ids),
      supabase.from("service_requests").select("assigned_technician, status").in("assigned_technician", ids),
    ]);

    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const tpMap = new Map((tps ?? []).map((t: any) => [t.user_id, t]));
    const openMap: Record<string, number> = {};
    (srs ?? []).forEach((s: any) => {
      if (!["resolved", "cancelled", "completed"].includes(s.status)) {
        openMap[s.assigned_technician] = (openMap[s.assigned_technician] ?? 0) + 1;
      }
    });

    setRows(ids.map(id => {
      const tp = tpMap.get(id) ?? {};
      return {
        user_id: id,
        full_name: (profMap.get(id) as any)?.full_name ?? "—",
        specialty: tp.specialty ?? "general",
        availability: tp.availability ?? "available",
        active: tp.active ?? true,
        rating: Number(tp.rating ?? 0),
        jobs_completed: tp.jobs_completed ?? 0,
        invited_at: tp.invited_at ?? "",
        activated_at: tp.activated_at,
        open_jobs: openMap[id] ?? 0,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!form.email || !form.full_name) return toast.error("Email and name required");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("invite-technician", {
      body: { ...form, redirect_to: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || error?.message || "Invite failed");
    toast.success(`Invite sent to ${form.email}`);
    setOpen(false);
    setForm({ email: "", full_name: "", specialty: "general" });
    load();
  };

  const toggleActive = async (row: TechRow) => {
    const { error } = await supabase.from("technician_profiles")
      .update({ active: !row.active }).eq("user_id", row.user_id);
    if (error) return toast.error(error.message);
    toast.success(row.active ? "Technician deactivated" : "Technician activated");
    load();
  };

  const totalOpen = rows.reduce((a, r) => a + r.open_jobs, 0);
  const totalDone = rows.reduce((a, r) => a + r.jobs_completed, 0);
  const activeCount = rows.filter(r => r.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary text-glow-green">TECHNICIAN ROSTER</h1>
          <p className="text-sm text-muted-foreground font-mono">Invite • Manage • Monitor field operatives</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground gap-2"><UserPlus className="w-4 h-4" /> Invite Technician</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-primary">Invite New Technician</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Full name</Label>
                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="tech@example.com" />
              </div>
              <div>
                <Label>Specialty</Label>
                <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm">
                  <option value="general">General IT</option>
                  <option value="networking">Networking</option>
                  <option value="security">Cybersecurity</option>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="cloud">Cloud / DevOps</option>
                </select>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">
                An email invite will be sent. The technician sets their own password and lands in the dashboard with technician role pre-assigned.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={invite} disabled={busy}>{busy ? "Sending..." : "Send Invite"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Wrench} title="Total Technicians" value={String(rows.length)} variant="cyan" />
        <MetricCard icon={Power} title="Active" value={String(activeCount)} variant="green" />
        <MetricCard icon={Briefcase} title="Open Jobs" value={String(totalOpen)} variant="orange" />
        <MetricCard icon={Star} title="Jobs Completed" value={String(totalDone)} variant="purple" />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-10">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <Mail className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-mono">No technicians yet. Invite your first one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr className="text-left text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Specialty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Open</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.user_id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{r.full_name || "—"}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{r.user_id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded border border-secondary/30 bg-secondary/10 text-secondary uppercase font-mono">
                        {r.specialty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        r.active
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-destructive/10 text-destructive border-destructive/30"
                      }`}>
                        {r.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{r.open_jobs}</td>
                    <td className="px-4 py-3 font-mono">{r.jobs_completed}</td>
                    <td className="px-4 py-3 font-mono flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      {r.rating.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(r)} className="gap-1">
                        <Power className="w-3 h-3" />
                        {r.active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
