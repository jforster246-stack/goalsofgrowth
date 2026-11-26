CREATE TABLE IF NOT EXISTS public.planner_reset_drafts (
  user_id uuid PRIMARY KEY,
  draft jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_reset_drafts TO authenticated;
GRANT ALL ON public.planner_reset_drafts TO service_role;
ALTER TABLE public.planner_reset_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage weekly reset drafts" ON public.planner_reset_drafts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
NOTIFY pgrst, 'reload schema';