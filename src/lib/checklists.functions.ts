import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** All the user's checklists, each with its items. */
export const listChecklists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const [listsResult, itemsResult] = await Promise.all([
      supabase
        .from("checklists")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("checklist_items")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    if (listsResult.error) throw new Error(listsResult.error.message);
    if (itemsResult.error) throw new Error(itemsResult.error.message);

    const items = itemsResult.data ?? [];
    return (listsResult.data ?? []).map((list) => ({
      ...list,
      items: items.filter((i) => i.checklist_id === list.id),
    }));
  });

export const createChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ title: z.string().trim().min(1).max(140) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: existing, error: existingError } = await supabase
      .from("checklists")
      .select("position");
    if (existingError) throw new Error(existingError.message);

    const position =
      (existing ?? []).reduce((max, c) => Math.max(max, c.position), 0) + 1;

    const { data: list, error } = await supabase
      .from("checklists")
      .insert({ title: data.title, position, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...list, items: [] };
  });

export const renameChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), title: z.string().trim().min(1).max(140) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("checklists")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("checklists")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Unchecks every item in a checklist so a routine can be run again. */
export const resetChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("checklist_items")
      .update({ done: false })
      .eq("checklist_id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        checklistId: z.string().uuid(),
        text: z.string().trim().min(1).max(300),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: last, error: lastError } = await supabase
      .from("checklist_items")
      .select("position")
      .eq("checklist_id", data.checklistId)
      .order("position", { ascending: false })
      .limit(1);
    if (lastError) throw new Error(lastError.message);

    const { data: item, error } = await supabase
      .from("checklist_items")
      .insert({
        checklist_id: data.checklistId,
        text: data.text,
        position: (last?.[0]?.position ?? 0) + 1,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return item;
  });

export const toggleChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), done: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("checklist_items")
      .update({ done: data.done })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("checklist_items")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
