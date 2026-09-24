CREATE TABLE IF NOT EXISTS public.bingo_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  size integer not null default 3,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.bingo_cells (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.bingo_cards(id) on delete cascade,
  position integer not null,
  text text not null default '',
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (card_id, position)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bingo_cards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bingo_cells TO authenticated;
GRANT ALL ON public.bingo_cards TO service_role;
GRANT ALL ON public.bingo_cells TO service_role;

ALTER TABLE public.bingo_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bingo_cells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own bingo cards" ON public.bingo_cards;
CREATE POLICY "Users manage own bingo cards" ON public.bingo_cards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own bingo cells" ON public.bingo_cells;
CREATE POLICY "Users manage own bingo cells" ON public.bingo_cells
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bingo_cards c
      WHERE c.id = card_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bingo_cards c
      WHERE c.id = card_id AND c.user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';
