ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS start_date date;
NOTIFY pgrst, 'reload schema';