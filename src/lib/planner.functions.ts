import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resetDraftSchema } from "@/lib/planner-reset-draft";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const SLOTS = ["allday", "morning", "midday", "awa", "evening", "lunch", "dinner"] as const;
export type Slot = (typeof SLOTS)[number];

export const getPlannerWeek = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ start: date, end: date }).parse(d))
  .handler(async ({ data, context }) => {
    const [items, week, hobbies] = await Promise.all([
      context.supabase.from("planner_items").select("*").gte("day", data.start).lte("day", data.end).order("time", { nullsFirst: true }).order("created_at"),
      context.supabase.from("planner_weeks").select("*").eq("week_start", data.start).maybeSingle(),
      context.supabase.from("awa_hobbies").select("id,name").is("archived_at", null).order("position"),
    ]);
    if (items.error) throw new Error(items.error.message);
    return { items: items.data ?? [], week: week.data ?? null, hobbies: hobbies.data ?? [] };
  });

export const addPlannerItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.array(z.object({
      day: date,
      slot: z.enum(SLOTS),
      title: z.string().trim().min(1).max(200),
      time: z.string().trim().max(20).optional(),
      location: z.string().trim().max(200).optional(),
    })).max(100).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!data.length) return [];
    const { data: rows, error } = await context.supabase.from("planner_items").insert(
      data.map((i) => ({ day: i.day, slot: i.slot, title: i.title, time: i.time || null, location: i.location || null, user_id: context.userId })),
    ).select();
    if (error) throw new Error(error.message);
    return rows;
  });

export const updatePlannerItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      done: z.boolean().optional(),
      title: z.string().trim().min(1).max(200).optional(),
    }).refine((v) => v.done !== undefined || v.title !== undefined, { message: "Nothing to update" }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: { done?: boolean; title?: string } = {};
    if (data.done !== undefined) patch.done = data.done;
    if (data.title !== undefined) patch.title = data.title;
    const { error } = await context.supabase.from("planner_items").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return true;
  });

export const deletePlannerItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("planner_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return true;
  });

export const savePlannerWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      weekStart: date,
      audit: z.record(z.string(), z.number().int().min(0).max(5)),
      reflections: z.record(z.string(), z.string().max(4000)),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("planner_weeks").upsert(
      { user_id: context.userId, week_start: data.weekStart, audit: data.audit, reflections: data.reflections, completed_at: new Date().toISOString() },
      { onConflict: "user_id,week_start" },
    );
    if (error) throw new Error(error.message);
    return true;
  });

export const getPlannerResetDraft = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("planner_reset_drafts")
      .select("draft").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error("Could not load weekly reset progress");
    return { userId: context.userId, draft: data ? resetDraftSchema.parse(data.draft) : null };
  });

export const savePlannerResetDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => resetDraftSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("planner_reset_drafts").upsert({
      user_id: context.userId,
      draft: JSON.parse(JSON.stringify(data)),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) throw new Error("Could not save weekly reset progress");
    return true;
  });

export const clearPlannerResetDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("planner_reset_drafts")
      .delete().eq("user_id", context.userId);
    if (error) throw new Error("Could not clear weekly reset progress");
    return true;
  });
