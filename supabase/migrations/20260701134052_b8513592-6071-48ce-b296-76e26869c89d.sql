
REVOKE EXECUTE ON FUNCTION public.audit_service_request() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_profile_approval() FROM anon, authenticated, public;
