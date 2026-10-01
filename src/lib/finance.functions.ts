import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const kindSchema = z.enum(["income", "expense"]);
const amountSchema = z.number().finite().min(0).max(1_000_000_000);

/** All of the user's finance line items, income and expenses. */
export const listFinance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("finance_entries")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addFinanceEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        label: z.string().trim().min(1).max(140),
        amount: amountSchema,
        kind: kindSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: existing, error: existingError } = await supabase
      .from("finance_entries")
      .select("position");
    if (existingError) throw new Error(existingError.message);

    const position =
      (existing ?? []).reduce((max, e) => Math.max(max, e.position), 0) + 1;

    const { data: entry, error } = await supabase
      .from("finance_entries")
      .insert({
        label: data.label,
        amount: data.amount,
        kind: data.kind,
        position,
        user_id: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return entry;
  });

export const updateFinanceEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        label: z.string().trim().min(1).max(140).optional(),
        amount: amountSchema.optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch: { label?: string; amount?: number } = {};
    if (data.label !== undefined) patch.label = data.label;
    if (data.amount !== undefined) patch.amount = data.amount;

    const { error } = await context.supabase
      .from("finance_entries")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFinanceEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("finance_entries")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
