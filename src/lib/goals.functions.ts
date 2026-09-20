import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ACCENTS = ["mint", "sea", "clay"] as const;

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? { id: context.userId, display_name: null };
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
