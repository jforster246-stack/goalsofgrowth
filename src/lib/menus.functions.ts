import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const ENERGIES = ["low", "medium", "high"] as const;
export const KINDS = ["hobby", "cleaning", "task", "errand", "creative", "other"] as const;

const menuFields = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).nullable().optional(),
  category: z.string().trim().max(40).nullable().optional(),
  icon: z.string().max(20).nullable().optional(),
});

const activityFields = z.object({
  name: z.string().trim().min(1).max(120),
  durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  energy: z.enum(ENERGIES).nullable().optional(),
  kind: z.enum(KINDS).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const listMenus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("menus")
      .select("*, menu_items(id)")
      .order("position")
      .order("created_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map(({ menu_items, ...m }) => ({
      ...m,
      activity_count: (menu_items ?? []).length,
    }));
  });

export const getMenu = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: menu, error } = await context.supabase
      .from("menus")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!menu) return null;
    const { data: items, error: e2 } = await context.supabase
      .from("menu_items")
      .select("id, position, activity:menu_activities(*, step:steps(id, title, done, goal_id), hobby:awa_hobbies(id, name, icon))")
      .eq("menu_id", data.id)
      .order("position")
      .order("created_at");
    if (e2) throw new Error(e2.message);
    return {
      menu,
      items: (items ?? []).filter((i) => i.activity).map((i) => ({ itemId: i.id, ...i.activity! })),
    };
  });

/** The user's hobbies on the shelf, to pull into a menu. */
export const listMenuHobbies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("awa_hobbies")
      .select("id, name, icon")
      .is("archived_at", null)
      .order("position");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => menuFields.extend({ id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      icon: data.icon || null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("menus").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: m, error } = await context.supabase
      .from("menus")
      .insert({ ...row, user_id: context.userId, position: Date.now() % 1_000_000_000 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return m;
  });

/** Deletes the menu and its links; standalone activities left in no menu go too. */
export const deleteMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: items } = await sb.from("menu_items").select("activity_id").eq("menu_id", data.id);
    const { error } = await sb.from("menus").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    for (const i of items ?? []) await pruneOrphan(sb, i.activity_id);
    return { ok: true };
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pruneOrphan(sb: any, activityId: string) {
  const { data: act } = await sb
    .from("menu_activities")
    .select("id, step_id, hobby_id, menu_items(id)")
    .eq("id", activityId)
    .maybeSingle();
  if (act && !act.step_id && !act.hobby_id && (act.menu_items ?? []).length === 0) {
    await sb.from("menu_activities").delete().eq("id", activityId);
  }
}

async function link(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  userId: string,
  menuId: string,
  activityId: string,
) {
  const { error } = await sb
    .from("menu_items")
    .upsert(
      { menu_id: menuId, activity_id: activityId, user_id: userId, position: Date.now() % 1_000_000_000 },
      { onConflict: "menu_id,activity_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

/** Adds a hobby to a menu; the activity row is reused if the hobby is already in a menu. */
export const addMenuActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ menuId: z.string().uuid(), hobbyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    let activityId: string | undefined;
    const { data: existing } = await sb
      .from("menu_activities")
      .select("id")
      .eq("hobby_id", data.hobbyId)
      .maybeSingle();
    if (existing) activityId = existing.id;
    else {
      const { data: hobby, error } = await sb
        .from("awa_hobbies")
        .select("name")
        .eq("id", data.hobbyId)
        .single();
      if (error) throw new Error(error.message);
      const { data: a, error: e2 } = await sb
        .from("menu_activities")
        .insert({
          user_id: context.userId,
          name: hobby.name,
          kind: "hobby",
          hobby_id: data.hobbyId,
        })
        .select("id")
        .single();
      if (e2) throw new Error(e2.message);
      activityId = a.id;
    }
    await link(sb, context.userId, data.menuId, activityId);
    return { id: activityId };
  });

export const updateMenuActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => activityFields.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("menu_activities")
      .update({
        name: data.name,
        duration_minutes: data.durationMinutes ?? null,
        energy: data.energy ?? null,
        kind: data.kind ?? "other",
        notes: data.notes || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Removes an activity from one menu; a standalone activity in no other menu is deleted. */
export const removeMenuActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ itemId: z.string().uuid(), activityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("menu_items").delete().eq("id", data.itemId);
    if (error) throw new Error(error.message);
    await pruneOrphan(context.supabase, data.activityId);
    return { ok: true };
  });

/** Marks done (or undone) for today. Linked goal steps tick through the normal step logic. */
export const setMenuActivityDone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), done: z.boolean(), today: dateSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: act, error } = await sb
      .from("menu_activities")
      .update({ last_done_on: data.done ? data.today : null })
      .eq("id", data.id)
      .select("step_id")
      .single();
    if (error) throw new Error(error.message);
    if (act.step_id) {
      const { error: e2 } = await sb
        .from("steps")
        .update({ done: data.done, completed_on: data.done ? data.today : null })
        .eq("id", act.step_id);
      if (e2) throw new Error(e2.message);
    }
    return { ok: true };
  });
