ALTER TABLE public.awa_hobbies ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
NOTIFY pgrst, 'reload schema';