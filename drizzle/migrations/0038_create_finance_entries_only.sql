create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null,
  amount numeric(12,2) not null default 0,
  kind text not null default 'expense',
  position integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.finance_entries to authenticated;
grant all on public.finance_entries to service_role;
alter table public.finance_entries enable row level security;
drop policy if exists "Users manage own finance entries" on public.finance_entries;
create policy "Users manage own finance entries" on public.finance_entries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);