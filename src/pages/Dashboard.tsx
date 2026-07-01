import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import TechnicianDashboard from "./TechnicianDashboard";
import ClientDashboard from "./ClientDashboard";

export default function Dashboard() {
  const { roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Highest role wins for the landing dashboard
  if (roles.includes("super_admin") || roles.includes("manager")) return <AdminDashboard />;
  if (roles.includes("technician")) return <TechnicianDashboard />;
  if (roles.includes("security_analyst")) return <AdminDashboard />;
  return <ClientDashboard />;
}
