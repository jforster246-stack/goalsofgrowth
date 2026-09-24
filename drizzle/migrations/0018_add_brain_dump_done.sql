ALTER TABLE public.brain_dump_items ADD COLUMN IF NOT EXISTS done boolean not null default false;
NOTIFY pgrst, 'reload schema';
