-- Purchased artworks (from the daily picks) and the gallery showcase slots.
CREATE TABLE IF NOT EXISTS public.artwork_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  artwork_id integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, artwork_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artwork_purchases TO authenticated;
GRANT ALL ON public.artwork_purchases TO service_role;

ALTER TABLE public.artwork_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own artwork purchases" ON public.artwork_purchases;
CREATE POLICY "Users manage own artwork purchases" ON public.artwork_purchases
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.gallery_showcase (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  position integer not null,
  artwork_id integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, position)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_showcase TO authenticated;
GRANT ALL ON public.gallery_showcase TO service_role;

ALTER TABLE public.gallery_showcase ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own gallery showcase" ON public.gallery_showcase;
CREATE POLICY "Users manage own gallery showcase" ON public.gallery_showcase
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
