import { useEffect, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface IncomingCall {
  id: string;
  caller_id: string;
  call_type: string;
  caller_name?: string;
}

/**
 * Global listener that pops a ringing modal whenever a call row
 * is inserted into the `calls` table where the receiver is the current user.
 */
export default function CallNotificationModal() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("incoming-calls")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls", filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          const call = payload.new as any;
          if (call.status !== "initiated") return;
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", call.caller_id)
            .maybeSingle();
          setIncoming({
            id: call.id,
            caller_id: call.caller_id,
            call_type: call.call_type,
            caller_name: (prof as any)?.full_name || "Unknown caller",
          });
          setRinging(true);
          // auto-stop after 30s
          setTimeout(() => {
            setRinging(false);
            setIncoming((cur) => (cur?.id === call.id ? null : cur));
          }, 30000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const accept = async () => {
    if (!incoming) return;
    await supabase
      .from("calls")
      .update({ status: "accepted", started_at: new Date().toISOString() } as any)
      .eq("id", incoming.id);
    toast.success("Call accepted");
    setIncoming(null);
    setRinging(false);
    // route to a meeting room keyed on the call id
    window.location.href = `/meeting/${incoming.id}`;
  };

  const decline = async () => {
    if (!incoming) return;
    await supabase
      .from("calls")
      .update({ status: "declined", ended_at: new Date().toISOString() } as any)
      .eq("id", incoming.id);
    setIncoming(null);
    setRinging(false);
  };

  if (!incoming) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-[320px] rounded-2xl border border-primary/40 bg-card p-6 text-center shadow-2xl">
        <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 ${ringing ? "animate-pulse" : ""}`}>
          {incoming.call_type === "video" ? (
            <Video className="h-9 w-9 text-primary" />
          ) : (
            <Phone className="h-9 w-9 text-primary" />
          )}
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
          Incoming {incoming.call_type} call
        </p>
        <p className="mt-1 text-lg font-semibold text-foreground">{incoming.caller_name}</p>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={decline}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500"
            title="Decline"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            onClick={accept}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
            title="Accept"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
