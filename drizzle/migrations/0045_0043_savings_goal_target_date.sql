-- Savings goals: an optional date to aim for.
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS target_date date;

NOTIFY pgrst, 'reload schema';