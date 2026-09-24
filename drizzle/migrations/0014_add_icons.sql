ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS icon text;
NOTIFY pgrst, 'reload schema';
