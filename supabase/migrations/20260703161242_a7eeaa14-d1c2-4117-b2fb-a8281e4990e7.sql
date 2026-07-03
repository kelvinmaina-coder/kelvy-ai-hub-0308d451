
-- ============ technician_profiles ============
CREATE TABLE IF NOT EXISTS public.technician_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL DEFAULT 'general',
  bio TEXT,
  availability TEXT NOT NULL DEFAULT 'available', -- available | busy | offline
  active BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  jobs_completed INT NOT NULL DEFAULT 0,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_profiles TO authenticated;
GRANT ALL ON public.technician_profiles TO service_role;

ALTER TABLE public.technician_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tp_admins_all ON public.technician_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY tp_self_read ON public.technician_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY tp_self_update ON public.technician_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Any authenticated user can read basic tech info (name/specialty visible to clients on their assigned requests)
CREATE POLICY tp_authenticated_read_basic ON public.technician_profiles FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER trg_tp_updated BEFORE UPDATE ON public.technician_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ service_request_updates (timeline) ============
CREATE TABLE IF NOT EXISTS public.service_request_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  status_from TEXT,
  status_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.service_request_updates TO authenticated;
GRANT ALL ON public.service_request_updates TO service_role;

ALTER TABLE public.service_request_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY sru_view ON public.service_request_updates FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager')
    OR EXISTS (SELECT 1 FROM public.service_requests r WHERE r.id = request_id AND
      (r.client_id = auth.uid() OR r.assigned_technician = auth.uid()))
  );

CREATE POLICY sru_insert ON public.service_request_updates FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid() AND (
      public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager')
      OR EXISTS (SELECT 1 FROM public.service_requests r WHERE r.id = request_id AND
        (r.client_id = auth.uid() OR r.assigned_technician = auth.uid()))
    )
  );

-- ============ auto-increment jobs_completed on resolve ============
CREATE OR REPLACE FUNCTION public.increment_tech_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status IS DISTINCT FROM 'resolved' AND NEW.assigned_technician IS NOT NULL THEN
    UPDATE public.technician_profiles
      SET jobs_completed = jobs_completed + 1,
          updated_at = now()
      WHERE user_id = NEW.assigned_technician;
    IF NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sr_complete ON public.service_requests;
CREATE TRIGGER trg_sr_complete BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.increment_tech_completed();
