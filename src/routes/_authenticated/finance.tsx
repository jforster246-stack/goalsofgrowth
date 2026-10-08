import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type KeyboardEvent } from "react";
import { CalendarDays, PiggyBank, Plus, TrendingUp, Wallet, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import {
  financeQueryOptions,
  financeSettingsQueryOptions,
  savingsGoalsQueryOptions,
} from "@/lib/goal-queries";
import {
  addFinanceEntry,
  addSavingsGoal,
  applyFinanceTemplate,
  deleteFinanceEntry,
  deleteSavingsGoal,
  saveFinanceSettings,
  updateFinanceEntry,
  updateSavingsGoal,
} from "@/lib/finance.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Finance planner — Goals of Growth" },
      {
        name: "description",
        content:
          "Give every dollar of your pay a job: split it into buckets, track savings goals and spot the extra-pay months.",
      },
    ],
  }),
  component: FinancePage,
});

type Entry = {
  id: string;
  label: string;
  amount: number;
  kind: string;
  account: string | null;
  note: string | null;
};

type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  per_pay: number;
};

type PayCycle = "weekly" | "fortnightly" | "monthly";

const CYCLE_WORD: Record<PayCycle, string> = {
  weekly: "week",
  fortnightly: "fortnight",
  monthly: "month",
};
const PAYS_PER_YEAR: Record<PayCycle, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

/** Rotating brand colours for the bucket meter + row dots. */
const BUCKET_COLOURS = [
  "bg-olive",
  "bg-gold",
  "bg-clay",
  "bg-sky",
  "bg-sage",
  "bg-plum",
  "bg-gold-deep",
  "bg-rose",
];

