ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS account text;

ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS note text;

CREATE TABLE IF NOT EXISTS public.finance_settings (
  user_id uuid primary key,
  pay_cycle text not null default 'monthly' check (pay_cycle in ('weekly', 'fortnightly', 'monthly')),
  pay_anchor date,
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  target numeric(12,2) not null default 0,
  saved numeric(12,2) not null default 0,
  per_pay numeric(12,2) not null default 0,
  icon text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_settings, public.savings_goals TO authenticated;
GRANT ALL ON public.finance_settings, public.savings_goals TO service_role;

ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own finance settings" ON public.finance_settings;
CREATE POLICY "Users manage own finance settings" ON public.finance_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own savings goals" ON public.savings_goals;
CREATE POLICY "Users manage own savings goals" ON public.savings_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';