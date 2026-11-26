CREATE TABLE IF NOT EXISTS public.planner_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  week_start date NOT NULL,
  audit jsonb NOT NULL DEFAULT '{}'::jsonb,
  reflections jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_weeks TO authenticated;
GRANT ALL ON public.planner_weeks TO service_role;
ALTER TABLE public.planner_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own planner weeks" ON public.planner_weeks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.planner_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  day date NOT NULL,
  slot text NOT NULL CHECK (slot IN ('allday','morning','midday','awa','evening','lunch','dinner')),
  time text,
  title text NOT NULL,
  location text,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS planner_items_user_day ON public.planner_items (user_id, day);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_items TO authenticated;
GRANT ALL ON public.planner_items TO service_role;
ALTER TABLE public.planner_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own planner items" ON public.planner_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
NOTIFY pgrst, 'reload schema';