const fmt = (n: number) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const fmtWhole = (n: number) =>
  `$${Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function FinancePage() {
  const { data: entries, isPending } = useQuery(financeQueryOptions);
  const { data: settings, isPending: settingsPending } = useQuery(financeSettingsQueryOptions);

  const list = (entries ?? []) as Entry[];
  const income = list.filter((e) => e.kind === "income");
  const buckets = list.filter((e) => e.kind === "expense");
  const incomeTotal = income.reduce((s, e) => s + Number(e.amount), 0);
  const allocated = buckets.reduce((s, e) => s + Number(e.amount), 0);
  const unallocated = incomeTotal - allocated;
  const cycle = (settings?.payCycle ?? "monthly") as PayCycle;
  const perMonth = (n: number) => (n * PAYS_PER_YEAR[cycle]) / 12;

  return (
    <AppShell title="Finance planner" hideSettings>
      <div className="mt-4 w-full space-y-8 pb-4">
        <p className="font-serif text-sm text-black/50">
          Give every dollar of your pay a job. Split it into buckets until nothing's left over.
        </p>

        {isPending || settingsPending || !entries || !settings ? (
          <Loading />
        ) : (
          <>
            <PaySettings cycle={cycle} anchor={settings.payAnchor} />

            {list.length === 0 && <TemplateCard />}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard
                label={`Pay / ${CYCLE_WORD[cycle]}`}
                value={fmtWhole(incomeTotal)}
                tone="income"
              />
              <SummaryCard label="Allocated" value={fmtWhole(allocated)} tone="net" />
              <SummaryCard
                label={unallocated >= 0 ? "Unallocated" : "Over by"}
                value={fmtWhole(Math.abs(unallocated))}
                tone={
                  unallocated < 0
                    ? "expense"
                    : unallocated === 0 && incomeTotal > 0
                      ? "income"
                      : "net"
                }
              />
            </div>

            <BucketMeter buckets={buckets} incomeTotal={incomeTotal} unallocated={unallocated} />

            {cycle !== "monthly" && incomeTotal > 0 && (
              <p className="-mt-5 font-serif text-xs text-black/45">
                About {fmtWhole(perMonth(incomeTotal))} a month on average ({PAYS_PER_YEAR[cycle]}{" "}
                pays a year).
              </p>
            )}

            <FinanceSection
              kind="income"
              title="Income"
              Icon={TrendingUp}
              entries={income}
              cycle={cycle}
            />
            <FinanceSection
              kind="expense"
              title="Buckets"
              Icon={Wallet}
              entries={buckets}
              cycle={cycle}
              incomeTotal={incomeTotal}
            />

            <ExtraPayMonths cycle={cycle} anchor={settings.payAnchor} />

            <SavingsGoals cycle={cycle} />
          </>
        )}
      </div>
    </AppShell>
  );
}

/* ---------------------------------------------------------------- */

function PaySettings({ cycle, anchor }: { cycle: PayCycle; anchor: string | null }) {
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (next: { payCycle: PayCycle; payAnchor: string | null }) =>
      saveFinanceSettings({ data: next }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finance", "settings"] }),
  });

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="font-heading text-[10px] uppercase tracking-wide text-black/40">Paid</span>
        <div className="flex rounded-full bg-black/5 p-0.5">
          {(["weekly", "fortnightly", "monthly"] as PayCycle[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => save.mutate({ payCycle: c, payAnchor: anchor })}
              className={cn(
                "rounded-full px-2.5 py-1 font-heading text-[11px] capitalize transition-colors",
                c === cycle ? "bg-olive text-white" : "text-black/50 hover:text-black",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {cycle !== "monthly" && (
        <label className="flex items-center gap-2">
          <span className="font-heading text-[10px] uppercase tracking-wide text-black/40">
            A recent payday
          </span>
          <input
            type="date"
            value={anchor ?? ""}
            onChange={(e) => save.mutate({ payCycle: cycle, payAnchor: e.target.value || null })}
            className="rounded-lg bg-black/5 px-2 py-1 font-mono text-xs text-black focus:outline-none"
          />
        </label>
      )}
    </div>
  );
}

function TemplateCard() {
  const queryClient = useQueryClient();
  const apply = useMutation({
    mutationFn: () => applyFinanceTemplate(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finance"] }),
  });
  return (
    <div className="rounded-2xl border border-dashed border-olive/40 bg-white/60 p-5 text-center">
      <p className="font-heading text-sm text-olive">Start from a template</p>
      <p className="mx-auto mt-1 max-w-xs font-serif text-sm text-black/55">
        Sets you up with a fortnightly pay line and seven buckets (shared account, bills, savings,
        spending, goals and more). You fill in the amounts.
      </p>
      <button
        type="button"
        onClick={() => apply.mutate()}
        disabled={apply.isPending}
        className="mt-4 rounded-full bg-olive px-5 py-2 font-heading text-xs text-white transition-colors hover:bg-olive/90 disabled:opacity-40"
      >
        {apply.isPending ? "Setting up…" : "Use template"}
      </button>
      <p className="mt-3 font-serif text-xs text-black/40">Or add your own lines below.</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "net";
}) {
  const color =
    tone === "income" ? "text-olive" : tone === "expense" ? "text-clay-deep" : "text-black";
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
      <p className="font-heading text-[10px] uppercase tracking-wide text-black/40">{label}</p>
      <p className={cn("mt-1 font-mono text-lg leading-tight", color)}>{value}</p>
    </div>
  );
}

/** Stacked bar: each bucket's share of pay, plus whatever is unallocated. */
function BucketMeter({
  buckets,
  incomeTotal,
  unallocated,
}: {
  buckets: Entry[];
  incomeTotal: number;
  unallocated: number;
}) {
  const allocated = incomeTotal - unallocated;
  const whole = Math.max(incomeTotal, allocated);
  if (whole <= 0) return null;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-black/5">
        {buckets.map((b, i) =>
          Number(b.amount) > 0 ? (
            <div
              key={b.id}
              title={`${b.label}: ${fmt(Number(b.amount))}`}
              className={cn("h-full", BUCKET_COLOURS[i % BUCKET_COLOURS.length])}
              style={{ width: `${(Number(b.amount) / whole) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <p
        className={cn(
          "mt-2 font-serif text-xs",
          unallocated < 0 ? "text-clay-deep" : "text-black/45",
        )}
      >
        {unallocated > 0
          ? `${fmt(unallocated)} still needs a job.`
          : unallocated < 0
            ? `Your buckets are ${fmt(-unallocated)} more than your pay.`
            : "Every dollar has a job."}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function FinanceSection({
  kind,
  title,
  Icon,
  entries,
  cycle,
  incomeTotal,
}: {
  kind: "income" | "expense";
  title: string;
  Icon: typeof TrendingUp;
  entries: Entry[];
  cycle: PayCycle;
  incomeTotal?: number;
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["finance"] });

  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  const add = useMutation({
    mutationFn: () =>
      addFinanceEntry({
        data: { label: label.trim(), amount: parseAmount(amount), kind },
      }),
    onSuccess: () => {
      setLabel("");
      setAmount("");
      invalidate();
    },
  });

  const canAdd = label.trim().length > 0 && !add.isPending;

  return (
    <section>
      <div className="flex items-center gap-1.5">
        <Icon className="size-4 text-olive" strokeWidth={2} />
        <p className="font-heading text-sm uppercase text-olive">{title}</p>
        <span className="ml-auto font-serif text-xs text-black/40">per {CYCLE_WORD[cycle]}</span>
      </div>

      <div className="mt-3 space-y-2">
        {entries.map((entry, i) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            onChanged={invalidate}
            dot={kind === "expense" ? BUCKET_COLOURS[i % BUCKET_COLOURS.length] : undefined}
            share={
              kind === "expense" && incomeTotal ? Number(entry.amount) / incomeTotal : undefined
            }
          />
        ))}

        {/* Add row */}
        <div className="flex items-center gap-2 rounded-2xl bg-white/60 px-3 py-2 shadow-sm">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canAdd && add.mutate()}
            placeholder={kind === "income" ? "Add income…" : "Add a bucket…"}
            maxLength={140}
            className="min-w-0 flex-1 bg-transparent font-serif text-sm placeholder:text-black/40 focus:outline-none"
          />
          <div className="flex items-center gap-1 text-black/40">
            <span className="font-serif text-sm">$</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canAdd && add.mutate()}
              inputMode="decimal"
              placeholder="0"
              className="w-16 bg-transparent text-right font-mono text-sm text-black placeholder:text-black/30 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => canAdd && add.mutate()}
            disabled={!canAdd}
            aria-label={`Add ${kind === "income" ? "income" : "bucket"}`}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-olive text-white transition-colors hover:bg-olive/90 disabled:opacity-30"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

