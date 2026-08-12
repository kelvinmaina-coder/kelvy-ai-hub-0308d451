-- 1. Storage: restrict chat attachment reads to owner folder
DROP POLICY IF EXISTS "chat_attach_read" ON storage.objects;
CREATE POLICY "chat_attach_read_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. conversation_participants: only conversation creator can add, or self-add to own conversation
DROP POLICY IF EXISTS "Auth users add participants" ON conversation_participants;
CREATE POLICY "Creator or self add participants" ON conversation_participants FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
);

-- 3. tasks: scope technicians to own assignments
DROP POLICY IF EXISTS "Technicians manage assigned tasks" ON tasks;
CREATE POLICY "Technicians manage assigned tasks" ON tasks FOR ALL TO authenticated
USING (has_role(auth.uid(), 'technician') AND assigned_to = auth.uid())
WITH CHECK (has_role(auth.uid(), 'technician') AND assigned_to = auth.uid());

-- 4. tickets: scope technicians to assigned/unassigned
DROP POLICY IF EXISTS "Technicians can view and update assigned tickets" ON tickets;
DROP POLICY IF EXISTS "Technicians can update tickets" ON tickets;
CREATE POLICY "Technicians view assigned tickets" ON tickets FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'technician') AND (assigned_to = auth.uid() OR assigned_to IS NULL));
CREATE POLICY "Technicians update assigned tickets" ON tickets FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'technician') AND (assigned_to = auth.uid() OR assigned_to IS NULL))
WITH CHECK (has_role(auth.uid(), 'technician') AND (assigned_to = auth.uid() OR assigned_to IS NULL));

-- 5. projects: only projects with a task assigned to the technician
DROP POLICY IF EXISTS "Technicians view assigned tasks projects" ON projects;
CREATE POLICY "Technicians view assigned tasks projects" ON projects FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'technician')
  AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.project_id = projects.id AND t.assigned_to = auth.uid())
);

-- 6. scans: scope technicians/managers to their own scans
DROP POLICY IF EXISTS "Technicians can view scans" ON scans;
DROP POLICY IF EXISTS "Managers can view scans" ON scans;
CREATE POLICY "Technicians view own scans" ON scans FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'technician') AND created_by = auth.uid());
CREATE POLICY "Managers view own scans" ON scans FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'manager') AND created_by = auth.uid());

-- 7. technician_profiles: remove blanket read, expose limited directory view
DROP POLICY IF EXISTS "tp_authenticated_read_basic" ON technician_profiles;

CREATE OR REPLACE VIEW public.technician_directory
WITH (security_invoker = off) AS
SELECT tp.user_id, tp.specialty, tp.availability, tp.rating, tp.jobs_completed, tp.active, p.full_name
FROM public.technician_profiles tp
LEFT JOIN public.profiles p ON p.id = tp.user_id
WHERE tp.active;

REVOKE ALL ON public.technician_directory FROM anon;
GRANT SELECT ON public.technician_directory TO authenticated;

-- 8. Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.audit_profile_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_service_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_tech_completed() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_conversation_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_conversation_ids(uuid) TO authenticated;