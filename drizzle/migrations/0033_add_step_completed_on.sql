-- Records the local day a step was ticked off, so we can tally tasks per day.
ALTER TABLE public.steps
  ADD COLUMN IF NOT EXISTS completed_on date;

NOTIFY pgrst, 'reload schema';
