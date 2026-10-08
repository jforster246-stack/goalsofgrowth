-- A While Away upgrade: hobby description/accent/put-away, log duration +
-- photos, and a private per-user photo bucket.
ALTER TABLE public.awa_hobbies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.awa_hobbies ADD COLUMN IF NOT EXISTS accent text;
ALTER TABLE public.awa_hobbies ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.awa_logs ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.awa_logs ADD COLUMN IF NOT EXISTS photo_path text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('awa-photos', 'awa-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Photos live at {user_id}/{file}; each user can only touch their own folder.
DROP POLICY IF EXISTS "Users read own awa photos" ON storage.objects;
CREATE POLICY "Users read own awa photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'awa-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users add own awa photos" ON storage.objects;
CREATE POLICY "Users add own awa photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'awa-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own awa photos" ON storage.objects;
CREATE POLICY "Users update own awa photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'awa-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own awa photos" ON storage.objects;
CREATE POLICY "Users delete own awa photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'awa-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

NOTIFY pgrst, 'reload schema';
