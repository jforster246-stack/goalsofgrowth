ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS icon text;
NOTIFY pgrst, 'reload schema';
