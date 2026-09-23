import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ACCENTS = ["mint", "sea", "clay"] as const;

const PROFILE_FIELDS =
  "id, display_name, streak_count, longest_streak, last_active_date, goal_of_day_id, goal_of_day_date";

const emptyProfile = (id: string) => ({
  id,
  display_name: null as string | null,
  streak_count: 0,
  longest_streak: 0,
  last_active_date: null as string | null,
  goal_of_day_id: null as string | null,
  goal_of_day_date: null as string | null,
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? emptyProfile(context.userId);
  });

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Records a sign-in for the given local day and rolls the streak forward. */
export const touchStreak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ today: dateSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const current = profile ?? emptyProfile(context.userId);
    if (current.last_active_date === data.today) return current;

    const yesterday = new Date(`${data.today}T00:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    const streak =
      current.last_active_date === yesterdayKey
        ? (current.streak_count ?? 0) + 1
        : 1;

    const next = {
      ...current,
      streak_count: streak,
      longest_streak: Math.max(current.longest_streak ?? 0, streak),
      last_active_date: data.today,
    };

    const { error: upsertError } = await context.supabase
      .from("profiles")
      .upsert({
        id: context.userId,
        streak_count: next.streak_count,
        longest_streak: next.longest_streak,
        last_active_date: next.last_active_date,
      });
    if (upsertError) throw new Error(upsertError.message);
    return next;
  });

/** Picks the goal to focus on for the given local day. */
export const setGoalOfDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ goalId: z.string().uuid().nullable(), today: dateSchema })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").upsert({
      id: context.userId,
      goal_of_day_id: data.goalId,
      goal_of_day_date: data.goalId ? data.today : null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const updateDisplayName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ displayName: z.string().trim().min(1).max(60) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, display_name: data.displayName });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** One-time adoption of goals created before sign-in existed. */
export const claimUnownedGoals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_unowned_goals");
    if (error) throw new Error(error.message);
    return { claimed: data ?? 0 };
  });

export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const [goalsResult, stepsResult] = await Promise.all([
      supabase
        .from("goals")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("steps")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (goalsResult.error) throw new Error(goalsResult.error.message);
    if (stepsResult.error) throw new Error(stepsResult.error.message);

    const steps = stepsResult.data ?? [];
    return (goalsResult.data ?? []).map((goal) => ({
      ...goal,
      steps: steps.filter((step) => step.goal_id === goal.id),
    }));
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ title: z.string().trim().min(1).max(140) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: existing, error: existingError } = await supabase
      .from("goals")
      .select("position, accent");
    if (existingError) throw new Error(existingError.message);

    const accent = ACCENTS[(existing?.length ?? 0) % ACCENTS.length] ?? "mint";
    const position =
      (existing ?? []).reduce((max, g) => Math.max(max, g.position), 0) + 1;

    const { data: goal, error } = await supabase
      .from("goals")
      .insert({
        title: data.title,
        accent,
        position,
        user_id: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...goal, steps: [] };
  });

export const updateGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), title: z.string().trim().min(1).max(140) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("goals")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setGoalArchived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), archived: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("goals")
      .update({ archived_at: data.archived ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("goals")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        goalId: z.string().uuid(),
        title: z.string().trim().min(1).max(240),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: last, error: lastError } = await supabase
      .from("steps")
      .select("position")
      .eq("goal_id", data.goalId)
      .order("position", { ascending: false })
      .limit(1);
    if (lastError) throw new Error(lastError.message);

    const { data: step, error } = await supabase
      .from("steps")
      .insert({
        goal_id: data.goalId,
        title: data.title,
        position: (last?.[0]?.position ?? 0) + 1,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return step;
  });

export const updateStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), title: z.string().trim().min(1).max(240) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("steps")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), done: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("steps")
      .update({ done: data.done })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("steps")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getGoal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const [goalResult, stepsResult] = await Promise.all([
      supabase.from("goals").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("steps")
        .select("*")
        .eq("goal_id", data.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    if (goalResult.error) throw new Error(goalResult.error.message);
    if (stepsResult.error) throw new Error(stepsResult.error.message);
    if (!goalResult.data) throw new Error("Goal not found");
    return { ...goalResult.data, steps: stepsResult.data ?? [] };
  });

export const updateGoalDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(140).optional(),
        why: z.string().max(2000).optional(),
        vision: z.string().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const fields: { title?: string; why?: string; vision?: string } = {};
    if (data.title !== undefined) fields.title = data.title;
    if (data.why !== undefined) fields.why = data.why;
    if (data.vision !== undefined) fields.vision = data.vision;
    const { error } = await context.supabase
      .from("goals")
      .update(fields)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
