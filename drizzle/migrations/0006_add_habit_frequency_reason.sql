ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('daily', 'weekly', 'fortnightly', 'monthly'));

ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS reason text;
