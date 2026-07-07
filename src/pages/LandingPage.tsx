import { Link } from "react-router-dom";
import { Shield, Bot, Terminal, BarChart3, Users, Zap, Globe, Code, Network, Lock, Server, Cpu, Sparkles, ArrowRight, Star, CheckCircle2, MessageSquare } from "lucide-react";
import kelvyLogo from "@/assets/kelvy-logo.png";
import RotatingWords from "@/components/RotatingWords";
import Marquee from "@/components/Marquee";
import LiveCommandCenter from "@/components/LiveCommandCenter";
import NeuralBackground from "@/components/NeuralBackground";

const testimonials = [
  { name: "Amina W.", role: "IT Manager, Nairobi", quote: "Kelvy replaced 4 tools. Our SLA dropped from 6h to 40 min.", color: "from-primary/30 to-secondary/30" },
  { name: "David K.", role: "Senior Technician", quote: "I claim jobs, message clients and file reports without leaving the tab.", color: "from-accent/30 to-primary/30" },
  { name: "Grace M.", role: "Small Biz Owner", quote: "Posted a request at 9pm — technician was chatting with me by 9:07.", color: "from-secondary/30 to-accent/30" },
];


const features = [
  { icon: Shield, title: "Security Operations", desc: "70+ Linux security tools with AI-powered analysis. Nmap, SQLMap, Metasploit, and more.", tone: "primary" },
  { icon: Bot, title: "AI Assistant", desc: "Private, local AI powered by Ollama. Code review, threat analysis, document summarization.", tone: "secondary" },
  { icon: Terminal, title: "Linux Tools Hub", desc: "Execute security tools directly from the dashboard. Cross-platform with Docker fallback.", tone: "accent" },
  { icon: Users, title: "CRM System", desc: "Full customer management with pipeline tracking, M-Pesa integration, and client portal.", tone: "primary" },
  { icon: BarChart3, title: "Business Analytics", desc: "Real-time dashboards with AI-narrated insights. Revenue, security, and operations metrics.", tone: "secondary" },
  { icon: Code, title: "Cloud IDE", desc: "Browser-based development environment with AI code assistant and Git integration.", tone: "accent" },
  { icon: Network, title: "Network Hub", desc: "Real-time network topology, device discovery, bandwidth monitoring, and VPN management.", tone: "primary" },
  { icon: Zap, title: "Automation Engine", desc: "Scheduled tasks, workflow automation, and event-driven triggers that run your system.", tone: "secondary" },
  { icon: Lock, title: "RBAC Security", desc: "Role-based access control with 6 roles, audit logging, and zero-trust architecture.", tone: "accent" },
  { icon: Server, title: "ERP System", desc: "Finance, invoicing, expense tracking, and M-Pesa payment processing for Kenya.", tone: "primary" },
  { icon: Globe, title: "Client Portal", desc: "Secure portal for clients to track projects, tickets, invoices, and communicate.", tone: "secondary" },
  { icon: Cpu, title: "ITSM Ticketing", desc: "Support ticket system with SLA tracking, AI-suggested resolutions, and knowledge base.", tone: "accent" },
] as const;

const toneClass = (t: "primary" | "secondary" | "accent") =>
  t === "primary" ? "text-primary" : t === "secondary" ? "text-secondary" : "text-accent";
