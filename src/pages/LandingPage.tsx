import { Link } from "react-router-dom";
import { Shield, Bot, Terminal, BarChart3, Users, Zap, Globe, Code, Network, Lock, Server, Cpu } from "lucide-react";
import kelvyLogo from "@/assets/kelvy-logo.png";
import { lazy, Suspense } from "react";
const HeroScene3D = lazy(() => import("@/components/three/HeroScene3D"));

const features = [
  { icon: Shield, title: "Security Operations", desc: "70+ Linux security tools with AI-powered analysis. Nmap, SQLMap, Metasploit, and more.", color: "text-red-400" },
  { icon: Bot, title: "AI Assistant", desc: "Private, local AI powered by Ollama. Code review, threat analysis, document summarization.", color: "text-purple-400" },
  { icon: Terminal, title: "Linux Tools Hub", desc: "Execute security tools directly from the dashboard. Cross-platform with Docker fallback.", color: "text-green-400" },
  { icon: Users, title: "CRM System", desc: "Full customer management with pipeline tracking, M-Pesa integration, and client portal.", color: "text-blue-400" },
  { icon: BarChart3, title: "Business Analytics", desc: "Real-time dashboards with AI-narrated insights. Revenue, security, and operations metrics.", color: "text-yellow-400" },
  { icon: Code, title: "Cloud IDE", desc: "Browser-based development environment with AI code assistant and Git integration.", color: "text-cyan-400" },
  { icon: Network, title: "Network Hub", desc: "Real-time network topology, device discovery, bandwidth monitoring, and VPN management.", color: "text-orange-400" },
  { icon: Zap, title: "Automation Engine", desc: "Scheduled tasks, workflow automation, and event-driven triggers that run your system.", color: "text-pink-400" },
  { icon: Lock, title: "RBAC Security", desc: "Role-based access control with 6 roles, audit logging, and zero-trust architecture.", color: "text-emerald-400" },
  { icon: Server, title: "ERP System", desc: "Finance, invoicing, expense tracking, and M-Pesa payment processing for Kenya.", color: "text-amber-400" },
  { icon: Globe, title: "Client Portal", desc: "Secure portal for clients to track projects, tickets, invoices, and communicate.", color: "text-teal-400" },
  { icon: Cpu, title: "ITSM Ticketing", desc: "Support ticket system with SLA tracking, AI-suggested resolutions, and knowledge base.", color: "text-indigo-400" },
];

const stats = [
  { value: "70+", label: "Security Tools" },
  { value: "12", label: "Core Modules" },
  { value: "100%", label: "Local AI" },
  { value: "$0", label: "To Start" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={kelvyLogo} alt="Kelvy CyberTech" className="w-8 h-8 rounded-lg" />
            <span className="font-display text-sm font-bold text-primary">KELVY CYBERTECH HUB</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="px-4 py-1.5 rounded-lg border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition">
              Sign In
            </Link>
            <Link to="/auth" className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-bold hover:opacity-90 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="absolute inset-0 h-[600px] md:h-[720px] pointer-events-none">
          <Suspense fallback={null}>
            <div className="w-full h-full pointer-events-auto"><HeroScene3D /></div>
          </Suspense>
        </div>
        <div className="absolute inset-x-0 top-0 h-[720px] bg-gradient-to-b from-background/40 via-background/10 to-background pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center relative z-10 pointer-events-none">
          <div className="[&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono mb-6 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> AI-POWERED • OFFLINE-FIRST • ENTERPRISE READY
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 text-glow-green">
            <span className="text-primary">KELVY</span> CYBERTECH HUB
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-body">
            The unified AI-powered command center for cybersecurity, business operations, and enterprise computing.
            All fields of computing — one platform.
          </p>
          <div className="flex items-center justify-center gap-4 mb-12">
            <Link to="/auth" className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-bold hover:opacity-90 transition glow-border">
              🚀 Launch Dashboard
            </Link>
            <a href="#features" className="px-6 py-3 rounded-lg border border-border text-sm font-mono text-muted-foreground hover:text-foreground transition">
              Explore Features
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="glass rounded-xl p-4 text-center">
                <p className="text-2xl font-display font-bold text-primary text-glow-green">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Enterprise Modules</h2>
          <p className="text-sm text-muted-foreground font-mono">Every field of computing. One unified platform.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="glass rounded-xl p-5 hover:border-primary/30 transition group">
              <f.icon className={`w-8 h-8 ${f.color} mb-3 group-hover:scale-110 transition`} />
              <h3 className="font-display text-sm font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-border/50 bg-muted/5">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">100% Free Tech Stack</h2>
          <p className="text-sm text-muted-foreground font-mono mb-8">Enterprise-grade tools at zero cost</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Ollama AI", "Supabase", "React", "Tailwind", "FastAPI", "Docker", "PostgreSQL", "Recharts", "TypeScript", "Vite"].map(t => (
              <span key={t} className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="glass rounded-2xl p-8 md:p-12 border border-primary/20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Ready to Take Control?</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Join Kelvy CyberTech Hub and access the most comprehensive AI-powered enterprise platform. Built in Kenya, for the world.
          </p>
          <Link to="/auth" className="inline-flex px-8 py-3 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-bold hover:opacity-90 transition">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={kelvyLogo} alt="Kelvy" className="w-5 h-5 rounded" />
            <span className="text-xs text-muted-foreground font-mono">© 2026 Kelvy CyberTech Hub. All rights reserved.</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">Built by Kelvin • Powered by Ollama AI • Made in Kenya 🇰🇪</p>
        </div>
      </footer>
    </div>
  );
}
