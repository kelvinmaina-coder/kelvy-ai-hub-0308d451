DROP POLICY IF EXISTS "chat_attach_read_own" ON storage.objects;
CREATE POLICY "chat_attach_read_members" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[2] ~ '^[0-9]+$'
      AND ((storage.foldername(name))[2])::int IN (SELECT public.user_conversation_ids(auth.uid()))
    )
  )
);