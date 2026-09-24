ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_frequency_check;
ALTER TABLE public.habits ADD CONSTRAINT habits_frequency_check CHECK (frequency IN ('daily','weekdays','weekends','specific_days','interval','weekly','fortnightly','monthly'));
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS days_of_week text;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS interval_days integer;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS archived_at timestamptz;
NOTIFY pgrst, 'reload schema';