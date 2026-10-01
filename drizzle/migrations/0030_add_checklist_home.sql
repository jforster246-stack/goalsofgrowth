-- Up to three routines can be pinned to the home page.
ALTER TABLE public.checklists
  ADD COLUMN IF NOT EXISTS on_home boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
