import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/* ----------------------------- Hobbies ----------------------------- */

export const listAwaHobbies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("awa_hobbies")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addAwaHobby = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        icon: z.string().trim().max(8).optional(),
        category: z.string().trim().max(60).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: existing } = await supabase.from("awa_hobbies").select("position");
    const position =
      (existing ?? []).reduce((m, h) => Math.max(m, h.position), 0) + 1;

    const { data: hobby, error } = await supabase
      .from("awa_hobbies")
      .insert({
        name: data.name,
        icon: data.icon || null,
        category: data.category || null,
        position,
        user_id: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return hobby;
  });

export const deleteAwaHobby = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("awa_hobbies")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------- Logs ------------------------------ */

export const listAwaLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("awa_logs")
      .select("*")
      .order("logged_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addAwaLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        hobbyId: z.string().uuid().optional(),
        hobbyName: z.string().trim().min(1).max(80),
        hobbyIcon: z.string().trim().max(8).optional(),
        minutes: z.number().int().min(0).max(100000),
        note: z.string().trim().max(1000).optional(),
        loggedOn: dateSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: log, error } = await context.supabase
      .from("awa_logs")
      .insert({
        hobby_id: data.hobbyId ?? null,
        hobby_name: data.hobbyName,
        hobby_icon: data.hobbyIcon || null,
        minutes: data.minutes,
        note: data.note || null,
        logged_on: data.loggedOn,
        user_id: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return log;
  });

export const deleteAwaLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("awa_logs")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------------- Wishlist ---------------------------- */

export const listAwaWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("awa_wishlist")
      .select("*")
      .order("done", { ascending: true })
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addAwaWishlistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ title: z.string().trim().min(1).max(140) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: existing } = await supabase.from("awa_wishlist").select("position");
    const position =
      (existing ?? []).reduce((m, w) => Math.max(m, w.position), 0) + 1;

    const { data: item, error } = await supabase
      .from("awa_wishlist")
      .insert({ title: data.title, position, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return item;
  });

export const toggleAwaWishlistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), done: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("awa_wishlist")
      .update({ done: data.done })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAwaWishlistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("awa_wishlist")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
