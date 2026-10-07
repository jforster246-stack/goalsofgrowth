-- Optional clock time an activity happened (e.g. "18:30"). Kept separate from
-- created_at so activities can be logged retrospectively.
ALTER TABLE public.awa_logs
  ADD COLUMN IF NOT EXISTS activity_time text;

NOTIFY pgrst, 'reload schema';
