-- Stamps earned from the sign-in streak (5 per 7 days in a row).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bonus_stamps integer NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';
