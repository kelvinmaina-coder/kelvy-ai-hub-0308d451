import { useState, useEffect } from "react";
import { Network, Wifi, Monitor, AlertTriangle, Globe, RefreshCw, Loader2, ShieldAlert } from "lucide-react";
import MetricCard from "@/components/MetricCard";

const BACKEND_URL = "http://localhost:8000";

interface Device {
  name: string;
  ip: string;
  type: string;
  status: string;
  os: string;
  mac?: string;
  firstSeen?: string;
  lastSeen?: string;
}

const knownDevices = new Set(["192.168.1.1", "192.168.1.10", "192.168.1.11", "192.168.1.50", "192.168.1.30"]);

const defaultDevices: Device[] = [
  { name: "Main Server", ip: "192.168.1.1", type: "Server", status: "online", os: "Parrot OS" },
  { name: "Web Server", ip: "192.168.1.10", type: "VM", status: "online", os: "Ubuntu 22.04" },
  { name: "DB Server", ip: "192.168.1.11", type: "VM", status: "online", os: "Ubuntu 22.04" },
  { name: "Dev Laptop", ip: "192.168.1.50", type: "Laptop", status: "online", os: "Parrot OS" },
  { name: "Unknown Device", ip: "192.168.1.99", type: "Unknown", status: "suspicious", os: "N/A" },
  { name: "Printer", ip: "192.168.1.30", type: "IoT", status: "offline", os: "Embedded" },
];

const statusColors: Record<string, string> = {
  online: "text-primary bg-primary/10",
  offline: "text-muted-foreground bg-muted/30",
  suspicious: "text-destructive bg-destructive/10 animate-pulse",
  rogue: "text-destructive bg-destructive/20 animate-pulse",
};

export default function NetworkHub() {
  const [devices, setDevices] = useState<Device[]>(defaultDevices);
  const [scanning, setScanning] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  

  useEffect(() => {
    fetch(`${BACKEND_URL}/health`).then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
  }, []);

  const discoverDevices = async () => {
    setScanning(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/security/run-tool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "nmap", args: ["-sn", "192.168.1.0/24"], target: "192.168.1.0/24" }),
      });
      if (res.ok) {
        const data = await res.json();
        const lines = (data.raw_output || "").split("\n");
        const discovered: Device[] = [];
        let currentHost = "";
        lines.forEach((line: string) => {
          const hostMatch = line.match(/Nmap scan report for (.+)/);
          if (hostMatch) currentHost = hostMatch[1];
          const ipMatch = currentHost.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch && line.includes("Host is up")) {
            const ip = ipMatch[1];
            const isKnown = knownDevices.has(ip);
            discovered.push({
              ip, name: currentHost.replace(/\s*\(.+\)/, "") || "Unknown",
              type: isKnown ? "Known" : "Unknown", mac: "",
              status: isKnown ? "online" : "rogue", os: "Detected",
              lastSeen: new Date().toISOString(),
            });
          }
        });
        if (discovered.length > 0) setDevices(discovered);
      } else throw new Error("Backend error");
    } catch {
      // Try arp-scan fallback
      try {
        const res = await fetch(`${BACKEND_URL}/api/security/run-tool`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: "arp-scan", args: ["--localnet"], target: "" }),
        });
        if (res.ok) {
          const data = await res.json();
          const lines = (data.raw_output || "").split("\n");
          const discovered: Device[] = lines
            .filter((l: string) => /\d+\.\d+\.\d+\.\d+/.test(l))
            .map((l: string) => {
              const parts = l.trim().split(/\s+/);
              const ip = parts[0];
              return {
                ip, mac: parts[1], name: parts.slice(2).join(" ") || "Unknown",
                type: knownDevices.has(ip) ? "Known" : "Unknown",
                status: knownDevices.has(ip) ? "online" : "rogue", os: "Unknown",
              };
            });
          if (discovered.length > 0) setDevices(discovered);
        }
      } catch {
        // Keep defaults
      }
    }
    setScanning(false);
  };

  const onlineCount = devices.filter(d => d.status === "online").length;
  const suspiciousCount = devices.filter(d => d.status === "suspicious" || d.status === "rogue").length;
  const healthScore = devices.length > 0 ? Math.round(((onlineCount / devices.length) * 80) + (suspiciousCount === 0 ? 20 : 0)) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-secondary text-glow-cyan">NETWORK HUB</h1>
          <p className="text-sm text-muted-foreground font-mono">Topology • Monitoring • Device Management</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 text-xs font-mono ${backendOnline ? "text-primary" : "text-destructive"}`}>
            <span className={`w-2 h-2 rounded-full ${backendOnline ? "bg-primary" : "bg-destructive"}`} />
            {backendOnline ? "Backend Online" : "Offline"}
          </span>
          <button onClick={discoverDevices} disabled={scanning}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary text-xs font-mono hover:bg-secondary/30 transition disabled:opacity-50">
            {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Scan Network
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Monitor} title="Total Devices" value={String(devices.length)} variant="cyan" />
        <MetricCard icon={Wifi} title="Online" value={String(onlineCount)} variant="green" />
        <MetricCard icon={Globe} title="Health Score" value={`${healthScore}%`} variant={healthScore > 80 ? "green" : "orange"} />
        <MetricCard icon={ShieldAlert} title="Rogue/Suspicious" value={String(suspiciousCount)} variant="red" />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-display text-sm text-secondary mb-3 text-glow-cyan">NETWORK DEVICES</h3>
        {true && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground font-mono border-b border-border">
                <th className="text-left py-2 pr-3">Status</th>
                <th className="text-left py-2 pr-3">Name</th>
                <th className="text-left py-2 pr-3">IP Address</th>
                <th className="text-left py-2 pr-3 hidden md:table-cell">MAC</th>
                <th className="text-left py-2 pr-3 hidden sm:table-cell">OS</th>
                <th className="text-left py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d, i) => (
                <tr key={i} className={`border-b border-border/30 animate-slide-in ${d.status === "rogue" || d.status === "suspicious" ? "bg-destructive/5" : "hover:bg-muted/20"}`}
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <td className="py-2 pr-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded font-mono ${statusColors[d.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${d.status === "online" ? "bg-primary" : d.status === "rogue" || d.status === "suspicious" ? "bg-destructive" : "bg-muted-foreground"}`} />
                      {d.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-foreground font-medium">{d.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground font-mono text-xs">{d.ip}</td>
                  <td className="py-2 pr-3 text-muted-foreground font-mono text-[10px] hidden md:table-cell">{d.mac || "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground text-xs hidden sm:table-cell">{d.os}</td>
                  <td className="py-2 text-xs text-muted-foreground">{d.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {suspiciousCount > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 animate-border-glow">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="font-display text-sm text-destructive">ROGUE DEVICE ALERT</h3>
          </div>
          <p className="text-sm text-foreground font-mono">
            {suspiciousCount} unknown/rogue device(s) detected on the network. Investigate immediately.
          </p>
        </div>
      )}
    </div>
  );
}
