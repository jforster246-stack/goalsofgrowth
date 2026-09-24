CREATE TABLE IF NOT EXISTS public.checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_items TO authenticated;
GRANT ALL ON public.checklists TO service_role;
GRANT ALL ON public.checklist_items TO service_role;

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own checklists" ON public.checklists;
CREATE POLICY "Users manage own checklists" ON public.checklists
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own checklist items" ON public.checklist_items;
CREATE POLICY "Users manage own checklist items" ON public.checklist_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.checklists c
      WHERE c.id = checklist_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.checklists c
      WHERE c.id = checklist_id AND c.user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';
