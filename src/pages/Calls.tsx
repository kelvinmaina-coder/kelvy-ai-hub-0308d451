import { useState, useEffect } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Clock, Loader2 } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CallRecord {
  id: number;
  caller_id: string;
  receiver_id: string | null;
  call_type: string | null;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export default function Calls() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase.from("calls").select("*").order("created_at", { ascending: false }).limit(50);
      setCalls((data as CallRecord[]) || []);

      const { data: profs } = await supabase.from("profiles").select("id, full_name");
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p.full_name || p.id.slice(0, 8); });
      setProfiles(map);
      setLoading(false);
    };
    load();
  }, [user]);

  const callBack = async (receiverId: string, type: "audio" | "video" = "audio") => {
    if (!user) return;
    const { data, error } = await supabase.from("calls").insert({
      caller_id: user.id,
      receiver_id: receiverId,
      call_type: type,
      status: "initiated",
    } as any).select().single();
    if (error || !data) { toast.error(error?.message || "Failed"); return; }
    toast.success("Calling…");
    // jump the caller into the room while the receiver gets the ring modal
    window.location.href = `/meeting/${(data as any).id}`;
  };

  const missedCount = calls.filter(c => c.status === "missed" && c.receiver_id === user?.id).length;
  const totalDuration = calls.reduce((s, c) => s + (c.duration_seconds || 0), 0);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.status === "missed") return <PhoneMissed className="w-4 h-4 text-destructive" />;
    if (call.caller_id === user?.id) return <PhoneOutgoing className="w-4 h-4 text-primary" />;
    return <PhoneIncoming className="w-4 h-4 text-secondary" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-secondary text-glow-cyan">CALL HISTORY</h1>
        <p className="text-sm text-muted-foreground font-mono">Voice & Video Call Logs</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Phone} title="Total Calls" value={String(calls.length)} variant="cyan" />
        <MetricCard icon={PhoneMissed} title="Missed" value={String(missedCount)} variant="red" />
        <MetricCard icon={Video} title="Video Calls" value={String(calls.filter(c => c.call_type === "video").length)} variant="purple" />
        <MetricCard icon={Clock} title="Talk Time" value={formatDuration(totalDuration)} variant="green" />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-display text-sm text-secondary mb-3 text-glow-cyan">RECENT CALLS</h3>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : calls.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-8">No calls yet</p>
        ) : (
          <div className="space-y-1">
            {calls.map(call => {
              const otherUserId = call.caller_id === user?.id ? call.receiver_id : call.caller_id;
              const isMissed = call.status === "missed";
              return (
                <div key={call.id} className={`flex items-center gap-3 p-3 rounded-lg transition ${isMissed ? "bg-destructive/5 border border-destructive/20" : "bg-muted/20"}`}>
                  {getCallIcon(call)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMissed ? "text-destructive" : "text-foreground"}`}>
                      {otherUserId ? profiles[otherUserId] || otherUserId?.slice(0, 8) : "Unknown"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {new Date(call.created_at).toLocaleString()} • {call.call_type || "audio"}
                    </p>
                  </div>
                  {call.duration_seconds ? (
                    <span className="text-xs text-muted-foreground font-mono">{formatDuration(call.duration_seconds)}</span>
                  ) : null}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isMissed ? "bg-destructive/10 text-destructive" :
                    call.status === "completed" ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>{call.status}</span>
                  {otherUserId && (
                    <button onClick={() => callBack(otherUserId)}
                      className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition">
                      <Phone className="w-3 h-3" />
                    </button>
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
