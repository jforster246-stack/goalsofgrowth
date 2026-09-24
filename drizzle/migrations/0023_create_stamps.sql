CREATE TABLE IF NOT EXISTS public.stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  goal_id uuid,
  title text not null,
  icon text,
  accent text not null default 'mint',
  earned_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stamps TO authenticated;
GRANT ALL ON public.stamps TO service_role;

ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own stamps" ON public.stamps;
CREATE POLICY "Users manage own stamps" ON public.stamps
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
