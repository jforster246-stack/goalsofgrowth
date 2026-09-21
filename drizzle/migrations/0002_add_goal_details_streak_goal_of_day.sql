ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS why text;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS vision text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS goal_of_day_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS goal_of_day_date date;