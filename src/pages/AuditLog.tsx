import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, UserPlus, UserMinus, ShieldCheck, ShieldOff, Wrench,
  ArrowRightLeft, Plus, Trash2, RefreshCw, Filter, Download, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type LogRow = {
  id: number;
  user_id: string | null;
  action: string;
  resource: string | null;
  details_json: any;
  created_at: string;
};

const ACTION_META: Record<string, { icon: any; color: string; label: string }> = {
  "service_request.created":        { icon: Plus,           color: "text-primary border-primary/40 bg-primary/10",       label: "SR Created" },
  "service_request.assigned":       { icon: Wrench,         color: "text-secondary border-secondary/40 bg-secondary/10", label: "SR Assigned" },
  "service_request.reassigned":     { icon: ArrowRightLeft, color: "text-warning border-warning/40 bg-warning/10",       label: "SR Reassigned" },
  "service_request.unassigned":     { icon: UserMinus,      color: "text-muted-foreground border-border bg-muted/20",    label: "SR Unassigned" },
  "service_request.status_changed": { icon: RefreshCw,      color: "text-secondary border-secondary/40 bg-secondary/10", label: "Status Changed" },
  "service_request.deleted":        { icon: Trash2,         color: "text-destructive border-destructive/40 bg-destructive/10", label: "SR Deleted" },
  "role.granted":                   { icon: ShieldCheck,    color: "text-primary border-primary/40 bg-primary/10",       label: "Role Granted" },
  "role.revoked":                   { icon: ShieldOff,      color: "text-destructive border-destructive/40 bg-destructive/10", label: "Role Revoked" },
  "user.approved":                  { icon: UserPlus,       color: "text-primary border-primary/40 bg-primary/10",       label: "User Approved" },
  "user.unapproved":                { icon: UserMinus,      color: "text-warning border-warning/40 bg-warning/10",       label: "User Unapproved" },
};

const DEFAULT_META = { icon: Activity, color: "text-muted-foreground border-border bg-muted/20", label: "Event" };

function describe(row: LogRow, nameFor: (id?: string | null) => string): string {
  const d = row.details_json || {};
  switch (row.action) {
    case "service_request.created":
      return `Created “${d.title}” (${d.priority} · ${d.category}) for ${nameFor(d.client_id)}`;
    case "service_request.assigned":
      return `Assigned “${d.title}” to ${nameFor(d.to_technician)}`;
    case "service_request.reassigned":
      return `Reassigned “${d.title}” from ${nameFor(d.from_technician)} → ${nameFor(d.to_technician)}`;
    case "service_request.unassigned":
      return `Unassigned “${d.title}” from ${nameFor(d.from_technician)}`;
    case "service_request.status_changed":
      return `“${d.title}” status: ${d.from_status} → ${d.to_status}`;
    case "service_request.deleted":
      return `Deleted service request “${d.title}”`;
    case "role.granted":
      return `Granted role “${d.role}” to ${nameFor(d.target_user)}`;
    case "role.revoked":
      return `Revoked role “${d.role}” from ${nameFor(d.target_user)}`;
    case "user.approved":
      return `Approved user ${d.full_name || nameFor(d.target_user)}`;
    case "user.unapproved":
      return `Revoked approval for ${d.full_name || nameFor(d.target_user)}`;
    default:
      return row.action;
  }
}

function groupByDay(rows: LogRow[]) {
  const groups: Record<string, LogRow[]> = {};
  rows.forEach((r) => {
    const key = new Date(r.created_at).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    (groups[key] ||= []).push(r);
  });
  return Object.entries(groups);
}

export default function AuditLog() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data || []) as LogRow[];
    setRows(list);

    const ids = new Set<string>();
    list.forEach((r) => {
      if (r.user_id) ids.add(r.user_id);
      const d = r.details_json || {};
      ["target_user", "client_id", "from_technician", "to_technician"].forEach((k) => {
        if (d[k]) ids.add(d[k]);
      });
    });
    if (ids.size) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", Array.from(ids));
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p.full_name || "Unknown"; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("audit-log-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, (payload) => {
        setRows((prev) => [payload.new as LogRow, ...prev].slice(0, 500));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const nameFor = (id?: string | null) => (id ? profiles[id] || `${id.slice(0, 8)}…` : "System");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (actionFilter !== "all") {
        if (actionFilter === "service_request" && !r.action.startsWith("service_request.")) return false;
        if (actionFilter === "role" && !r.action.startsWith("role.")) return false;
        if (actionFilter === "user" && !r.action.startsWith("user.")) return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${r.action} ${describe(r, nameFor)} ${nameFor(r.user_id)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, actionFilter, query, profiles]);

  const exportCsv = () => {
    const header = ["timestamp", "actor", "action", "resource", "description"].join(",");
    const lines = filtered.map((r) => [
      new Date(r.created_at).toISOString(),
      `"${nameFor(r.user_id).replace(/"/g, '""')}"`,
      r.action,
      r.resource || "",
      `"${describe(r, nameFor).replace(/"/g, '""')}"`,
    ].join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} entries`);
  };

  const groups = groupByDay(filtered);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary text-glow-green">AUDIT LOG</h1>
          <p className="text-sm text-muted-foreground font-mono">
            Immutable timeline • assignments, status changes, and role actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="w-3 h-3 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search actor, resource, description…"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full md:w-56">
            <Filter className="w-3 h-3 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="service_request">Service requests</SelectItem>
            <SelectItem value="role">Role changes</SelectItem>
            <SelectItem value="user">User approvals</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-8">Loading timeline…</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground font-mono">No events match your filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(([day, list]) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-secondary text-glow-cyan">{day}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">{list.length} events</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <ol className="relative border-l border-border ml-3 space-y-3">
                  {list.map((r) => {
                    const meta = ACTION_META[r.action] || DEFAULT_META;
                    const Icon = meta.icon;
                    return (
                      <li key={r.id} className="ml-6">
                        <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full border ${meta.color}`}>
                          <Icon className="w-3 h-3" />
                        </span>
                        <div className="p-3 rounded-md border border-border bg-muted/20 hover:bg-muted/40 transition">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${meta.color}`}>
                                  {meta.label}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  by {nameFor(r.user_id)}
                                </span>
                              </div>
                              <p className="text-sm text-foreground mt-1.5">{describe(r, nameFor)}</p>
                              {r.resource && (
                                <p className="text-[10px] font-mono text-muted-foreground mt-1">{r.resource}</p>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                              {new Date(r.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
