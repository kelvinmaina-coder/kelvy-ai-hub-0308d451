import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Briefcase, CheckCircle2, Clock, MessageSquare, ChevronDown, ChevronRight, User } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ClientRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  approved: boolean;
  created_at: string;
  total: number;
  open: number;
  done: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-warning border-warning/40 bg-warning/10",
  assigned: "text-secondary border-secondary/40 bg-secondary/10",
  in_progress: "text-secondary border-secondary/40 bg-secondary/10",
  completed: "text-primary border-primary/40 bg-primary/10",
  resolved: "text-primary border-primary/40 bg-primary/10",
  cancelled: "text-muted-foreground border-border bg-muted/20",
};

export default function AdminClients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [requests, setRequests] = useState<Record<string, any[]>>({});
  const [techs, setTechs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    // client role users
    const { data: cRoles } = await supabase.from("user_roles").select("user_id").eq("role", "client");
    const ids = (cRoles ?? []).map(r => r.user_id);
    if (ids.length === 0) { setClients([]); setLoading(false); return; }

    const [{ data: profs }, { data: srs }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, company, approved, created_at").in("id", ids),
      supabase.from("service_requests").select("*").in("client_id", ids).order("created_at", { ascending: false }),
    ]);

    // Load technician display names for served-by
    const techIds = Array.from(new Set((srs ?? []).map((s: any) => s.assigned_technician).filter(Boolean)));
    const techMap: Record<string, string> = {};
    if (techIds.length) {
      const { data: tProfs } = await supabase.from("profiles").select("id, full_name").in("id", techIds);
      (tProfs ?? []).forEach((p: any) => { techMap[p.id] = p.full_name || "Technician"; });
    }
    setTechs(techMap);

    const byClient: Record<string, any[]> = {};
    (srs ?? []).forEach((s: any) => {
      (byClient[s.client_id] ||= []).push(s);
    });
    setRequests(byClient);

    setClients((profs ?? []).map((p: any) => {
      const list = byClient[p.id] || [];
      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        company: p.company,
        approved: p.approved,
        created_at: p.created_at,
        total: list.length,
        open: list.filter(r => !["completed", "resolved", "cancelled"].includes(r.status)).length,
        done: list.filter(r => ["completed", "resolved"].includes(r.status)).length,
      };
    }).sort((a, b) => b.total - a.total));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-clients")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const messageClient = async (clientId: string) => {
    if (!user) return;
    // Reuse existing direct conversation or create one
    const { data: mine } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    const { data: theirs } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", clientId);
    const mineIds = new Set((mine ?? []).map((x: any) => x.conversation_id));
    const shared = (theirs ?? []).filter((x: any) => mineIds.has(x.conversation_id)).map((x: any) => x.conversation_id);
    if (shared.length) {
      const { data: conv } = await supabase.from("conversations").select("id, type").in("id", shared);
      const direct = (conv ?? []).find((c: any) => c.type === "direct");
      if (direct) { navigate("/chat"); return; }
    }
    const { data: created, error } = await supabase.from("conversations")
      .insert({ type: "direct", created_by: user.id }).select().single();
    if (error || !created) { toast.error("Could not start chat"); return; }
    await supabase.from("conversation_participants").insert([
      { conversation_id: created.id, user_id: user.id, role: "admin" },
      { conversation_id: created.id, user_id: clientId, role: "member" },
    ]);
    toast.success("Chat opened");
    navigate("/chat");
  };

  const toggleApproved = async (c: ClientRow) => {
    const { error } = await supabase.from("profiles").update({ approved: !c.approved }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(c.approved ? "Access revoked" : "Client approved");
    load();
  };

  const filtered = clients.filter(c =>
    (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalReq = clients.reduce((a, c) => a + c.total, 0);
  const totalOpen = clients.reduce((a, c) => a + c.open, 0);
  const totalDone = clients.reduce((a, c) => a + c.done, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary text-glow-green">CLIENT DIRECTORY</h1>
        <p className="text-sm text-muted-foreground font-mono">All registered clients • Requests • Served-by history</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Users} title="Total Clients" value={String(clients.length)} variant="cyan" />
        <MetricCard icon={Briefcase} title="All Requests" value={String(totalReq)} variant="purple" />
        <MetricCard icon={Clock} title="Open" value={String(totalOpen)} variant="orange" />
        <MetricCard icon={CheckCircle2} title="Completed" value={String(totalDone)} variant="green" />
      </div>

      <div className="flex items-center gap-2">
        <Input placeholder="Search name or company…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-10">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <User className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-mono">No clients found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(c => {
              const list = requests[c.id] || [];
              const isOpen = expanded === c.id;
              return (
                <div key={c.id}>
                  <div className="flex items-center gap-3 p-3 hover:bg-muted/20">
                    <button onClick={() => setExpanded(isOpen ? null : c.id)} className="p-1 rounded hover:bg-muted/50">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {(c.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{c.full_name || "Unnamed"}</p>
                        {c.company && <span className="text-[10px] font-mono text-muted-foreground">· {c.company}</span>}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${c.approved ? "bg-primary/10 text-primary border-primary/30" : "bg-warning/10 text-warning border-warning/40"}`}>
                          {c.approved ? "APPROVED" : "PENDING"}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">{c.phone || "no phone"} · joined {new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                      <span title="total">Σ {c.total}</span>
                      <span title="open" className="text-warning">◐ {c.open}</span>
                      <span title="done" className="text-primary">✓ {c.done}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => messageClient(c.id)} className="gap-1">
                      <MessageSquare className="w-3 h-3" /> Message
                    </Button>
                    <Button size="sm" variant={c.approved ? "outline" : "default"} onClick={() => toggleApproved(c)}>
                      {c.approved ? "Revoke" : "Approve"}
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="bg-muted/10 border-t border-border px-4 py-3">
                      {list.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-mono py-3">No service requests from this client.</p>
                      ) : (
                        <div className="space-y-2">
                          {list.map(r => (
                            <div key={r.id} className="flex items-start gap-3 p-2 rounded border border-border bg-background/40">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold truncate">{r.title}</p>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${STATUS_COLORS[r.status] || ""}`}>
                                    {r.status.replace("_", " ").toUpperCase()}
                                  </span>
                                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{r.priority}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.description}</p>
                                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-muted-foreground flex-wrap">
                                  <span>Served by: <span className={r.assigned_technician ? "text-primary" : "text-warning"}>
                                    {r.assigned_technician ? (techs[r.assigned_technician] || "assigned") : "— unassigned —"}
                                  </span></span>
                                  <span>Created {new Date(r.created_at).toLocaleString()}</span>
                                  {r.completed_at && <span>Completed {new Date(r.completed_at).toLocaleString()}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
