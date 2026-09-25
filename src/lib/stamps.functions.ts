import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Every stamp the user has earned, newest first. */
export const listStamps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stamps")
      .select("*")
      .order("earned_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Recolours / re-icons an earned stamp (how it shows in the gallery). */
export const updateStamp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        icon: z.string().trim().max(40).optional(),
        accent: z.string().trim().max(20),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("stamps")
      .update({ icon: data.icon || null, accent: data.accent })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Awards a stamp for a completed goal (its icon + accent are frozen in). */
export const createStamp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        goalId: z.string().uuid().optional(),
        title: z.string().trim().min(1).max(140),
        icon: z.string().trim().max(40).optional(),
        accent: z.string().trim().max(20).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stamps").insert({
      user_id: context.userId,
      goal_id: data.goalId ?? null,
      title: data.title,
      icon: data.icon || null,
      accent: data.accent || "mint",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
