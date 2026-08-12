DROP VIEW IF EXISTS public.technician_directory;

-- Column-limited read access for regular authenticated users
REVOKE SELECT ON public.technician_profiles FROM authenticated;
GRANT SELECT (id, user_id, specialty, availability, rating, jobs_completed, active, created_at, updated_at)
  ON public.technician_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.technician_profiles TO authenticated;
GRANT ALL ON public.technician_profiles TO service_role;

CREATE POLICY "tp_directory_read_active" ON public.technician_profiles FOR SELECT TO authenticated
USING (active);