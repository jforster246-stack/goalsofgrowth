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
        account: z.string().trim().max(140).nullish(),
        note: z.string().trim().max(500).nullish(),
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
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      label?: string;
      amount?: number;
      account?: string | null;
      note?: string | null;
    } = {};
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

/* ---------- Template ---------- */

/** Bucket structure only - amounts start at $0 and are typed in the app. */
const TEMPLATE_BUCKETS: { label: string; account: string; note: string }[] = [
  { label: "Shared Account", account: "Shared account", note: "Rent and groceries" },
  { label: "Shared Bills", account: "Shared bills account", note: "Electricity, gas and internet" },
  {
    label: "House Savings",
    account: "Savings account",
    note: "House deposit and emergency buffer - don't dip in",
  },
  {
    label: "Bills & Essentials",
    account: "Bills card",
    note: "Personal bills, essentials and subscriptions",
  },
  {
    label: "Future Expenses",
    account: "Irregular costs savings",
    note: "Car rego, gifts, beauty, tech, medical, vet",
  },
  { label: "Spending", account: "Spending card", note: "Takeaway, fun, clothes, daily life" },
  { label: "Goals", account: "Goals account", note: "Travel and savings goals" },
];

/** Adds a pay line + the bucket template and switches to fortnightly pay. */
export const applyFinanceTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const { data: existing, error: existingError } = await supabase
      .from("finance_entries")
      .select("position");
    if (existingError) throw new Error(existingError.message);
    const start = (existing ?? []).reduce((max, e) => Math.max(max, e.position), 0);

    const rows = [
      { label: "Pay", account: null, note: null, kind: "income" },
      ...TEMPLATE_BUCKETS.map((b) => ({ ...b, kind: "expense" })),
    ].map((r, i) => ({
      ...r,
      amount: 0,
      position: start + i + 1,
      user_id: context.userId,
    }));
    const { error } = await supabase.from("finance_entries").insert(rows);
    if (error) throw new Error(error.message);

    const { error: settingsError } = await supabase
      .from("finance_settings")
      .upsert({ user_id: context.userId, pay_cycle: "fortnightly" });
    if (settingsError) throw new Error(settingsError.message);
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
      .partial({ name: true, target: true, saved: true, perPay: true, icon: true })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      name?: string;
      target?: number;
      saved?: number;
      per_pay?: number;
      icon?: string | null;
    } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.target !== undefined) patch.target = data.target;
    if (data.saved !== undefined) patch.saved = data.saved;
    if (data.perPay !== undefined) patch.per_pay = data.perPay;
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
