-- 1. SERVICE REQUEST SLA + TRACKING FIELDS
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS response_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolve_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS escalated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS track_code uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS service_requests_track_code_key ON public.service_requests(track_code);

-- SLA targets by priority
CREATE OR REPLACE FUNCTION public.sla_targets(_priority text)
RETURNS TABLE(response_mins int, resolve_mins int)
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT * FROM (VALUES
    (CASE lower(coalesce(_priority,'medium'))
      WHEN 'urgent' THEN 60 WHEN 'critical' THEN 60
      WHEN 'high' THEN 120 WHEN 'low' THEN 480 ELSE 240 END,
     CASE lower(coalesce(_priority,'medium'))
      WHEN 'urgent' THEN 240 WHEN 'critical' THEN 240
      WHEN 'high' THEN 480 WHEN 'low' THEN 4320 ELSE 1440 END)
  ) AS t(response_mins, resolve_mins);
$$;

CREATE OR REPLACE FUNCTION public.set_request_sla()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r int; s int;
BEGIN
  SELECT response_mins, resolve_mins INTO r, s FROM public.sla_targets(NEW.priority);
  IF TG_OP = 'INSERT' THEN
    NEW.response_due_at := coalesce(NEW.created_at, now()) + (r || ' minutes')::interval;
    NEW.resolve_due_at  := coalesce(NEW.created_at, now()) + (s || ' minutes')::interval;
  ELSE
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      NEW.response_due_at := coalesce(OLD.created_at, now()) + (r || ' minutes')::interval;
      NEW.resolve_due_at  := coalesce(OLD.created_at, now()) + (s || ' minutes')::interval;
    END IF;
    -- first response = first time it leaves pending or gets a technician
    IF NEW.first_response_at IS NULL
       AND (NEW.assigned_technician IS NOT NULL AND OLD.assigned_technician IS NULL
            OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending')) THEN
      NEW.first_response_at := now();
    END IF;
    -- escalation flag
    IF NEW.status NOT IN ('resolved','completed','cancelled')
       AND NEW.resolve_due_at IS NOT NULL AND NEW.resolve_due_at < now() THEN
      NEW.escalated := true;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sr_sla ON public.service_requests;
CREATE TRIGGER trg_sr_sla
BEFORE INSERT OR UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.set_request_sla();

-- backfill existing rows
UPDATE public.service_requests sr
SET response_due_at = sr.created_at + (((SELECT response_mins FROM public.sla_targets(sr.priority)) || ' minutes')::interval),
    resolve_due_at  = sr.created_at + (((SELECT resolve_mins  FROM public.sla_targets(sr.priority)) || ' minutes')::interval)
WHERE sr.response_due_at IS NULL;

-- 2. SMART AUTO-ASSIGNMENT
CREATE OR REPLACE FUNCTION public.auto_assign_request(_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _cat text; _tech uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT category INTO _cat FROM public.service_requests WHERE id = _request_id;
  IF _cat IS NULL THEN RAISE EXCEPTION 'request not found'; END IF;

  SELECT tp.user_id INTO _tech
  FROM public.technician_profiles tp
  LEFT JOIN (
    SELECT assigned_technician, count(*) AS open_jobs
    FROM public.service_requests
    WHERE status NOT IN ('resolved','completed','cancelled')
    GROUP BY assigned_technician
  ) l ON l.assigned_technician = tp.user_id
  WHERE tp.active = true AND tp.availability <> 'offline'
  ORDER BY
    (lower(tp.specialty) = lower(_cat)) DESC,
    (tp.availability = 'available') DESC,
    coalesce(l.open_jobs,0) ASC,
    tp.rating DESC
  LIMIT 1;

  IF _tech IS NULL THEN RETURN NULL; END IF;

  UPDATE public.service_requests
  SET assigned_technician = _tech,
      status = CASE WHEN status = 'pending' THEN 'assigned' ELSE status END
  WHERE id = _request_id;

  RETURN _tech;
END $$;

REVOKE ALL ON FUNCTION public.auto_assign_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.auto_assign_request(uuid) TO authenticated;

-- 3. QUOTES
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  amount_kes numeric NOT NULL DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'pending',
  valid_until date,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_select_involved" ON public.quotes FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = quotes.request_id
             AND (sr.client_id = auth.uid() OR sr.assigned_technician = auth.uid()))
  OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager')
);

CREATE POLICY "quotes_insert_staff" ON public.quotes FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() AND (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager')
    OR EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = quotes.request_id
               AND sr.assigned_technician = auth.uid())
  )
);

CREATE POLICY "quotes_update_owner_or_client" ON public.quotes FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = quotes.request_id AND sr.client_id = auth.uid())
  OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager')
);

CREATE POLICY "quotes_delete_admin" ON public.quotes FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

DROP TRIGGER IF EXISTS trg_quotes_updated ON public.quotes;
CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. KNOWLEDGE BASE
CREATE TABLE IF NOT EXISTS public.kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  tags text[] NOT NULL DEFAULT '{}',
  source_request_id uuid REFERENCES public.service_requests(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT true,
  views integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_articles TO authenticated;
GRANT ALL ON public.kb_articles TO service_role;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_select_published" ON public.kb_articles FOR SELECT TO authenticated
USING (published = true OR created_by = auth.uid()
       OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "kb_insert_staff" ON public.kb_articles FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND (
  public.has_role(auth.uid(),'technician') OR public.has_role(auth.uid(),'manager')
  OR public.has_role(auth.uid(),'security_analyst') OR public.has_role(auth.uid(),'super_admin')));

CREATE POLICY "kb_update_staff" ON public.kb_articles FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "kb_delete_admin" ON public.kb_articles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'super_admin'));

DROP TRIGGER IF EXISTS trg_kb_updated ON public.kb_articles;
CREATE TRIGGER trg_kb_updated BEFORE UPDATE ON public.kb_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS kb_articles_search_idx ON public.kb_articles
USING gin (to_tsvector('english', title || ' ' || body));

-- 5. RATING ROLLUP INTO TECHNICIAN PROFILES
CREATE OR REPLACE FUNCTION public.recalc_tech_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND NEW.assigned_technician IS NOT NULL
     AND NEW.rating IS DISTINCT FROM OLD.rating THEN
    UPDATE public.technician_profiles tp
    SET rating = COALESCE((
      SELECT round(avg(sr.rating)::numeric, 2) FROM public.service_requests sr
      WHERE sr.assigned_technician = NEW.assigned_technician AND sr.rating IS NOT NULL), 0),
      updated_at = now()
    WHERE tp.user_id = NEW.assigned_technician;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sr_rating ON public.service_requests;
CREATE TRIGGER trg_sr_rating AFTER UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.recalc_tech_rating();

-- 6. PUBLIC TRACKING LOOKUP (no table exposure)
CREATE OR REPLACE FUNCTION public.track_request(_code uuid)
RETURNS TABLE(
  title text, category text, priority text, status text,
  created_at timestamptz, first_response_at timestamptz,
  resolve_due_at timestamptz, completed_at timestamptz,
  technician_first_name text, escalated boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sr.title, sr.category, sr.priority, sr.status,
         sr.created_at, sr.first_response_at, sr.resolve_due_at, sr.completed_at,
         split_part(coalesce(p.full_name,''), ' ', 1),
         sr.escalated
  FROM public.service_requests sr
  LEFT JOIN public.profiles p ON p.id = sr.assigned_technician
  WHERE sr.track_code = _code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.track_request(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sla_targets(text) TO authenticated;