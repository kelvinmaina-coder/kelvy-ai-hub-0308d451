import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import SecurityHub from "@/pages/SecurityHub";
import AIAssistant from "@/pages/AIAssistant";
import LinuxTools from "@/pages/LinuxTools";
import CRM from "@/pages/CRM";
import ERP from "@/pages/ERP";
import ITSM from "@/pages/ITSM";
import Analytics from "@/pages/Analytics";
import NetworkHub from "@/pages/NetworkHub";
import IDE from "@/pages/IDE";
import Automation from "@/pages/Automation";
import ClientPortal from "@/pages/ClientPortal";
import SettingsPage from "@/pages/SettingsPage";
import Chat from "@/pages/Chat";
import Notifications from "@/pages/Notifications";
import Calls from "@/pages/Calls";
import Meetings from "@/pages/Meetings";
import MeetingRoom from "@/pages/MeetingRoom";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/meeting/:id" element={
                <ProtectedRoute>
                  <MeetingRoom />
                </ProtectedRoute>
              } />
              <Route path="/*" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/dashboard" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager", "security_analyst", "technician", "client", "guest"]}>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/security" element={
                        <ProtectedRoute allowedRoles={["super_admin", "security_analyst"]}>
                          <SecurityHub />
                        </ProtectedRoute>
                      } />
                      <Route path="/ai" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager", "security_analyst", "technician"]}>
                          <AIAssistant />
                        </ProtectedRoute>
                      } />
                      <Route path="/tools" element={
                        <ProtectedRoute allowedRoles={["super_admin", "security_analyst", "technician"]}>
                          <LinuxTools />
                        </ProtectedRoute>
                      } />
                      <Route path="/crm" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager"]}>
                          <CRM />
                        </ProtectedRoute>
                      } />
                      <Route path="/erp" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager"]}>
                          <ERP />
                        </ProtectedRoute>
                      } />
                      <Route path="/itsm" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager", "technician"]}>
                          <ITSM />
                        </ProtectedRoute>
                      } />
                      <Route path="/analytics" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager"]}>
                          <Analytics />
                        </ProtectedRoute>
                      } />
                      <Route path="/network" element={
                        <ProtectedRoute allowedRoles={["super_admin", "security_analyst"]}>
                          <NetworkHub />
                        </ProtectedRoute>
                      } />
                      <Route path="/ide" element={
                        <ProtectedRoute allowedRoles={["super_admin", "technician"]}>
                          <IDE />
                        </ProtectedRoute>
                      } />
                      <Route path="/automation" element={
                        <ProtectedRoute allowedRoles={["super_admin", "technician"]}>
                          <Automation />
                        </ProtectedRoute>
                      } />
                      <Route path="/portal" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager", "client"]}>
                          <ClientPortal />
                        </ProtectedRoute>
                      } />
                      <Route path="/chat" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager", "security_analyst", "technician", "client"]}>
                          <Chat />
                        </ProtectedRoute>
                      } />
                      <Route path="/notifications" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager", "security_analyst", "technician", "client"]}>
                          <Notifications />
                        </ProtectedRoute>
                      } />
                      <Route path="/calls" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager", "security_analyst", "technician", "client"]}>
                          <Calls />
                        </ProtectedRoute>
                      } />
                      <Route path="/meetings" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager", "security_analyst", "technician", "client"]}>
                          <Meetings />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute allowedRoles={["super_admin", "manager", "security_analyst", "technician", "client"]}>
                          <SettingsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
