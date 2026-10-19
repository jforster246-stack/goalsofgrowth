CREATE UNIQUE INDEX IF NOT EXISTS stamps_user_goal_unique ON public.stamps (user_id, goal_id);
NOTIFY pgrst, 'reload schema';