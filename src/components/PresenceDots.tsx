import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Global presence tracker — shows how many team members are online right now. */
export default function PresenceDots() {
  const { user, profile, roles } = useAuth();
  const [online, setOnline] = useState<{ id: string; name: string; role: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("global-presence", { config: { presence: { key: user.id } } });

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState() as Record<string, any[]>;
      const list = Object.entries(state).map(([id, metas]) => ({
        id,
        name: (metas[0] as any)?.name || "User",
        role: (metas[0] as any)?.role || "user",
      }));
      setOnline(list);
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ name: profile?.full_name || "User", role: roles[0] || "client", at: Date.now() });
      }
    });

    return () => { supabase.removeChannel(ch); };
  }, [user?.id, profile?.full_name, roles[0]]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2" title={online.map(o => `${o.name} (${o.role})`).join("\n")}>
      <div className="flex -space-x-1.5">
        {online.slice(0, 4).map(o => (
          <span key={o.id}
            className="w-5 h-5 rounded-full bg-primary/20 border border-primary/50 text-[9px] font-bold text-primary flex items-center justify-center">
            {(o.name || "U")[0].toUpperCase()}
          </span>
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
        {online.length} ONLINE
      </span>
    </div>
  );
}