const toneBg = (t: "primary" | "secondary" | "accent") =>
  t === "primary" ? "bg-primary/10 border-primary/30" : t === "secondary" ? "bg-secondary/10 border-secondary/30" : "bg-accent/10 border-accent/30";

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

            <div className="relative">
              <img src={kelvyLogo} alt="Kelvy CyberTech" className="w-9 h-9 rounded-lg relative z-10" />
              <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">KELVY CYBERTECH</span>
              <span className="text-[9px] font-mono text-muted-foreground tracking-[0.2em]">COMMAND CENTER</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="#features" className="hidden md:inline text-xs font-mono text-muted-foreground hover:text-primary transition">Features</a>
            <a href="#how" className="hidden md:inline text-xs font-mono text-muted-foreground hover:text-primary transition">How</a>
            <a href="#love" className="hidden md:inline text-xs font-mono text-muted-foreground hover:text-primary transition">Loved</a>
            <Link to="/auth" className="px-4 py-1.5 rounded-lg border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition">
              Sign In
            </Link>
            <Link to="/auth" className="group relative px-4 py-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-mono font-bold overflow-hidden">
              <span className="relative z-10 flex items-center gap-1">Get Started <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" /></span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        {/* Soft ambient aurora — no harsh flash */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.07),transparent_70%)]" />

        <div aria-hidden className="absolute -top-40 left-1/4 w-[520px] h-[520px] rounded-full bg-primary/10 blur-[120px] animate-float" />
        <div aria-hidden className="absolute top-60 -right-40 w-[460px] h-[460px] rounded-full bg-secondary/10 blur-[120px] animate-float [animation-delay:2s]" />
        <div aria-hidden className="absolute bottom-0 left-10 w-[360px] h-[360px] rounded-full bg-accent/10 blur-[120px] animate-float [animation-delay:4s]" />

        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono mb-6 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> AI-POWERED • OFFLINE-FIRST • ENTERPRISE READY
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">KELVY</span>
            <span className="text-foreground/90"> CYBERTECH HUB</span>
          </h1>

          <div className="font-display text-2xl md:text-4xl font-bold mb-6 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
            <span className="text-muted-foreground">One platform for</span>
            <RotatingWords
              words={["Cybersecurity", "AI Assistance", "Business Ops", "Cloud IDE", "Network Control", "Client Portals", "Automation"]}
              className="bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x"
            />
          </div>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 font-body">
            Request a service, get it done. Clients post jobs, technicians pick them up, admins keep it running — all in one AI-powered command center.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link to="/auth" className="relative overflow-hidden px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-bold hover:opacity-90 transition glow-border group">
              <span className="relative z-10">🚀 Sign Up as Client</span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </Link>
            <Link to="/auth" className="px-6 py-3 rounded-lg border border-primary/50 text-sm font-mono text-primary hover:bg-primary/10 transition">
              Sign In
            </Link>
            <a href="#how" className="px-6 py-3 rounded-lg border border-border text-sm font-mono text-muted-foreground hover:text-foreground hover:border-primary/50 transition">
              How it Works
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-10">
            {stats.map(s => (
              <div key={s.label} className="glass rounded-xl p-4 text-center hover:border-primary/40 transition">
                <p className="text-2xl font-display font-bold text-primary text-glow-green">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          <Marquee items={["SECURE BY DESIGN", "REAL-TIME MONITORING", "ROLE-BASED ACCESS", "AUDIT-READY", "M-PESA READY", "OLLAMA AI", "70+ LINUX TOOLS", "OFFLINE-FIRST"]} />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">How it Works</h2>
            <p className="text-sm text-muted-foreground font-mono">Three roles. One seamless flow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: "01", t: "Client Requests", d: "Sign up in seconds and post a service request — describe the issue, set priority and budget." , c: "text-primary" },
              { n: "02", t: "Technician Claims", d: "Available jobs stream to on-duty technicians. One tap to claim, then update progress in real time.", c: "text-secondary" },
              { n: "03", t: "Admin Oversees", d: "Admins invite technicians, reassign work, monitor SLAs and see every action on the audit timeline.", c: "text-accent" },
            ].map(s => (
              <div key={s.n} className="glass rounded-xl p-6 relative overflow-hidden group">
                <span className={`font-display text-5xl font-bold opacity-20 ${s.c}`}>{s.n}</span>
                <h3 className="font-display text-lg font-bold mt-2 mb-1">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition`} />
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Live Command Center — theme-aware holographic dashboard */}
      <LiveCommandCenter />

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Enterprise Modules</h2>
          <p className="text-sm text-muted-foreground font-mono">Every field of computing. One unified platform.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className={`glass rounded-xl p-5 hover:border-primary/40 transition group relative overflow-hidden`}>
              <div className={`inline-flex w-11 h-11 rounded-lg items-center justify-center border ${toneBg(f.tone)} mb-3 group-hover:scale-110 transition`}>
                <f.icon className={`w-5 h-5 ${toneClass(f.tone)}`} />
              </div>
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

      {/* Testimonials */}
      <section id="love" className="border-t border-border/50 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />
        <div className="max-w-6xl mx-auto px-4 py-16 relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-3">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-mono text-primary tracking-wider">LOVED BY TEAMS</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">People are shipping faster</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map(t => (
              <div key={t.name} className="glass rounded-2xl p-5 relative overflow-hidden group hover:border-primary/40 transition">
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${t.color} blur-2xl opacity-40 group-hover:opacity-70 transition`} />
                <div className="flex gap-0.5 mb-3 relative">
                  {[0,1,2,3,4].map(i => <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4 relative">"{t.quote}"</p>
                <div className="flex items-center gap-2 relative">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-foreground`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Workflow Bento */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Everything talks to everything</h2>
          <p className="text-sm text-muted-foreground font-mono">Real-time chat · file sharing · edits · unsend — built in.</p>
        </div>
        <div className="grid md:grid-cols-6 gap-4">
          <div className="md:col-span-4 glass rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/15 blur-3xl group-hover:bg-primary/25 transition" />
            <MessageSquare className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground mb-2">Unified Messaging</h3>
            <p className="text-sm text-muted-foreground mb-4">Chat with any admin, technician or client. Send images, videos, documents. Edit and unsend just like the apps you already use.</p>
            <div className="flex gap-2 flex-wrap">
              {["Real-time", "Attachments", "Edit", "Unsend", "Role-grouped"].map(x => (
                <span key={x} className="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {x}
                </span>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
            <Bot className="w-8 h-8 text-secondary mb-3 relative" />
            <h3 className="font-display text-lg font-bold text-foreground mb-2 relative">AI Copilot</h3>
            <p className="text-xs text-muted-foreground relative">Local Ollama models draft replies, summarize tickets and analyze scans — offline.</p>
          </div>
          <div className="md:col-span-2 glass rounded-2xl p-6 relative overflow-hidden">
            <Shield className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground mb-2">70+ Tools</h3>
            <p className="text-xs text-muted-foreground">Nmap, SQLMap, Metasploit and more, one click away.</p>
          </div>
          <div className="md:col-span-4 glass rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-accent/15 blur-3xl" />
            <Zap className="w-8 h-8 text-accent mb-3 relative" />
            <h3 className="font-display text-lg font-bold text-foreground mb-2 relative">Automation everywhere</h3>
            <p className="text-sm text-muted-foreground relative">Triggers, schedules and rule-based workflows react the moment something happens.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="relative glass rounded-3xl p-8 md:p-14 border border-primary/20 overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--primary)/0.1),transparent,hsl(var(--secondary)/0.1),transparent,hsl(var(--accent)/0.1),transparent)] animate-[spin_20s_linear_infinite]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary tracking-wider">FREE FOREVER · NO CREDIT CARD</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Ready to Take Control?</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
              Join Kelvy CyberTech Hub and access the most comprehensive AI-powered enterprise platform. Built in Kenya, for the world.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] hover:bg-right text-primary-foreground font-mono text-sm font-bold transition-all duration-500">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-border text-sm font-mono text-muted-foreground hover:border-primary/50 hover:text-primary transition">
                Explore Modules
              </a>
            </div>
          </div>
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
