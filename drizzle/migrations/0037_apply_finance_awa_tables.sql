create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null,
  amount numeric(12,2) not null default 0,
  kind text not null default 'expense',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.steps add column if not exists completed_on date;

create table if not exists public.awa_hobbies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  icon text,
  category text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.awa_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  hobby_id uuid,
  hobby_name text not null default '',
  hobby_icon text,
  minutes integer not null default 0,
  activity_time text,
  note text,
  logged_on date not null default current_date,
  created_at timestamptz not null default now()
);
create table if not exists public.awa_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.awa_logs add column if not exists activity_time text;

grant select, insert, update, delete on
  public.finance_entries, public.awa_hobbies, public.awa_logs, public.awa_wishlist
  to authenticated;
grant all on
  public.finance_entries, public.awa_hobbies, public.awa_logs, public.awa_wishlist
  to service_role;

alter table public.finance_entries enable row level security;
alter table public.awa_hobbies enable row level security;
alter table public.awa_logs enable row level security;
alter table public.awa_wishlist enable row level security;

drop policy if exists "Users manage own finance entries" on public.finance_entries;
create policy "Users manage own finance entries" on public.finance_entries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own awa hobbies" on public.awa_hobbies;
create policy "Users manage own awa hobbies" on public.awa_hobbies
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own awa logs" on public.awa_logs;
create policy "Users manage own awa logs" on public.awa_logs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own awa wishlist" on public.awa_wishlist;
create policy "Users manage own awa wishlist" on public.awa_wishlist
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';