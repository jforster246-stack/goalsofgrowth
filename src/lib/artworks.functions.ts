import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ARTWORK_COST, ARTWORKS } from "@/lib/artworks-data";
import { habitStampBonusFromRows } from "@/lib/habits.functions";

const artworkIdSchema = z
  .number()
  .int()
  .refine((id) => ARTWORKS.some((a) => a.id === id), "Unknown artwork");

/**
 * Total stamps earned: the earned ledger, plus any goal complete now but not yet
 * in the ledger, plus the habit bonus (2 per three-day run). Mirrors the
 * client-side mergeStamps + habit-bonus total.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
async function earnedStamps(supabase: any): Promise<number> {
  const [stampsRes, goalsRes, stepsRes, habitRes] = await Promise.all([
    supabase.from("stamps").select("goal_id"),
    supabase.from("goals").select("id"),
    supabase.from("steps").select("goal_id, done"),
    supabase.from("habit_completions").select("habit_id, completed_on"),
  ]);
  if (stampsRes.error) throw new Error(stampsRes.error.message);
  if (goalsRes.error) throw new Error(goalsRes.error.message);
  if (stepsRes.error) throw new Error(stepsRes.error.message);
  if (habitRes.error) throw new Error(habitRes.error.message);

  const ledger = (stampsRes.data ?? []) as { goal_id: string | null }[];
  const seen = new Set(ledger.map((s) => s.goal_id).filter(Boolean));

  const agg = new Map<string, { total: number; done: number }>();
  for (const st of (stepsRes.data ?? []) as {
    goal_id: string;
    done: boolean;
  }[]) {
    const a = agg.get(st.goal_id) ?? { total: 0, done: 0 };
    a.total += 1;
    if (st.done) a.done += 1;
    agg.set(st.goal_id, a);
  }
  let extraGoals = 0;
  for (const g of (goalsRes.data ?? []) as { id: string }[]) {
    const a = agg.get(g.id);
    const complete = !!a && a.total > 0 && a.done === a.total;
    if (complete && !seen.has(g.id)) extraGoals += 1;
  }

  const habitBonus = habitStampBonusFromRows(
    (habitRes.data ?? []) as { habit_id: string; completed_on: string }[],
  );
  return ledger.length + extraGoals + habitBonus;
}

async function purchaseCount(supabase: any, userId: string) {
  const { count, error } = await supabase
    .from("artwork_purchases")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Earned stamps, stamps already spent on artworks, and what's left to spend. */
export const getStampBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const earned = await earnedStamps(context.supabase);
    const spent = (await purchaseCount(context.supabase, context.userId)) * ARTWORK_COST;
    return { earned, spent, balance: earned - spent };
  });

export const listPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("artwork_purchases")
      .select("artwork_id")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.artwork_id as number);
  });

export const buyArtwork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ artworkId: artworkIdSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: owned } = await supabase
      .from("artwork_purchases")
      .select("id")
      .eq("user_id", context.userId)
      .eq("artwork_id", data.artworkId)
      .maybeSingle();
    if (owned) return { ok: true, already: true };

    const earned = await earnedStamps(supabase);
    const spent = (await purchaseCount(supabase, context.userId)) * ARTWORK_COST;
    if (earned - spent < ARTWORK_COST) {
      throw new Error("Not enough stamps to buy this artwork");
    }

    const { error } = await supabase.from("artwork_purchases").insert({
      user_id: context.userId,
      artwork_id: data.artworkId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getShowcase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("gallery_showcase")
      .select("position, artwork_id")
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as { position: number; artwork_id: number }[];
  });

export const setShowcaseSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        position: z.number().int().min(0).max(4),
        artworkId: artworkIdSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: owned } = await supabase
      .from("artwork_purchases")
      .select("id")
      .eq("user_id", context.userId)
      .eq("artwork_id", data.artworkId)
      .maybeSingle();
    if (!owned) throw new Error("You don't own that artwork yet");

    // A given artwork hangs in at most one slot, and a slot holds one artwork.
    const { error: delErr } = await supabase
      .from("gallery_showcase")
      .delete()
      .eq("user_id", context.userId)
      .or(`position.eq.${data.position},artwork_id.eq.${data.artworkId}`);
    if (delErr) throw new Error(delErr.message);

    const { error } = await supabase.from("gallery_showcase").insert({
      user_id: context.userId,
      position: data.position,
      artwork_id: data.artworkId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearShowcaseSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ position: z.number().int().min(0).max(4) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("gallery_showcase")
      .delete()
      .eq("user_id", context.userId)
      .eq("position", data.position);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
