-- Finance planner: income/expense line items per user.
CREATE TABLE IF NOT EXISTS public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null,
  amount numeric(12,2) not null default 0,
  kind text not null default 'expense',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries TO authenticated;
GRANT ALL ON public.finance_entries TO service_role;

ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own finance entries" ON public.finance_entries;
CREATE POLICY "Users manage own finance entries" ON public.finance_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
