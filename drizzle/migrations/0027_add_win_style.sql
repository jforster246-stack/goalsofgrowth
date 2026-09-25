-- Let each win carry its own stamp look (icon + accent colour) for the gallery.
ALTER TABLE public.wins ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.wins ADD COLUMN IF NOT EXISTS accent text;

NOTIFY pgrst, 'reload schema';
