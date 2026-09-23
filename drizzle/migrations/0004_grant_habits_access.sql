GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_completions TO authenticated;
GRANT ALL ON public.habit_completions TO service_role;

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own habits" ON public.habits;
CREATE POLICY "Users manage own habits" ON public.habits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own habit completions" ON public.habit_completions;
CREATE POLICY "Users manage own habit completions" ON public.habit_completions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_completions.habit_id AND h.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_completions.habit_id AND h.user_id = auth.uid()));

NOTIFY pgrst, 'reload schema';