/** A saved line — label, amount, account and note all edit inline (save on blur). */
function EntryRow({
  entry,
  onChanged,
  dot,
  share,
}: {
  entry: Entry;
  onChanged: () => void;
  dot?: string | undefined;
  share?: number | undefined;
}) {
  const [label, setLabel] = useState(entry.label);
  const [amount, setAmount] = useState(String(entry.amount));
  const [account, setAccount] = useState(entry.account ?? "");
  const [note, setNote] = useState(entry.note ?? "");
  const isBucket = dot !== undefined;

  const save = useMutation({
    mutationFn: (patch: {
      label?: string;
      amount?: number;
      account?: string | null;
      note?: string | null;
    }) => updateFinanceEntry({ data: { id: entry.id, ...patch } }),
    onSuccess: onChanged,
  });
  const remove = useMutation({
    mutationFn: () => deleteFinanceEntry({ data: { id: entry.id } }),
    onSuccess: onChanged,
  });

  const saveLabel = () => {
    const v = label.trim();
    if (v && v !== entry.label) save.mutate({ label: v });
    else setLabel(entry.label);
  };
  const saveAmount = () => {
    const v = parseAmount(amount);
    if (v !== Number(entry.amount)) save.mutate({ amount: v });
    setAmount(String(v));
  };
  const saveText = (field: "account" | "note", value: string) => {
    const v = value.trim();
    if (v !== (entry[field] ?? "")) save.mutate({ [field]: v || null });
  };
  const blurOnEnter = (e: KeyboardEvent<HTMLInputElement>) =>
    e.key === "Enter" && e.currentTarget.blur();

  return (
    <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        {dot && <span className={cn("size-2.5 shrink-0 rounded-full", dot)} />}
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={blurOnEnter}
          maxLength={140}
          className="min-w-0 flex-1 bg-transparent font-serif text-sm text-black focus:outline-none"
        />
        {share !== undefined && share > 0 && (
          <span className="font-mono text-[11px] text-black/35">{Math.round(share * 100)}%</span>
        )}
        <div className="flex items-center gap-1">
          <span className="font-serif text-sm text-black/40">$</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={saveAmount}
            onKeyDown={blurOnEnter}
            inputMode="decimal"
            className="w-16 bg-transparent text-right font-mono text-sm text-black focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => remove.mutate()}
          aria-label={`Remove ${entry.label}`}
          className="grid size-8 shrink-0 place-items-center rounded-full text-black/30 transition-colors hover:bg-black/5 hover:text-clay-deep"
        >
          <X className="size-4" />
        </button>
      </div>
      {isBucket && (
        <div className="mt-1 space-y-0.5 pl-[18px] pr-10">
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            onBlur={() => saveText("account", account)}
            onKeyDown={blurOnEnter}
            placeholder="Which account?"
            maxLength={140}
            className="w-full bg-transparent font-heading text-[10px] uppercase tracking-wide text-olive/70 placeholder:text-black/25 focus:outline-none"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => saveText("note", note)}
            onKeyDown={blurOnEnter}
            placeholder="What it covers"
            maxLength={500}
            className="w-full bg-transparent font-serif text-xs text-black/50 placeholder:text-black/25 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

/** Months in the next year that get an extra pay (3 fortnightly / 5 weekly). */
function extraPayMonths(cycle: PayCycle, anchor: string | null, from = new Date()) {
  if (cycle === "monthly" || !anchor) return [];
  const step = cycle === "weekly" ? 7 : 14;
  const normal = cycle === "weekly" ? 4 : 2;
  const [y = 0, m = 1, d = 1] = anchor.split("-").map(Number);
  const anchorMs = Date.UTC(y, m - 1, d);
  const day = 86_400_000;
  const months: Date[] = [];
  for (let i = 0; i < 12; i++) {
    const start = Date.UTC(from.getFullYear(), from.getMonth() + i, 1);
    const end = Date.UTC(from.getFullYear(), from.getMonth() + i + 1, 0);
    const first = Math.ceil((start - anchorMs) / day / step);
    const last = Math.floor((end - anchorMs) / day / step);
    if (last - first + 1 > normal) months.push(new Date(start));
  }
  return months;
}

function ExtraPayMonths({ cycle, anchor }: { cycle: PayCycle; anchor: string | null }) {
  if (cycle === "monthly") return null;
  const months = extraPayMonths(cycle, anchor);
  const extra = cycle === "weekly" ? "fifth" : "third";
  return (
    <section className="rounded-2xl bg-gold/15 px-4 py-3">
      <div className="flex items-center gap-1.5">
        <CalendarDays className="size-4 text-gold-deep" strokeWidth={2} />
        <p className="font-heading text-sm uppercase text-gold-deep">Extra pay months</p>
      </div>
      <p className="mt-1.5 font-serif text-sm text-black/65">
        {!anchor
          ? "Add a recent payday above to see which months get an extra pay."
          : months.length === 0
            ? "No extra pays in the next 12 months."
            : `${months
                .map((d) =>
                  d.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }),
                )
                .join(
                  " and ",
                )} ${months.length === 1 ? "has" : "have"} a ${extra} pay. Your budget already runs without it, so send the whole thing to a savings goal.`}
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------- */

function SavingsGoals({ cycle }: { cycle: PayCycle }) {
  const queryClient = useQueryClient();
  const { data: goals } = useQuery(savingsGoalsQueryOptions);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["finance", "savings-goals"] });

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const add = useMutation({
    mutationFn: () =>
      addSavingsGoal({
        data: { name: name.trim(), target: parseAmount(target), saved: 0, perPay: 0 },
      }),
    onSuccess: () => {
      setName("");
      setTarget("");
      invalidate();
    },
  });
  const canAdd = name.trim().length > 0 && !add.isPending;

  return (
    <section>
      <div className="flex items-center gap-1.5">
        <PiggyBank className="size-4 text-olive" strokeWidth={2} />
        <p className="font-heading text-sm uppercase text-olive">Savings goals</p>
      </div>
      <div className="mt-3 space-y-2">
        {((goals ?? []) as SavingsGoal[]).map((g) => (
          <SavingsGoalCard key={g.id} goal={g} cycle={cycle} onChanged={invalidate} />
        ))}
        <div className="flex items-center gap-2 rounded-2xl bg-white/60 px-3 py-2 shadow-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canAdd && add.mutate()}
            placeholder="Add a savings goal…"
            maxLength={140}
            className="min-w-0 flex-1 bg-transparent font-serif text-sm placeholder:text-black/40 focus:outline-none"
          />
          <div className="flex items-center gap-1 text-black/40">
            <span className="font-serif text-sm">$</span>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canAdd && add.mutate()}
              inputMode="decimal"
              placeholder="target"
              className="w-16 bg-transparent text-right font-mono text-sm text-black placeholder:text-black/30 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => canAdd && add.mutate()}
            disabled={!canAdd}
            aria-label="Add savings goal"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-olive text-white transition-colors hover:bg-olive/90 disabled:opacity-30"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

function SavingsGoalCard({
  goal,
  cycle,
  onChanged,
}: {
  goal: SavingsGoal;
  cycle: PayCycle;
  onChanged: () => void;
}) {
  const [name, setName] = useState(goal.name);
  const [target, setTarget] = useState(String(goal.target));
  const [saved, setSaved] = useState(String(goal.saved));
  const [perPay, setPerPay] = useState(String(goal.per_pay));

  const save = useMutation({
    mutationFn: (patch: { name?: string; target?: number; saved?: number; perPay?: number }) =>
      updateSavingsGoal({ data: { id: goal.id, ...patch } }),
    onSuccess: onChanged,
  });
  const remove = useMutation({
    mutationFn: () => deleteSavingsGoal({ data: { id: goal.id } }),
    onSuccess: onChanged,
  });

  const saveNumber = (
    field: "target" | "saved" | "perPay",
    raw: string,
    current: number,
    set: (v: string) => void,
  ) => {
    const v = parseAmount(raw);
    if (v !== Number(current)) save.mutate({ [field]: v });
    set(String(v));
  };
  const blurOnEnter = (e: KeyboardEvent<HTMLInputElement>) =>
    e.key === "Enter" && e.currentTarget.blur();

  const t = Number(goal.target);
  const s = Number(goal.saved);
  const p = Number(goal.per_pay);
  const pct = t > 0 ? Math.min(1, s / t) : 0;
  const remaining = Math.max(0, t - s);
  const done = t > 0 && remaining === 0;
  const pays = p > 0 ? Math.ceil(remaining / p) : null;

  let eta: string | null = null;
  if (pays !== null && pays > 0) {
    const date = new Date();
    if (cycle === "monthly") date.setMonth(date.getMonth() + pays);
    else date.setDate(date.getDate() + pays * (cycle === "weekly" ? 7 : 14));
    eta = `${pays} ${CYCLE_WORD[cycle]}${pays === 1 ? "" : "s"} to go - around ${date.toLocaleDateString(
      undefined,
      { month: "short", year: "numeric" },
    )}`;
  }

  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const v = name.trim();
            if (v && v !== goal.name) save.mutate({ name: v });
            else setName(goal.name);
          }}
          onKeyDown={blurOnEnter}
          maxLength={140}
          className="min-w-0 flex-1 bg-transparent font-heading text-sm text-black focus:outline-none"
        />
        <span className="font-mono text-xs text-black/40">{Math.round(pct * 100)}%</span>
        <button
          type="button"
          onClick={() => remove.mutate()}
          aria-label={`Remove ${goal.name}`}
          className="grid size-7 shrink-0 place-items-center rounded-full text-black/30 transition-colors hover:bg-black/5 hover:text-clay-deep"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5">
        <div
          className={cn("h-full rounded-full", done ? "bg-olive" : "bg-gold")}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <GoalNumber
          label="Saved"
          value={saved}
          onChange={setSaved}
          onBlur={() => saveNumber("saved", saved, goal.saved, setSaved)}
          onKeyDown={blurOnEnter}
        />
        <GoalNumber
          label="Target"
          value={target}
          onChange={setTarget}
          onBlur={() => saveNumber("target", target, goal.target, setTarget)}
          onKeyDown={blurOnEnter}
        />
        <GoalNumber
          label="Per pay"
          value={perPay}
          onChange={setPerPay}
          onBlur={() => saveNumber("perPay", perPay, goal.per_pay, setPerPay)}
          onKeyDown={blurOnEnter}
        />
      </div>

      <p className="mt-2 font-serif text-xs text-black/50">
        {done
          ? "Goal reached!"
          : eta
            ? `${fmtWhole(remaining)} left · ${eta}`
            : `${fmtWhole(remaining)} left · add an amount per ${CYCLE_WORD[cycle]} to see when you'll get there`}
      </p>
    </div>
  );
}

function GoalNumber({
  label,
  value,
  onChange,
  onBlur,
  onKeyDown,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="rounded-xl bg-black/[0.03] px-2.5 py-1.5">
      <span className="block font-heading text-[9px] uppercase tracking-wide text-black/40">
        {label}
      </span>
      <span className="flex items-center gap-0.5">
        <span className="font-serif text-xs text-black/40">$</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          inputMode="decimal"
          className="w-full min-w-0 bg-transparent font-mono text-sm text-black focus:outline-none"
        />
      </span>
    </label>
  );
}

/** Parse a user-typed amount into a clamped, 2dp number. */
function parseAmount(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}
