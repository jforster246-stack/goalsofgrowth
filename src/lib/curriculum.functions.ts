import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getObservatoryProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("observatory_progress")
      .select("baseline, revealed")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      baseline: data.baseline,
      revealed: (data.revealed ?? {}) as Record<string, number>,
    };
  });

export const saveObservatoryProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        baseline: z.number().int().min(0).nullable(),
        revealed: z.record(z.string().max(80), z.number().int().min(0)),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("observatory_progress").upsert({
      user_id: context.userId,
      baseline: data.baseline,
      revealed: data.revealed,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
