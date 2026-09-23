ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS archived_at timestamptz;

NOTIFY pgrst, 'reload schema';
