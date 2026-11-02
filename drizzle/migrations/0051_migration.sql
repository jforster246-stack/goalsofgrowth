create table if not exists public.observatory_progress (
  user_id uuid primary key,
  baseline integer,
  revealed jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.observatory_progress to authenticated;
grant all on public.observatory_progress to service_role;
alter table public.observatory_progress enable row level security;
drop policy if exists "own observatory progress" on public.observatory_progress;
create policy "own observatory progress" on public.observatory_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
notify pgrst, 'reload schema';