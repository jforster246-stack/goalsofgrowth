import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const kindSchema = z.enum(["achievement", "life_event"]);

export const listWins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wins")
      .select("*")
      .order("achieved_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createWin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        title: z.string().trim().min(1).max(140),
        kind: kindSchema.default("achievement"),
        note: z.string().trim().max(2000).optional(),
        achievedOn: dateSchema.optional(),
        icon: z.string().trim().max(40).optional(),
        accent: z.string().trim().max(20).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: win, error } = await context.supabase
      .from("wins")
      .insert({
        title: data.title,
        kind: data.kind,
        note: data.note ?? null,
        ...(data.achievedOn ? { achieved_on: data.achievedOn } : {}),
        icon: data.icon || null,
        accent: data.accent || null,
        user_id: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return win;
  });

export const updateWin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(140),
        kind: kindSchema,
        note: z.string().trim().max(2000).optional(),
        achievedOn: dateSchema,
        icon: z.string().trim().max(40).optional(),
        accent: z.string().trim().max(20).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: win, error } = await context.supabase
      .from("wins")
      .update({
        title: data.title,
        kind: data.kind,
        note: data.note ?? null,
        achieved_on: data.achievedOn,
        icon: data.icon || null,
        accent: data.accent || null,
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return win;
  });

export const deleteWin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("wins")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
