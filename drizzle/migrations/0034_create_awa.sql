-- A While Away: a calm hobby/activity tracker folded into the app.
CREATE TABLE IF NOT EXISTS public.awa_hobbies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  icon text,
  category text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.awa_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  hobby_id uuid,
  hobby_name text not null default '',
  hobby_icon text,
  minutes integer not null default 0,
  note text,
  logged_on date not null default current_date,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.awa_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.awa_hobbies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.awa_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.awa_wishlist TO authenticated;
GRANT ALL ON public.awa_hobbies TO service_role;
GRANT ALL ON public.awa_logs TO service_role;
GRANT ALL ON public.awa_wishlist TO service_role;

ALTER TABLE public.awa_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awa_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awa_wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own awa hobbies" ON public.awa_hobbies;
CREATE POLICY "Users manage own awa hobbies" ON public.awa_hobbies
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own awa logs" ON public.awa_logs;
CREATE POLICY "Users manage own awa logs" ON public.awa_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own awa wishlist" ON public.awa_wishlist;
CREATE POLICY "Users manage own awa wishlist" ON public.awa_wishlist
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
