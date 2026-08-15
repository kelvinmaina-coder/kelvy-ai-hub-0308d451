import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ArrowLeft, Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SlaBadge from "@/components/SlaBadge";
import { toast } from "sonner";

export default function TrackRequest() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);

  const track = async () => {
    const c = code.trim();
    if (!c) return toast.error("Enter your tracking code");
    setLoading(true); setNotFound(false); setResult(null);
    const { data, error } = await supabase.rpc("track_request", { _code: c });
    setLoading(false);
    if (error) return toast.error("Invalid tracking code format");
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) { setNotFound(true); return; }
    setResult(row);
  };

  const steps = ["Received", "Assigned", "In Progress", "Resolved"];
  const stepIndex = !result ? -1
    : result.completed_at ? 3
      : result.status === "in_progress" ? 2
        : result.first_response_at || result.technician_first_name ? 1 : 0;

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition">
          <ArrowLeft className="w-3 h-3" /> BACK TO HOME
        </Link>

        <div>
          <h1 className="text-3xl font-display font-bold text-primary text-glow-green">TRACK YOUR REQUEST</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Paste the tracking code from your confirmation — no login needed.
          </p>
        </div>

        <div className="flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 3f9c1e88-…"
            onKeyDown={(e) => e.key === "Enter" && track()} className="font-mono" />
          <Button onClick={track} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {notFound && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> No request found for that code.
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display text-lg text-foreground">{result.title}</h2>
                <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">
                  {result.category} • {result.priority} priority • opened {new Date(result.created_at).toLocaleDateString()}
                </p>
              </div>
              <SlaBadge dueAt={result.resolve_due_at} status={result.status} escalated={result.escalated} label="ETA" />
            </div>

            <div className="flex items-center gap-1">
              {steps.map((s, i) => (
                <div key={s} className="flex-1">
                  <div className={`h-1.5 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted"}`} />
                  <p className={`text-[10px] font-mono mt-1 ${i <= stepIndex ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded border border-border bg-muted/20 p-3">
                <p className="text-muted-foreground">STATUS</p>
                <p className="text-foreground mt-1 uppercase">{String(result.status).replace("_", " ")}</p>
              </div>
              <div className="rounded border border-border bg-muted/20 p-3">
                <p className="text-muted-foreground">TECHNICIAN</p>
                <p className="text-foreground mt-1">{result.technician_first_name || "Awaiting assignment"}</p>
              </div>
              <div className="rounded border border-border bg-muted/20 p-3 flex items-center gap-2">
                <Clock className="w-3 h-3 text-secondary" />
                <span className="text-foreground">
                  First response: {result.first_response_at ? new Date(result.first_response_at).toLocaleString() : "pending"}
                </span>
              </div>
              <div className="rounded border border-border bg-muted/20 p-3 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                <span className="text-foreground">
                  Completed: {result.completed_at ? new Date(result.completed_at).toLocaleString() : "in progress"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
