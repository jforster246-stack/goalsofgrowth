CREATE TABLE public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  time_of_day text not null default 'morning' check (time_of_day in ('morning', 'afternoon')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- One row per habit per day it was completed; presence = "done that day".
CREATE TABLE public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_completions TO authenticated;
GRANT ALL ON public.habits TO service_role;
GRANT ALL ON public.habit_completions TO service_role;

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own habits" ON public.habits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own habit completions" ON public.habit_completions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_completions.habit_id AND h.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_completions.habit_id AND h.user_id = auth.uid()));
