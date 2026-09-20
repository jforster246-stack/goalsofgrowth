import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPublicSupabase } from "./goals.server";

const ACCENTS = ["mint", "sea", "clay"] as const;

export const listGoals = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = getPublicSupabase();
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
  },
);

export const createGoal = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ title: z.string().trim().min(1).max(140) }).parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();

    const { data: last, error: lastError } = await supabase
      .from("goals")
      .select("position")
      .order("position", { ascending: false })
      .limit(1);
    if (lastError) throw new Error(lastError.message);

    const { data: existing, error: accentError } = await supabase
      .from("goals")
      .select("accent");
    if (accentError) throw new Error(accentError.message);

    const accent = ACCENTS[(existing?.length ?? 0) % ACCENTS.length] ?? "mint";
    const position = (last?.[0]?.position ?? 0) + 1;

    const { data: goal, error } = await supabase
      .from("goals")
      .insert({ title: data.title, accent, position })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...goal, steps: [] };
  });

export const updateGoal = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), title: z.string().trim().min(1).max(140) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();
    const { error } = await supabase
      .from("goals")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();
    const { error } = await supabase.from("goals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addStep = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        goalId: z.string().uuid(),
        title: z.string().trim().min(1).max(240),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();

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
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), title: z.string().trim().min(1).max(240) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();
    const { error } = await supabase
      .from("steps")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleStep = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), done: z.boolean() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();
    const { error } = await supabase
      .from("steps")
      .update({ done: data.done })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStep = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();
    const { error } = await supabase.from("steps").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
