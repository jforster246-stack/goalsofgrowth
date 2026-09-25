import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeOfDaySchema = z.enum(["morning", "afternoon", "evening"]);
const frequencySchema = z.enum([
  "daily",
  "weekdays",
  "weekends",
  "specific_days",
  "interval",
  // legacy values still accepted
  "weekly",
  "fortnightly",
  "monthly",
]);
// comma-separated day numbers 0-6, e.g. "1,2,3,4,5"
const daysOfWeekSchema = z
  .string()
  .regex(/^([0-6])(,[0-6])*$/)
  .optional();
const intervalSchema = z.number().int().min(1).max(365).optional();

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

/**
 * Current streak per habit = consecutive days (ending today or yesterday) with
 * a completion. Used by the Wins page to show habit streaks at a glance.
 */
export const listHabitStreaks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ today: dateSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const [habitsResult, completionsResult] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, time_of_day")
        .order("position", { ascending: true }),
      supabase.from("habit_completions").select("habit_id, completed_on"),
    ]);
    if (habitsResult.error) throw new Error(habitsResult.error.message);
    if (completionsResult.error) throw new Error(completionsResult.error.message);

    const byHabit = new Map<string, Set<string>>();
    for (const c of completionsResult.data ?? []) {
      const set = byHabit.get(c.habit_id) ?? new Set<string>();
      set.add(c.completed_on);
      byHabit.set(c.habit_id, set);
    }

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const streakFor = (dates: Set<string>) => {
      const cursor = new Date(`${data.today}T00:00:00Z`);
      // If today isn't done yet, an unbroken run can still end yesterday.
      if (!dates.has(dayKey(cursor))) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        if (!dates.has(dayKey(cursor))) return 0;
      }
      let n = 0;
      while (dates.has(dayKey(cursor))) {
        n += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      return n;
    };

    return (habitsResult.data ?? [])
      .map((h) => ({
        id: h.id,
        name: h.name,
        time_of_day: h.time_of_day,
        streak: streakFor(byHabit.get(h.id) ?? new Set()),
      }))
      .filter((h) => h.streak > 0)
      .sort((a, b) => b.streak - a.streak);
  });

/**
 * Habit stamps: doing a habit three days in a row earns 2 stamps (each full run
 * of three consecutive days counts). Shared by the stamp pill and the spendable
 * balance so both agree.
 */
export function habitStampBonusFromRows(
  rows: { habit_id: string; completed_on: string }[],
): number {
  const byHabit = new Map<string, string[]>();
  for (const r of rows) {
    const arr = byHabit.get(r.habit_id);
    if (arr) arr.push(r.completed_on);
    else byHabit.set(r.habit_id, [r.completed_on]);
  }

  const DAY = 86_400_000;
  let sets = 0;
  for (const dates of byHabit.values()) {
    const uniq = [...new Set(dates)].sort();
    let run = 0;
    let prev: number | null = null;
    for (const d of uniq) {
      const t = Date.parse(`${d}T00:00:00Z`);
      if (prev !== null && t - prev === DAY) {
        run += 1;
      } else {
        sets += Math.floor(run / 3);
        run = 1;
      }
      prev = t;
    }
    sets += Math.floor(run / 3);
  }
  return sets * 2;
}

export const getHabitStampBonus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("habit_completions")
      .select("habit_id, completed_on");
    if (error) throw new Error(error.message);
    return habitStampBonusFromRows(data ?? []);
  });

/**
 * Every date a habit was completed on (ascending), so the sheet can show the
 * ticked week and work out three-day runs across week boundaries.
 */
export const getHabitHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ habitId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("habit_completions")
      .select("completed_on")
      .eq("habit_id", data.habitId)
      .order("completed_on", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => r.completed_on);
  });

export const createHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        name: z.string().trim().min(1).max(140),
        timeOfDay: timeOfDaySchema,
        frequency: frequencySchema.default("daily"),
        daysOfWeek: daysOfWeekSchema,
        intervalDays: intervalSchema,
        reason: z.string().trim().max(2000).optional(),
        icon: z.string().trim().max(40).optional(),
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
        frequency: data.frequency,
        days_of_week: data.daysOfWeek ?? null,
        interval_days: data.intervalDays ?? null,
        reason: data.reason ?? null,
        icon: data.icon || null,
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
        frequency: frequencySchema.optional(),
        daysOfWeek: z.string().regex(/^([0-6])(,[0-6])*$/).nullable().optional(),
        intervalDays: z.number().int().min(1).max(365).nullable().optional(),
        reason: z.string().trim().max(2000).optional(),
        icon: z.string().trim().max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const fields: {
      name?: string;
      time_of_day?: string;
      frequency?: string;
      days_of_week?: string | null;
      interval_days?: number | null;
      reason?: string;
      icon?: string | null;
    } = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.timeOfDay !== undefined) fields.time_of_day = data.timeOfDay;
    if (data.frequency !== undefined) fields.frequency = data.frequency;
    if (data.daysOfWeek !== undefined) fields.days_of_week = data.daysOfWeek;
    if (data.intervalDays !== undefined) fields.interval_days = data.intervalDays;
    if (data.reason !== undefined) fields.reason = data.reason;
    if (data.icon !== undefined) fields.icon = data.icon || null;

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
