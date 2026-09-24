CREATE TABLE IF NOT EXISTS public.brain_dump_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  text text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_dump_items TO authenticated;
GRANT ALL ON public.brain_dump_items TO service_role;
ALTER TABLE public.brain_dump_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own brain dump" ON public.brain_dump_items;
CREATE POLICY "Users manage own brain dump" ON public.brain_dump_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
NOTIFY pgrst, 'reload schema';