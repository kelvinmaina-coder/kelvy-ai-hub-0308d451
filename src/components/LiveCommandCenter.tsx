import { useEffect, useState } from "react";
import { Activity, Cpu, Globe2, Shield, Zap } from "lucide-react";

// Theme-aware live command center: global network map + live terminal + kinetic metrics.
// All colors use semantic CSS tokens (primary/secondary/accent) so it retunes automatically
// when the user switches themes.

const NODES = [
  { x: 18, y: 42, label: "NBO" },
  { x: 30, y: 38, label: "LDN" },
  { x: 48, y: 34, label: "FRA" },
  { x: 62, y: 46, label: "DXB" },
  { x: 78, y: 52, label: "SGP" },
  { x: 85, y: 40, label: "TYO" },
  { x: 22, y: 60, label: "JNB" },
  { x: 8, y: 44, label: "NYC" },
];

const LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 6], [7, 1], [2, 5], [0, 3],
];

const LOG_LINES = [
  { t: "SCAN", msg: "nmap -sV 10.0.0.0/24 → 42 hosts up", tone: "primary" },
  { t: "AI  ", msg: "ollama:qwen2.5 summarizing scan…", tone: "secondary" },
  { t: "SLA ", msg: "TCK-2041 acknowledged in 00:00:47", tone: "primary" },
  { t: "AUTH", msg: "role=technician granted → job#8821", tone: "accent" },
  { t: "PAY ", msg: "M-Pesa STK push · KES 4,500 · OK", tone: "primary" },
  { t: "NET ", msg: "peer 41.90.x online · latency 38ms", tone: "secondary" },
  { t: "FIRE", msg: "3 blocked · 0 breached · queue 0", tone: "accent" },
  { t: "BOT ", msg: "automation:rule#12 fired → chat notify", tone: "secondary" },
];

export default function LiveCommandCenter() {
  const [tick, setTick] = useState(0);
  const [lines, setLines] = useState<typeof LOG_LINES>([]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setLines(prev => {
      const next = LOG_LINES[(tick) % LOG_LINES.length];
      return [next, ...prev].slice(0, 6);
    });
  }, [tick]);

  // Deterministic pseudo-random bars, redrawn each tick
  const bars = Array.from({ length: 24 }, (_, i) => {
    const seed = Math.sin(i * 12.9898 + tick * 0.37) * 43758.5453;
    return Math.abs(seed - Math.floor(seed));
  });

  const uptime = (99.92 + Math.sin(tick / 3) * 0.05).toFixed(2);
  const threats = 128 + (tick % 17);
  const ops = 1420 + ((tick * 13) % 380);

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-mono text-primary tracking-wider">LIVE COMMAND CENTER</span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">A holographic pulse of your entire stack</h2>
        <p className="text-sm text-muted-foreground font-mono">Global mesh · live telemetry · AI narration — all theme-aware.</p>
      </div>

      <div className="grid md:grid-cols-6 gap-4">
        {/* Global network map */}
        <div className="md:col-span-4 glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-foreground">GLOBAL NETWORK MESH</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{NODES.length} nodes · {LINKS.length} links</span>
          </div>

          <div className="relative aspect-[2/1] rounded-lg border border-border/60 bg-background/40 overflow-hidden">
            {/* grid backdrop */}
            <div className="absolute inset-0 cyber-grid opacity-30" />
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.10),transparent_70%)]" />

            <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="lnk" x1="0" x2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {LINKS.map(([a, b], i) => {
                const A = NODES[a], B = NODES[b];
                return (
                  <g key={i}>
                    <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="hsl(var(--primary))" strokeOpacity="0.18" strokeWidth="0.15" />
                    <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="url(#lnk)" strokeWidth="0.35" strokeDasharray="1.2 1.4">
                      <animate attributeName="stroke-dashoffset" from="0" to="-8" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
                    </line>
                  </g>
                );
              })}

              {NODES.map((n, i) => (
                <g key={n.label}>
                  <circle cx={n.x} cy={n.y} r="1.6" fill="hsl(var(--primary))" opacity="0.15">
                    <animate attributeName="r" values="1.6;3.2;1.6" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.15;0;0.15" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={n.x} cy={n.y} r="0.9" fill="hsl(var(--primary))" />
                  <text x={n.x + 1.5} y={n.y - 1} fontSize="1.6" fill="hsl(var(--foreground))" opacity="0.7" style={{ fontFamily: "var(--font-mono)" }}>{n.label}</text>
                </g>
              ))}
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { icon: Activity, label: "OPS/min", value: ops.toLocaleString() },
              { icon: Shield, label: "Threats blocked", value: threats.toString() },
              { icon: Cpu, label: "Uptime", value: `${uptime}%` },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-border/60 bg-card/40 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground tracking-wider">
                  <s.icon className="w-3 h-3 text-primary" /> {s.label}
                </div>
                <div className="font-display text-lg font-bold text-foreground">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live terminal feed */}
        <div className="md:col-span-2 glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <span className="w-2 h-2 rounded-full bg-warning" />
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">kelvy@hub ~ live</span>
            </div>
            <Zap className="w-3.5 h-3.5 text-secondary" />
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 p-3 h-[210px] overflow-hidden font-mono text-[11px] leading-relaxed">
            {lines.map((l, i) => (
              <div key={i} className="animate-fade-in">
                <span className="text-muted-foreground">›</span>{" "}
                <span className={
                  l.tone === "primary" ? "text-primary" :
                  l.tone === "secondary" ? "text-secondary" : "text-accent"
                }>[{l.t}]</span>{" "}
                <span className="text-foreground/80">{l.msg}</span>
              </div>
            ))}
            <div className="text-primary terminal-cursor" />
          </div>
        </div>

        {/* Kinetic metrics chart */}
        <div className="md:col-span-6 glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-mono text-[11px] text-muted-foreground tracking-wider">SERVICE VELOCITY · LAST 24 CYCLES</div>
              <div className="font-display text-lg text-foreground">Requests → Resolution</div>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-primary"><span className="w-2 h-2 rounded-sm bg-primary" /> incoming</span>
              <span className="flex items-center gap-1 text-secondary"><span className="w-2 h-2 rounded-sm bg-secondary" /> resolved</span>
              <span className="flex items-center gap-1 text-accent"><span className="w-2 h-2 rounded-sm bg-accent" /> ai-assisted</span>
            </div>
          </div>
          <div className="h-40 flex items-end gap-1.5">
            {bars.map((b, i) => {
              const h1 = 30 + b * 70;
              const h2 = 20 + ((bars[(i + 5) % bars.length]) * 60);
              const h3 = 10 + ((bars[(i + 11) % bars.length]) * 40);
              return (
                <div key={i} className="flex-1 flex flex-col-reverse gap-0.5 items-stretch">
                  <div className="rounded-t bg-primary/80 transition-all duration-700" style={{ height: `${h1}%` }} />
                  <div className="rounded-t bg-secondary/70 transition-all duration-700" style={{ height: `${h2}%` }} />
                  <div className="rounded-t bg-accent/60 transition-all duration-700" style={{ height: `${h3}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
