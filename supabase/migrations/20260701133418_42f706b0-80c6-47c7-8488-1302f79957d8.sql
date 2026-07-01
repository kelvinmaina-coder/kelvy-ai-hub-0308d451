
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_technician UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  location TEXT,
  budget_kes NUMERIC,
  attachments JSONB DEFAULT '[]'::jsonb,
  technician_notes TEXT,
  admin_notes TEXT,
  rating INTEGER,
  feedback TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Clients: manage their own requests
CREATE POLICY "clients_view_own_requests" ON public.service_requests
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "clients_create_requests" ON public.service_requests
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "clients_update_own_pending" ON public.service_requests
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Technicians: see unassigned + assigned to them, and update those
CREATE POLICY "technicians_view_available" ON public.service_requests
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'technician')
    AND (assigned_technician IS NULL OR assigned_technician = auth.uid())
  );

CREATE POLICY "technicians_update_assigned" ON public.service_requests
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'technician')
    AND (assigned_technician IS NULL OR assigned_technician = auth.uid())
  );

-- Admin / manager: full control
CREATE POLICY "admins_full_access" ON public.service_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_service_requests_client ON public.service_requests(client_id);
CREATE INDEX idx_service_requests_tech ON public.service_requests(assigned_technician);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);

ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
