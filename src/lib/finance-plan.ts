/** Shared types, wording and date maths for the finance planner. */

export type PayCycle = "weekly" | "fortnightly" | "monthly";

export type FinanceEntry = {
  id: string;
  label: string;
  amount: number;
  kind: string;
  account: string | null;
  note: string | null;
  bucket_group?: string | null;
};

export type BucketGroup = "spending" | "saving";

const SAVING_WORDS = /sav|goal|future|sinking|emergency|invest|super|deposit|holiday|travel|fund/i;

/** Spending or saving: what was chosen, otherwise a guess from the name. */
export function bucketGroup(entry: Pick<FinanceEntry, "label" | "bucket_group">): BucketGroup {
  if (entry.bucket_group === "spending" || entry.bucket_group === "saving") {
    return entry.bucket_group;
  }
  return SAVING_WORDS.test(entry.label) ? "saving" : "spending";
}

export type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  per_pay: number;
  target_date?: string | null;
};

export const CYCLE_WORD: Record<PayCycle, string> = {
  weekly: "week",
  fortnightly: "fortnight",
  monthly: "month",
};

export const CYCLE_PHRASE: Record<PayCycle, string> = {
  weekly: "every week",
  fortnightly: "every fortnight",
  monthly: "every month",
};

export const PAYS_PER_YEAR: Record<PayCycle, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

/** Rotating brand colours for the bucket meter + card dots. */
export const BUCKET_COLOURS = [
  "bg-olive",
  "bg-gold",
  "bg-clay",
  "bg-sky",
  "bg-sage",
  "bg-plum",
  "bg-gold-deep",
  "bg-rose",
];

/** Starting buckets offered in the guided setup. */
export const SUGGESTED_BUCKETS: { label: string; note: string; hint: string }[] = [
  {
    label: "Shared Account",
    note: "Rent and groceries",
    hint: "Your share of rent plus groceries.",
  },
  {
    label: "Shared Bills",
    note: "Electricity, gas and internet",
    hint: "Your average bills per pay, plus a little extra for winter.",
  },
  {
    label: "Bills & Essentials",
    note: "Personal bills, insurance, phone, fuel, subscriptions",
    hint: "Add up your regular bills for a year and divide by your pays.",
  },
  {
    label: "Future Expenses",
    note: "Car rego, gifts, beauty, tech, medical, vet",
    hint: "Costs that don't come every pay, but always come.",
  },
  {
    label: "Spending",
    note: "Takeaway, fun, clothes, daily life",
    hint: "Guilt-free money. When it's gone, it's gone.",
  },
  {
    label: "House Savings",
    note: "House deposit and emergency buffer",
    hint: "Long-term savings you don't dip into.",
  },
  {
    label: "Goals",
    note: "Travel and savings goals",
    hint: "Feeds your savings goals, like a holiday.",
  },
];

export const fmt = (n: number) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const fmtWhole = (n: number) =>
  `$${Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

/** Parse a user-typed amount into a clamped, 2dp number. */
export function parseAmount(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

const DAY_MS = 86_400_000;

function anchorUtc(anchor: string) {
  const [y = 0, m = 1, d = 1] = anchor.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function stepDays(cycle: PayCycle) {
  return cycle === "weekly" ? 7 : 14;
}

/** Months in the next year that get an extra pay (3 fortnightly / 5 weekly). */
export function extraPayMonths(cycle: PayCycle, anchor: string | null, from = new Date()) {
  if (cycle === "monthly" || !anchor) return [];
  const step = stepDays(cycle);
  const normal = cycle === "weekly" ? 4 : 2;
  const anchorMs = anchorUtc(anchor);
  const months: Date[] = [];
  for (let i = 0; i < 12; i++) {
    const start = Date.UTC(from.getFullYear(), from.getMonth() + i, 1);
    const end = Date.UTC(from.getFullYear(), from.getMonth() + i + 1, 0);
    const first = Math.ceil((start - anchorMs) / DAY_MS / step);
    const last = Math.floor((end - anchorMs) / DAY_MS / step);
    if (last - first + 1 > normal) months.push(new Date(start));
  }
  return months;
}

/** The next payday on or after today, for weekly/fortnightly pay. */
export function nextPayday(cycle: PayCycle, anchor: string | null, from = new Date()) {
  if (cycle === "monthly" || !anchor) return null;
  const step = stepDays(cycle);
  const today = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const k = Math.ceil((today - anchorUtc(anchor)) / DAY_MS / step);
  return new Date(anchorUtc(anchor) + k * step * DAY_MS);
}

/**
 * How many paydays fall in the next `months` months. Uses the real payday
 * pattern when we know one (so bonus pays count), otherwise the average.
 */
export function paysInMonths(
  cycle: PayCycle,
  anchor: string | null,
  months: number,
  from = new Date(),
) {
  if (cycle === "monthly") return months;
  if (!anchor) return Math.round((months * PAYS_PER_YEAR[cycle]) / 12);
  const end = new Date(from.getFullYear(), from.getMonth() + months, from.getDate());
  return paysUntil(cycle, anchor, end, from);
}

/** Paydays after today, up to and including `end` (a Date or yyyy-mm-dd). */
export function paysUntil(
  cycle: PayCycle,
  anchor: string | null,
  end: Date | string,
  from = new Date(),
) {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const endMs =
    typeof end === "string"
      ? anchorUtc(end)
      : Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  if (endMs <= start) return 0;
  if (cycle === "monthly") {
    // Whole calendar months between today and the end date.
    const e = new Date(endMs);
    const months =
      (e.getUTCFullYear() - from.getFullYear()) * 12 +
      (e.getUTCMonth() - from.getMonth()) -
      (e.getUTCDate() < from.getDate() ? 1 : 0);
    return Math.max(0, months);
  }
  if (!anchor) {
    const perDay = PAYS_PER_YEAR[cycle] / 365.25;
    return Math.max(0, Math.floor(((endMs - start) / DAY_MS) * perDay));
  }
  const step = stepDays(cycle);
  const a = anchorUtc(anchor);
  const first = Math.floor((start - a) / DAY_MS / step) + 1;
  const last = Math.floor((endMs - a) / DAY_MS / step);
  return Math.max(0, last - first + 1);
}

/** The date of the nth payday from today (n >= 1), or an estimate. */
export function nthPayday(cycle: PayCycle, anchor: string | null, n: number, from = new Date()) {
  const next = nextPayday(cycle, anchor, from);
  if (next && cycle !== "monthly") {
    const today = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    // nextPayday can be today; we only count paydays after today.
    const firstAfter =
      next.getTime() > today ? next.getTime() : next.getTime() + stepDays(cycle) * DAY_MS;
    return new Date(firstAfter + (n - 1) * stepDays(cycle) * DAY_MS);
  }
  const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  if (cycle === "monthly") d.setUTCMonth(d.getUTCMonth() + n);
  else d.setUTCDate(d.getUTCDate() + n * stepDays(cycle));
  return d;
}

export function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
