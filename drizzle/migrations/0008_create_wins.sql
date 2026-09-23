CREATE TABLE IF NOT EXISTS public.wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  note text,
  kind text not null default 'achievement' check (kind in ('achievement', 'life_event')),
  achieved_on date not null default current_date,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wins TO authenticated;
GRANT ALL ON public.wins TO service_role;

ALTER TABLE public.wins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own wins" ON public.wins;
CREATE POLICY "Users manage own wins" ON public.wins
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';