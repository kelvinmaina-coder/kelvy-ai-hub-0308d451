import { useEffect, useState } from "react";
import { Timer, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  dueAt?: string | null;
  status?: string;
  escalated?: boolean;
  label?: string;
}

const DONE = ["resolved", "completed", "cancelled"];

function fmt(ms: number) {
  const abs = Math.abs(ms);
  const m = Math.floor(abs / 60000) % 60;
  const h = Math.floor(abs / 3600000) % 24;
  const d = Math.floor(abs / 86400000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Live SLA countdown chip — turns amber near breach, red once breached. */
export default function SlaBadge({ dueAt, status, escalated, label = "SLA" }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!dueAt) return null;

  if (status && DONE.includes(status)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border bg-primary/10 text-primary border-primary/30">
        <CheckCircle2 className="w-3 h-3" /> SLA CLOSED
      </span>
    );
  }

  const remaining = new Date(dueAt).getTime() - now;
  const breached = remaining <= 0 || escalated;
  const warning = !breached && remaining < 60 * 60 * 1000;

  const cls = breached
    ? "bg-destructive/10 text-destructive border-destructive/40 animate-pulse"
    : warning
      ? "bg-warning/10 text-warning border-warning/40"
      : "bg-secondary/10 text-secondary border-secondary/30";

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${cls}`}>
      {breached ? <AlertTriangle className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
      {breached ? `${label} BREACHED ${fmt(remaining)}` : `${label} ${fmt(remaining)} LEFT`}
    </span>
  );
}
