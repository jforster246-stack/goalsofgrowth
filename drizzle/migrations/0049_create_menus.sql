CREATE TABLE public.menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  icon text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.menu_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  duration_minutes integer,
  energy text CHECK (energy IN ('low','medium','high')),
  kind text NOT NULL DEFAULT 'other',
  notes text,
  step_id uuid REFERENCES public.steps(id) ON DELETE SET NULL,
  hobby_id uuid REFERENCES public.awa_hobbies(id) ON DELETE SET NULL,
  last_done_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX menu_activities_step_uniq ON public.menu_activities(user_id, step_id) WHERE step_id IS NOT NULL;
CREATE UNIQUE INDEX menu_activities_hobby_uniq ON public.menu_activities(user_id, hobby_id) WHERE hobby_id IS NOT NULL;
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES public.menu_activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (menu_id, activity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menus, public.menu_activities, public.menu_items TO authenticated;
GRANT ALL ON public.menus, public.menu_activities, public.menu_items TO service_role;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own menus" ON public.menus FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own menu activities" ON public.menu_activities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own menu items" ON public.menu_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
NOTIFY pgrst, 'reload schema';