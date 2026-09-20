CREATE TABLE public.goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  accent text not null default 'mint',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

CREATE TABLE public.steps (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO anon;
GRANT ALL ON public.goals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.steps TO anon;
GRANT ALL ON public.steps TO service_role;

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage goals"
  ON public.goals FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage steps"
  ON public.steps FOR ALL TO anon
  USING (true) WITH CHECK (true);