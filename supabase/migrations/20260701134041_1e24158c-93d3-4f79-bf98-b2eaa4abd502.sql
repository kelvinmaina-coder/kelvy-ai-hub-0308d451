
-- Trigger fn: service_requests audit
CREATE OR REPLACE FUNCTION public.audit_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, details_json)
    VALUES (actor, 'service_request.created', 'service_requests:' || NEW.id::text,
      jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'category', NEW.category, 'client_id', NEW.client_id));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.assigned_technician IS DISTINCT FROM OLD.assigned_technician THEN
      INSERT INTO public.audit_logs (user_id, action, resource, details_json)
      VALUES (actor,
        CASE WHEN OLD.assigned_technician IS NULL THEN 'service_request.assigned'
             WHEN NEW.assigned_technician IS NULL THEN 'service_request.unassigned'
             ELSE 'service_request.reassigned' END,
        'service_requests:' || NEW.id::text,
        jsonb_build_object('title', NEW.title,
          'from_technician', OLD.assigned_technician,
          'to_technician', NEW.assigned_technician));
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.audit_logs (user_id, action, resource, details_json)
      VALUES (actor, 'service_request.status_changed',
        'service_requests:' || NEW.id::text,
        jsonb_build_object('title', NEW.title, 'from_status', OLD.status, 'to_status', NEW.status));
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, details_json)
    VALUES (actor, 'service_request.deleted', 'service_requests:' || OLD.id::text,
      jsonb_build_object('title', OLD.title));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_service_request ON public.service_requests;
CREATE TRIGGER trg_audit_service_request
AFTER INSERT OR UPDATE OR DELETE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_service_request();

-- Trigger fn: user_roles audit
CREATE OR REPLACE FUNCTION public.audit_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, details_json)
    VALUES (actor, 'role.granted', 'user_roles:' || NEW.user_id::text,
      jsonb_build_object('target_user', NEW.user_id, 'role', NEW.role));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, details_json)
    VALUES (actor, 'role.revoked', 'user_roles:' || OLD.user_id::text,
      jsonb_build_object('target_user', OLD.user_id, 'role', OLD.role));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_user_role ON public.user_roles;
CREATE TRIGGER trg_audit_user_role
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_user_role();

-- Trigger fn: profile approval audit
CREATE OR REPLACE FUNCTION public.audit_profile_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approved IS DISTINCT FROM OLD.approved THEN
    INSERT INTO public.audit_logs (user_id, action, resource, details_json)
    VALUES (auth.uid(),
      CASE WHEN NEW.approved THEN 'user.approved' ELSE 'user.unapproved' END,
      'profiles:' || NEW.id::text,
      jsonb_build_object('target_user', NEW.id, 'full_name', NEW.full_name));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_profile_approval ON public.profiles;
CREATE TRIGGER trg_audit_profile_approval
AFTER UPDATE OF approved ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_profile_approval();

ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
