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
    z
      .object({
        // The page makes the id itself so a new line can be typed into straight away.
        id: z.string().uuid().optional(),
        text: z.string().max(500),
        position: z.number().int().min(0).optional(),
        indent: z.number().int().min(0).max(2).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    let position = data.position;
    if (position === undefined) {
      const { data: existing, error: existingError } = await supabase
        .from("brain_dump_items")
        .select("position");
      if (existingError) throw new Error(existingError.message);
      position = (existing ?? []).reduce((max, i) => Math.max(max, i.position), 0) + 1;
    }

    const { data: item, error } = await supabase
      .from("brain_dump_items")
      .insert({
        ...(data.id ? { id: data.id } : {}),
        text: data.text,
        position,
        // Only sent when indented, so plain lines still save before migration 0046.
        ...(data.indent ? { indent: data.indent } : {}),
        user_id: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return item;
  });

export const updateBrainDumpItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        text: z.string().max(500).optional(),
        indent: z.number().int().min(0).max(2).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch: { text?: string; indent?: number } = {};
    if (data.text !== undefined) patch.text = data.text;
    if (data.indent !== undefined) patch.indent = data.indent;
    const { error } = await context.supabase
      .from("brain_dump_items")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderBrainDump = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ orderedIds: z.array(z.string().uuid()).min(1) }).parse(data))
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

export const toggleBrainDumpItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid(), done: z.boolean() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("brain_dump_items")
      .update({ done: data.done })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBrainDumpItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("brain_dump_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
