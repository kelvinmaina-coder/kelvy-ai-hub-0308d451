import { useEffect, useState } from "react";
import { Zap, Clock, CheckCircle, Play, RefreshCw, Plus, X, Loader2, History, Trash2 } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { toast } from "sonner";

interface Workflow {
  id: number;
  name: string;
  schedule: string;
  lastRun: string;
  status: "active" | "paused" | "error";
  runs: number;
  description: string;
}

interface RunRecord {
  id: number;
  workflowId: number;
  workflowName: string;
  startedAt: string;
  durationMs: number;
  status: "success" | "error";
  output: string;
}

const defaultWorkflows: Workflow[] = [
  { id: 1, name: "Hourly Network Scan", schedule: "Every 1h", lastRun: "—", status: "active", runs: 0, description: "Runs nmap sweep on local network" },
  { id: 2, name: "Nightly DB Backup", schedule: "Every night 2AM", lastRun: "—", status: "active", runs: 0, description: "Full database backup to cloud storage" },
  { id: 3, name: "Morning Digest Report", schedule: "Every day 8AM", lastRun: "—", status: "active", runs: 0, description: "Email daily summary to team" },
  { id: 4, name: "Weekly Security Report", schedule: "Every Monday", lastRun: "—", status: "active", runs: 0, description: "Comprehensive security posture report" },
  { id: 5, name: "Client Onboarding", schedule: "On trigger", lastRun: "—", status: "active", runs: 0, description: "Auto-create CRM contact, send welcome email" },
  { id: 6, name: "Auto IP Block (5 fails)", schedule: "On event", lastRun: "—", status: "active", runs: 0, description: "Block IP after 5 failed login attempts" },
  { id: 7, name: "High CPU Auto-Restart", schedule: "On alert", lastRun: "—", status: "paused", runs: 0, description: "Restart service when CPU > 90% for 5min" },
  { id: 8, name: "Vulnerability Check", schedule: "Every 6h", lastRun: "—", status: "active", runs: 0, description: "Run nuclei scanner on all endpoints" },
];

const statusColors: Record<string, string> = {
  active: "text-primary bg-primary/10",
  paused: "text-warning bg-warning/10",
  error: "text-destructive bg-destructive/10",
};

const WF_KEY = "kelvy.automation.workflows.v1";
const RUNS_KEY = "kelvy.automation.runs.v1";

const loadJSON = <T,>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
};

