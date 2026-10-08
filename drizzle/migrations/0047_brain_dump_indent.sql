-- Brain dump: Notion-style sub-items (indent level 0-2).
ALTER TABLE public.brain_dump_items ADD COLUMN IF NOT EXISTS indent smallint NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';