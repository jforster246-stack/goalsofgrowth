/** Shared types, wording and date maths for the finance planner. */

export type PayCycle = "weekly" | "fortnightly" | "monthly";

export type FinanceEntry = {
  id: string;
  label: string;
  amount: number;
  kind: string;
  account: string | null;
  note: string | null;
};

export type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  per_pay: number;
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

export function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
