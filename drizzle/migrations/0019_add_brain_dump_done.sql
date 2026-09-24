ALTER TABLE public.brain_dump_items ADD COLUMN IF NOT EXISTS done boolean NOT NULL DEFAULT false;
NOTIFY pgrst, 'reload schema';