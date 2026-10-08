import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const kindSchema = z.enum(["income", "expense"]);
const amountSchema = z.number().finite().min(0).max(1_000_000_000);
const bucketGroupSchema = z.enum(["spending", "saving"]);

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
        account: z.string().trim().max(140).nullish(),
        note: z.string().trim().max(500).nullish(),
        bucketGroup: bucketGroupSchema.optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: existing, error: existingError } = await supabase
      .from("finance_entries")
      .select("position");
    if (existingError) throw new Error(existingError.message);

    const position = (existing ?? []).reduce((max, e) => Math.max(max, e.position), 0) + 1;

    const { data: entry, error } = await supabase
      .from("finance_entries")
      .insert({
        label: data.label,
        amount: data.amount,
        kind: data.kind,
        // Only send the newer columns when set, so adding a line still
        // works on a database that hasn't had migration 0039 yet.
        ...(data.account ? { account: data.account } : {}),
        ...(data.note ? { note: data.note } : {}),
        ...(data.bucketGroup ? { bucket_group: data.bucketGroup } : {}),
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
        account: z.string().trim().max(140).nullish(),
        note: z.string().trim().max(500).nullish(),
        bucketGroup: bucketGroupSchema.optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      label?: string;
      amount?: number;
      account?: string | null;
      note?: string | null;
      bucket_group?: string;
    } = {};
    if (data.bucketGroup !== undefined) patch.bucket_group = data.bucketGroup;
    if (data.label !== undefined) patch.label = data.label;
    if (data.amount !== undefined) patch.amount = data.amount;
    if (data.account !== undefined) patch.account = data.account || null;
    if (data.note !== undefined) patch.note = data.note || null;

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
    const { error } = await context.supabase.from("finance_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Pay settings ---------- */

const payCycleSchema = z.enum(["weekly", "fortnightly", "monthly"]);

/** The user's pay cycle; defaults to monthly when nothing is saved yet. */
export const getFinanceSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("finance_settings")
      .select("pay_cycle, pay_anchor")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      payCycle: (data?.pay_cycle ?? "monthly") as z.infer<typeof payCycleSchema>,
      payAnchor: data?.pay_anchor ?? null,
    };
  });

export const saveFinanceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        payCycle: payCycleSchema,
        payAnchor: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("finance_settings").upsert({
      user_id: context.userId,
      pay_cycle: data.payCycle,
      pay_anchor: data.payAnchor,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Guided setup ---------- */

/**
 * Saves the whole plan from the guided setup in one go: pay settings, the
 * main pay line, and the bucket list (updating, adding and removing so the
 * saved buckets match what was picked). Extra income lines are left alone.
 */
export const saveFinancePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        payCycle: payCycleSchema,
        payAnchor: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable(),
        income: z.object({ id: z.string().uuid().nullish(), amount: amountSchema }),
        buckets: z
          .array(
            z.object({
              id: z.string().uuid().nullish(),
              label: z.string().trim().min(1).max(140),
              amount: amountSchema,
              note: z.string().trim().max(500).nullish(),
            }),
          )
          .max(50),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const userId = context.userId;

    const { error: settingsError } = await supabase.from("finance_settings").upsert({
      user_id: userId,
      pay_cycle: data.payCycle,
      pay_anchor: data.payAnchor,
      updated_at: new Date().toISOString(),
    });
    if (settingsError) throw new Error(settingsError.message);

    const { data: existing, error: existingError } = await supabase
      .from("finance_entries")
      .select("id, kind");
    if (existingError) throw new Error(existingError.message);

    if (data.income.id) {
      const { error } = await supabase
        .from("finance_entries")
        .update({ amount: data.income.amount })
        .eq("id", data.income.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("finance_entries").insert({
        label: "Pay",
        amount: data.income.amount,
        kind: "income",
        position: 0,
        user_id: userId,
      });
      if (error) throw new Error(error.message);
    }

    const keep = new Set(data.buckets.flatMap((b) => (b.id ? [b.id] : [])));
    const removed = (existing ?? [])
      .filter((e) => e.kind === "expense" && !keep.has(e.id))
      .map((e) => e.id);
    if (removed.length > 0) {
      const { error } = await supabase.from("finance_entries").delete().in("id", removed);
      if (error) throw new Error(error.message);
    }

    for (const [i, b] of data.buckets.entries()) {
      const fields = {
        label: b.label,
        amount: b.amount,
        note: b.note || null,
        position: i + 1,
      };
      const { error } = b.id
        ? await supabase.from("finance_entries").update(fields).eq("id", b.id)
        : await supabase
            .from("finance_entries")
            .insert({ ...fields, kind: "expense", user_id: userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ---------- Savings goals ---------- */

export const listSavingsGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("savings_goals")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const savingsGoalFields = {
  name: z.string().trim().min(1).max(140),
  target: amountSchema,
  saved: amountSchema,
  perPay: amountSchema,
  icon: z.string().max(40).nullish(),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
};

export const addSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object(savingsGoalFields).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: existing, error: existingError } = await supabase
      .from("savings_goals")
      .select("position");
    if (existingError) throw new Error(existingError.message);
    const position = (existing ?? []).reduce((max, g) => Math.max(max, g.position), 0) + 1;

    const { error } = await supabase.from("savings_goals").insert({
      name: data.name,
      target: data.target,
      saved: data.saved,
      per_pay: data.perPay,
      // Only sent when set, so goals still save before migration 0043 lands.
      ...(data.targetDate ? { target_date: data.targetDate } : {}),
      icon: data.icon ?? null,
      position,
      user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), ...savingsGoalFields })
      .partial({
        name: true,
        target: true,
        saved: true,
        perPay: true,
        icon: true,
        targetDate: true,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      name?: string;
      target?: number;
      saved?: number;
      per_pay?: number;
      target_date?: string | null;
      icon?: string | null;
    } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.target !== undefined) patch.target = data.target;
    if (data.saved !== undefined) patch.saved = data.saved;
    if (data.perPay !== undefined) patch.per_pay = data.perPay;
    if (data.targetDate !== undefined) patch.target_date = data.targetDate ?? null;
    if (data.icon !== undefined) patch.icon = data.icon ?? null;

    const { error } = await context.supabase.from("savings_goals").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("savings_goals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
