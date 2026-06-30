import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Shield, Bot, Users, Briefcase, Ticket,
  BarChart3, Network, Code, Settings, Terminal, ChevronLeft,
  ChevronRight, Zap, Globe, Menu, LogOut, MessageSquare, Bell,
  Phone, Calendar
} from "lucide-react";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import NotificationBell from "@/components/NotificationBell";
import CallNotificationModal from "@/components/CallNotificationModal";
import kelvyLogo from "@/assets/kelvy-logo.png";

interface NavItem {
  icon: any;
  label: string;
  path: string;
  roles: AppRole[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["super_admin", "manager", "security_analyst", "technician", "client", "guest"] },
  { icon: Shield, label: "Security Hub", path: "/security", roles: ["super_admin", "security_analyst"] },
  { icon: Bot, label: "AI Assistant", path: "/ai", roles: ["super_admin", "manager", "security_analyst", "technician"] },
  { icon: Terminal, label: "Linux Tools", path: "/tools", roles: ["super_admin", "security_analyst", "technician"] },
  { icon: MessageSquare, label: "Chat", path: "/chat", roles: ["super_admin", "manager", "security_analyst", "technician", "client"] },
  { icon: Users, label: "CRM", path: "/crm", roles: ["super_admin", "manager"] },
  { icon: Briefcase, label: "ERP", path: "/erp", roles: ["super_admin", "manager"] },
  { icon: Ticket, label: "ITSM", path: "/itsm", roles: ["super_admin", "manager", "technician"] },
  { icon: BarChart3, label: "Analytics", path: "/analytics", roles: ["super_admin", "manager"] },
  { icon: Network, label: "Network", path: "/network", roles: ["super_admin", "security_analyst"] },
  { icon: Code, label: "IDE", path: "/ide", roles: ["super_admin", "technician"] },
  { icon: Zap, label: "Automation", path: "/automation", roles: ["super_admin", "technician"] },
  { icon: Globe, label: "Client Portal", path: "/portal", roles: ["super_admin", "manager", "client"] },
  { icon: Phone, label: "Calls", path: "/calls", roles: ["super_admin", "manager", "security_analyst", "technician", "client"] },
  { icon: Calendar, label: "Meetings", path: "/meetings", roles: ["super_admin", "manager", "security_analyst", "technician", "client"] },
  { icon: Settings, label: "Settings", path: "/settings", roles: ["super_admin", "manager", "security_analyst", "technician", "client"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { roles, profile, signOut } = useAuth();
  const { scanlineEnabled } = useTheme();

  const visibleNav = navItems.filter(item => item.roles.some(r => roles.includes(r)));

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <img src={kelvyLogo} alt="Kelvy CyberTech Hub" className="w-10 h-10 rounded-lg" />
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-display text-sm font-bold text-primary truncate text-glow-green">KELVY CYBERTECH</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest">HUB v1.0</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 group
                ${active ? "bg-primary/10 text-primary border-glow-green" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : ""}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-1">
        <ThemeSwitcher collapsed={collapsed} />
      </div>

      {!collapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {(profile?.full_name || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground truncate">{profile?.full_name || "User"}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{roles[0] || "client"}</p>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition font-mono">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      )}

      <button onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center p-3 border-t border-border text-muted-foreground hover:text-foreground transition">
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border flex flex-col transition-transform duration-300 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>
      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-border shrink-0 transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}>
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 glass-strong">
          <button className="lg:hidden text-muted-foreground" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell />
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-muted-foreground font-mono">SYSTEM ONLINE</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 cyber-grid">
          {scanlineEnabled && <div className="scanline fixed inset-0 pointer-events-none z-50" />}
          {children}
        </main>
      </div>
      <CallNotificationModal />
    </div>
  );
}
