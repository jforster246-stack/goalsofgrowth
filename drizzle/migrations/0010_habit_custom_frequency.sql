ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_frequency_check;

ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS days_of_week text;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS interval_days integer;

NOTIFY pgrst, 'reload schema';
