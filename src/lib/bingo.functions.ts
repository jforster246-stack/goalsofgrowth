import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Finds the user's single bingo card, creating it (size 3) if needed. */
async function ensureCard(supabase: SupabaseClient, userId: string) {
  await supabase
    .from("bingo_cards")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data, error } = await supabase
    .from("bingo_cards")
    .select("id, size")
    .eq("user_id", userId)
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; size: number };
}

/** The user's weekly bingo card + its filled cells. */
export const getBingo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const card = await ensureCard(supabase, context.userId);
    const { data: cells, error } = await supabase
      .from("bingo_cells")
      .select("position, text, done")
      .eq("card_id", card.id)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return { id: card.id, size: card.size, cells: cells ?? [] };
  });

/** Switches between a 2x2 and 3x3 board, dropping any now-out-of-range cells. */
export const setBingoSize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ size: z.number().int().min(2).max(3) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const card = await ensureCard(supabase, context.userId);
    const { error } = await supabase
      .from("bingo_cards")
      .update({ size: data.size })
      .eq("id", card.id);
    if (error) throw new Error(error.message);
    await supabase
      .from("bingo_cells")
      .delete()
      .eq("card_id", card.id)
      .gte("position", data.size * data.size);
    return { ok: true };
  });

/** Sets (or clears) the text of a cell at a grid position. */
export const setBingoCell = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        position: z.number().int().min(0).max(8),
        text: z.string().trim().max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const card = await ensureCard(supabase, context.userId);
    if (!data.text) {
      // Clearing a cell removes it (also drops its done state).
      const { error } = await supabase
        .from("bingo_cells")
        .delete()
        .eq("card_id", card.id)
        .eq("position", data.position);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await supabase
      .from("bingo_cells")
      .upsert(
        { card_id: card.id, position: data.position, text: data.text },
        { onConflict: "card_id,position" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Dabs (or un-dabs) a filled cell. */
export const toggleBingoCell = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ position: z.number().int().min(0).max(8), done: z.boolean() })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const card = await ensureCard(supabase, context.userId);
    const { error } = await supabase
      .from("bingo_cells")
      .update({ done: data.done })
      .eq("card_id", card.id)
      .eq("position", data.position);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Clears the whole board for a fresh week. */
export const clearBingo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const card = await ensureCard(supabase, context.userId);
    const { error } = await supabase
      .from("bingo_cells")
      .delete()
      .eq("card_id", card.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
