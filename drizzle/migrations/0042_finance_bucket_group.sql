-- Finance planner: mark each bucket as spending or saving (null = guess from its name).
ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS bucket_group text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'finance_entries_bucket_group_check'
  ) THEN
    ALTER TABLE public.finance_entries
      ADD CONSTRAINT finance_entries_bucket_group_check
      CHECK (bucket_group IS NULL OR bucket_group IN ('spending', 'saving'));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
