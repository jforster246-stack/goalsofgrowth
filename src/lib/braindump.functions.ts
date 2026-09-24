import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The raw, unsorted list of things the user wants to do or try. */
export const listBrainDump = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("brain_dump_items")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createBrainDumpItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ text: z.string().trim().min(1).max(500) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: existing, error: existingError } = await supabase
      .from("brain_dump_items")
      .select("position");
    if (existingError) throw new Error(existingError.message);

    const position =
      (existing ?? []).reduce((max, i) => Math.max(max, i.position), 0) + 1;

    const { data: item, error } = await supabase
      .from("brain_dump_items")
      .insert({ text: data.text, position, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return item;
  });

export const updateBrainDumpItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), text: z.string().trim().min(1).max(500) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("brain_dump_items")
      .update({ text: data.text })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderBrainDump = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ orderedIds: z.array(z.string().uuid()).min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    // RLS scopes updates to the user's own items.
    await Promise.all(
      data.orderedIds.map((id, index) =>
        supabase.from("brain_dump_items").update({ position: index }).eq("id", id),
      ),
    );
    return { ok: true };
  });

export const deleteBrainDumpItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("brain_dump_items")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
