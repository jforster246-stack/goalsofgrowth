import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeOfDaySchema = z.enum(["morning", "afternoon"]);

/**
 * Lists the user's habits with a `done` flag for the given local day.
 * A habit is "done today" when a completion row exists for that date, so the
 * tick clears again each morning.
 */
export const listHabits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ today: dateSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const [habitsResult, completionsResult] = await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_completions")
        .select("habit_id")
        .eq("completed_on", data.today),
    ]);

    if (habitsResult.error) throw new Error(habitsResult.error.message);
    if (completionsResult.error) throw new Error(completionsResult.error.message);

    const doneToday = new Set(
      (completionsResult.data ?? []).map((c) => c.habit_id),
    );
    return (habitsResult.data ?? []).map((habit) => ({
      ...habit,
      done: doneToday.has(habit.id),
    }));
  });

export const createHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        name: z.string().trim().min(1).max(140),
        timeOfDay: timeOfDaySchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: existing, error: existingError } = await supabase
      .from("habits")
      .select("position");
    if (existingError) throw new Error(existingError.message);

    const position =
      (existing ?? []).reduce((max, h) => Math.max(max, h.position), 0) + 1;

    const { data: habit, error } = await supabase
      .from("habits")
      .insert({
        name: data.name,
        time_of_day: data.timeOfDay,
        position,
        user_id: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...habit, done: false };
  });

export const updateHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(140).optional(),
        timeOfDay: timeOfDaySchema.optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const fields: { name?: string; time_of_day?: string } = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.timeOfDay !== undefined) fields.time_of_day = data.timeOfDay;

    const { error } = await context.supabase
      .from("habits")
      .update(fields)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Marks a habit done (or not) for the given local day. */
export const toggleHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        done: z.boolean(),
        today: dateSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    if (data.done) {
      const { error } = await supabase
        .from("habit_completions")
        .upsert(
          { habit_id: data.id, completed_on: data.today },
          { onConflict: "habit_id,completed_on", ignoreDuplicates: true },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("habit_completions")
        .delete()
        .eq("habit_id", data.id)
        .eq("completed_on", data.today);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("habits")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
