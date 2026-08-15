import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/hooks/useAuth";
import {
  LayoutDashboard, Shield, Bot, Terminal, MessageSquare, Users, Briefcase, Ticket, BarChart3,
  Network, Code, Zap, Globe, Phone, Calendar, Wrench, UserCircle, ScrollText, Settings, BookOpen, Search, LogOut,
} from "lucide-react";

const ROUTES: { icon: any; label: string; path: string; roles: AppRole[] }[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["super_admin", "manager", "security_analyst", "technician", "client", "guest"] },
  { icon: Shield, label: "Security Hub", path: "/security", roles: ["super_admin", "security_analyst"] },
  { icon: Bot, label: "AI Assistant", path: "/ai", roles: ["super_admin", "manager", "security_analyst", "technician"] },
  { icon: Terminal, label: "Linux Tools", path: "/tools", roles: ["super_admin", "security_analyst", "technician"] },
  { icon: MessageSquare, label: "Chat", path: "/chat", roles: ["super_admin", "manager", "security_analyst", "technician", "client"] },
  { icon: BookOpen, label: "Knowledge Base", path: "/kb", roles: ["super_admin", "manager", "security_analyst", "technician", "client"] },
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
  { icon: Wrench, label: "Technicians", path: "/admin/technicians", roles: ["super_admin", "manager"] },
  { icon: UserCircle, label: "Clients", path: "/admin/clients", roles: ["super_admin", "manager"] },
  { icon: ScrollText, label: "Audit Log", path: "/audit", roles: ["super_admin", "manager"] },
  { icon: Settings, label: "Settings", path: "/settings", roles: ["super_admin", "manager", "security_analyst", "technician", "client"] },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const navigate = useNavigate();
  const { roles, signOut } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) { setRequests([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("service_requests")
        .select("id, title, status, priority")
        .ilike("title", `%${query.trim()}%`)
        .limit(6);
      if (!cancelled) setRequests(data || []);
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, open]);

  const go = (path: string) => { setOpen(false); setQuery(""); navigate(path); };
  const visible = ROUTES.filter(r => r.roles.some(x => roles.includes(x)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a page or search requests…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {visible.map(r => (
            <CommandItem key={r.path} value={r.label} onSelect={() => go(r.path)}>
              <r.icon className="w-4 h-4 mr-2 text-primary" /> {r.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {requests.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Service Requests">
              {requests.map(r => (
                <CommandItem key={r.id} value={`sr-${r.id}`} onSelect={() => go("/dashboard")}>
                  <Search className="w-4 h-4 mr-2 text-secondary" />
                  <span className="truncate">{r.title}</span>
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground">{r.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem value="sign out" onSelect={() => { setOpen(false); signOut(); }}>
            <LogOut className="w-4 h-4 mr-2 text-destructive" /> Sign Out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