export default function Automation() {
  const [workflows, setWorkflows] = useState<Workflow[]>(() => loadJSON<Workflow[]>(WF_KEY, defaultWorkflows));
  const [runs, setRuns] = useState<RunRecord[]>(() => loadJSON<RunRecord[]>(RUNS_KEY, []));
  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [runningId, setRunningId] = useState<number | null>(null);

  useEffect(() => { localStorage.setItem(WF_KEY, JSON.stringify(workflows)); }, [workflows]);
  useEffect(() => { localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, 200))); }, [runs]);

  const triggerRun = async (wf: Workflow) => {
    setRunningId(wf.id);
    toast.info(`Running "${wf.name}"...`);
    const startedAt = new Date();
    // Simulated execution; real backend hook would POST to /workflows/run here
    const delay = 800 + Math.random() * 1800;
    await new Promise(r => setTimeout(r, delay));
    const ok = Math.random() > 0.05;
    const rec: RunRecord = {
      id: Date.now(),
      workflowId: wf.id,
      workflowName: wf.name,
      startedAt: startedAt.toISOString(),
      durationMs: Math.round(delay),
      status: ok ? "success" : "error",
      output: ok ? `Workflow "${wf.name}" completed successfully.` : `Workflow "${wf.name}" failed: simulated transient error.`,
    };
    setRuns(prev => [rec, ...prev]);
    setWorkflows(prev => prev.map(w =>
      w.id === wf.id ? { ...w, lastRun: "just now", runs: w.runs + 1, status: ok ? w.status : "error" } : w
    ));
    ok ? toast.success(`"${wf.name}" completed`) : toast.error(`"${wf.name}" failed`);
    setRunningId(null);
  };

  const toggleStatus = (id: number) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: w.status === "active" ? "paused" : "active" } : w));
  };

  const removeWorkflow = (id: number) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    toast.success("Workflow removed");
  };

  const addWorkflow = () => {
    if (!newName.trim()) return;
    setWorkflows(prev => [...prev, {
      id: Date.now(),
      name: newName.trim(),
      schedule: newSchedule.trim() || "Manual",
      lastRun: "never",
      status: "active",
      runs: 0,
      description: newDesc.trim(),
    }]);
    setNewName(""); setNewSchedule(""); setNewDesc("");
    setShowAdd(false);
    toast.success("Workflow created");
  };

  const activeCount = workflows.filter(w => w.status === "active").length;
  const totalRuns = runs.length || workflows.reduce((s, w) => s + w.runs, 0);
  const succeeded = runs.filter(r => r.status === "success").length;
  const successRate = runs.length ? ((succeeded / runs.length) * 100).toFixed(1) + "%" : "—";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold gradient-text">AUTOMATION ENGINE</h1>
          <p className="text-sm text-muted-foreground font-mono">Workflows • Schedules • Event Triggers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/40 text-foreground text-xs font-mono hover:bg-muted/60 transition">
            <History className="w-3 h-3" /> {showHistory ? "Hide history" : `History (${runs.length})`}
          </button>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-mono hover:bg-primary/30 transition">
            {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {showAdd ? "Cancel" : "New Workflow"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Zap} title="Active Workflows" value={String(activeCount)} variant="green" />
        <MetricCard icon={Clock} title="Total Runs" value={String(totalRuns)} variant="cyan" />
        <MetricCard icon={CheckCircle} title="Success Rate" value={successRate} variant="green" />
        <MetricCard icon={RefreshCw} title="Workflows" value={String(workflows.length)} variant="purple" />
      </div>

      {showAdd && (
        <div className="rounded-lg border border-primary/30 bg-card p-4 space-y-3 animate-fade-in">
          <h3 className="font-display text-sm text-primary">ADD WORKFLOW</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Workflow name *"
              className="bg-background border border-border rounded px-3 py-2 text-sm font-mono" />
            <input value={newSchedule} onChange={e => setNewSchedule(e.target.value)} placeholder="Schedule (e.g. Every 1h)"
              className="bg-background border border-border rounded px-3 py-2 text-sm font-mono" />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description"
              className="bg-background border border-border rounded px-3 py-2 text-sm font-mono" />
          </div>
          <button onClick={addWorkflow} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-mono">Add workflow</button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-display text-sm text-primary mb-3 text-glow-green">WORKFLOWS</h3>
        <div className="space-y-1">
          {workflows.map(w => (
            <div key={w.id} className="flex items-center gap-3 p-2 rounded bg-muted/20 text-sm">
              <button onClick={() => toggleStatus(w.id)}
                className={`w-2 h-2 rounded-full shrink-0 cursor-pointer ${w.status === "active" ? "bg-primary animate-pulse-glow" : w.status === "paused" ? "bg-warning" : "bg-destructive"}`}
                title={`Status: ${w.status}. Click to toggle.`} />
              <div className="flex-1 min-w-0">
                <span className="text-foreground block truncate">{w.name}</span>
                {w.description && <span className="text-[10px] text-muted-foreground block truncate">{w.description}</span>}
              </div>
              <span className="text-xs text-muted-foreground font-mono hidden sm:block">{w.schedule}</span>
              <span className="text-xs text-muted-foreground font-mono">{w.runs} runs</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${statusColors[w.status]}`}>{w.status}</span>
              <button onClick={() => triggerRun(w)} disabled={runningId === w.id}
                className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs hover:bg-primary/20 disabled:opacity-50">
                {runningId === w.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              </button>
              <button onClick={() => removeWorkflow(w.id)} title="Delete"
                className="px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showHistory && (
        <div className="rounded-lg border border-border bg-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm text-accent">RUN HISTORY</h3>
            {runs.length > 0 && (
              <button onClick={() => { setRuns([]); toast.success("History cleared"); }}
                className="text-[10px] text-muted-foreground hover:text-destructive font-mono">Clear all</button>
            )}
          </div>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono text-center py-6">No runs yet — click ▶ on any workflow.</p>
          ) : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {runs.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded bg-muted/10 text-sm">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${r.status === "success" ? "bg-primary" : "bg-destructive"}`} />
                  <span className="text-foreground flex-1 truncate">{r.workflowName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono hidden md:block">{new Date(r.startedAt).toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{r.durationMs}ms</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${r.status === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
