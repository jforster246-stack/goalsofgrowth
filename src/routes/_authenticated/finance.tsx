import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { CalendarDays, ChevronRight, PiggyBank, Plus, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { FinanceSetup } from "@/components/finance-setup";
import { EntryModal, PayModal, SavingsGoalModal } from "@/components/finance-modals";
import {
  financeQueryOptions,
  financeSettingsQueryOptions,
  savingsGoalsQueryOptions,
} from "@/lib/goal-queries";
import {
  BUCKET_COLOURS,
  CYCLE_PHRASE,
  CYCLE_WORD,
  PAYS_PER_YEAR,
  bucketGroup,
  extraPayMonths,
  fmtWhole,
  nextPayday,
  paysInMonths,
  type BucketGroup,
  type FinanceEntry,
  type PayCycle,
  type SavingsGoal,
} from "@/lib/finance-plan";
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

type Sheet =
  | { kind: "setup" }
  | { kind: "pay" }
  | {
      kind: "entry";
      entry?: FinanceEntry | undefined;
      entryKind?: "income" | "expense";
      group?: BucketGroup;
    }
  | { kind: "goal"; goal?: SavingsGoal | undefined };

function FinancePage() {
  const { data: entries, isPending } = useQuery(financeQueryOptions);
  // Settings live in a newer table; if it isn't there yet, fall back to
  // monthly instead of blocking the page.
  const { data: settings, isError: settingsMissing } = useQuery({
    ...financeSettingsQueryOptions,
    retry: 1,
  });
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const close = () => setSheet(null);

  const list = (entries ?? []) as FinanceEntry[];
  const incomes = list.filter((e) => e.kind === "income");
  const mainIncome = incomes[0] ?? null;
  const otherIncomes = incomes.slice(1);
  const buckets = list.filter((e) => e.kind === "expense");
  const payTotal = incomes.reduce((s, e) => s + Number(e.amount), 0);
  const planned = buckets.reduce((s, e) => s + Number(e.amount), 0);
  const left = payTotal - planned;
  const cycle = (settings?.payCycle ?? "monthly") as PayCycle;
  const anchor = settings?.payAnchor ?? null;
  const isEmpty = list.length === 0;

  return (
    <AppShell title="Finance planner" hideSettings>
      <div className="mt-4 w-full space-y-8 pb-4">
        {isPending || !entries ? (
          <Loading />
        ) : (
          <>
            {settingsMissing && (
              <div className="rounded-2xl bg-clay/10 px-4 py-3 font-serif text-sm text-clay-deep">
                The planner's latest database update hasn't been applied yet, so some changes won't
                save. Ask Lovable to apply the pending finance migration, then refresh.
              </div>
            )}

            {isEmpty ? (
              <div className="rounded-3xl bg-white px-6 py-8 text-center shadow-sm">
                <Wallet className="mx-auto size-8 text-olive" strokeWidth={1.75} />
                <h2 className="mt-3 font-display text-3xl leading-tight text-black">
                  Let's plan your pay
                </h2>
                <p className="mx-auto mt-2 max-w-xs font-serif text-sm text-black/55">
                  A few quick questions to split your pay into buckets, so every dollar has a job.
                  Takes about two minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setSheet({ kind: "setup" })}
                  className="mt-6 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90"
                >
                  Start setup
                </button>
              </div>
            ) : (
              <>
                <PayCard
                  total={payTotal}
                  cycle={cycle}
                  anchor={anchor}
                  otherIncomes={otherIncomes}
                  onEdit={() => setSheet({ kind: "pay" })}
                  onEditIncome={(entry) => setSheet({ kind: "entry", entry })}
                />

                <SavingsGoals cycle={cycle} onOpen={(goal) => setSheet({ kind: "goal", goal })} />

                <PlanStatus buckets={buckets} payTotal={payTotal} left={left} />

                <section>
                  <SectionTitle Icon={Wallet} title="Your buckets" />
                  <p className="mt-1 font-serif text-xs text-black/45">
                    Tap a bucket to change it. Amounts are per {CYCLE_WORD[cycle]}.
                  </p>
                  <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-5">
                    {(["spending", "saving"] as BucketGroup[]).map((group) => (
                      <BucketColumn
                        key={group}
                        group={group}
                        buckets={buckets}
                        payTotal={payTotal}
                        onOpen={(entry) => setSheet({ kind: "entry", entry })}
                        onAdd={() => setSheet({ kind: "entry", entryKind: "expense", group })}
                      >
                        {group === "saving" && (
                          <SavingsProjection
                            buckets={buckets.filter((b) => bucketGroup(b) === "saving")}
                            cycle={cycle}
                            anchor={anchor}
                          />
                        )}
                      </BucketColumn>
                    ))}
                  </div>
                </section>

                <ExtraPayMonths cycle={cycle} anchor={anchor} />
              </>
            )}

            {!isEmpty && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSheet({ kind: "entry", entryKind: "income" })}
                  className="font-heading text-xs uppercase text-black/40 transition-colors hover:text-olive"
                >
                  Add another income
                </button>
                <button
                  type="button"
                  onClick={() => setSheet({ kind: "setup" })}
                  className="font-heading text-xs uppercase text-black/40 transition-colors hover:text-olive"
                >
                  Redo guided setup
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {sheet?.kind === "setup" && (
        <FinanceSetup
          onClose={close}
          cycle={settings && !isEmpty ? cycle : null}
          anchor={anchor}
          income={mainIncome}
          buckets={buckets}
        />
      )}
      {sheet?.kind === "pay" && (
        <PayModal onClose={close} cycle={cycle} anchor={anchor} income={mainIncome} />
      )}
      {sheet?.kind === "entry" && (
        <EntryModal
          onClose={close}
          entry={sheet.entry}
          kind={sheet.entryKind ?? "expense"}
          group={sheet.group}
          cycle={cycle}
        />
      )}
      {sheet?.kind === "goal" && (
        <SavingsGoalModal onClose={close} goal={sheet.goal} cycle={cycle} />
      )}
    </AppShell>
  );
}

/* ---------------------------------------------------------------- */

function SectionTitle({ Icon, title }: { Icon: typeof Wallet; title: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-4 text-olive" strokeWidth={2} />
      <p className="font-heading text-sm uppercase text-olive">{title}</p>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-olive/35 py-3 font-heading text-xs uppercase text-olive transition-colors hover:bg-olive/5"
    >
      <Plus className="size-4" strokeWidth={2.5} />
      {label}
    </button>
  );
}

function PayCard({
  total,
  cycle,
  anchor,
  otherIncomes,
  onEdit,
  onEditIncome,
}: {
  total: number;
  cycle: PayCycle;
  anchor: string | null;
  otherIncomes: FinanceEntry[];
  onEdit: () => void;
  onEditIncome: (entry: FinanceEntry) => void;
}) {
  const next = nextPayday(cycle, anchor);
  return (
    <div className="rounded-3xl bg-olive px-5 py-5 text-white shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-heading text-[11px] uppercase tracking-wide text-white/60">Your pay</p>
          <p className="mt-1 font-mono text-4xl leading-none">{fmtWhole(total)}</p>
          <p className="mt-2 font-serif text-sm text-white/75">{CYCLE_PHRASE[cycle]}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full bg-white/15 px-4 py-2 font-heading text-xs uppercase text-white transition-colors hover:bg-white/25"
        >
          Edit
        </button>
      </div>
      {otherIncomes.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-white/15 pt-3">
          {otherIncomes.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onEditIncome(e)}
              className="flex w-full items-center justify-between font-serif text-sm text-white/80"
            >
              <span>incl. {e.label}</span>
              <span className="font-mono">{fmtWhole(Number(e.amount))}</span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 border-t border-white/15 pt-3 font-serif text-xs text-white/65">
        {next
          ? `Next payday: ${next.toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            })}`
          : cycle === "monthly"
            ? "Paid monthly"
            : "Add your last payday to see the next one"}
        {cycle !== "monthly" && total > 0
          ? ` · about ${fmtWhole((total * PAYS_PER_YEAR[cycle]) / 12)} a month`
          : ""}
      </p>
    </div>
  );
}

/** Stacked bar of the buckets plus one plain sentence about what's left. */
function PlanStatus({
  buckets,
  payTotal,
  left,
}: {
  buckets: FinanceEntry[];
  payTotal: number;
  left: number;
}) {
  const whole = Math.max(payTotal, payTotal - left);
  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3",
        left === 0 ? "bg-olive/10" : left > 0 ? "bg-gold/15" : "bg-clay/10",
      )}
    >
      <p
        className={cn(
          "font-heading text-sm",
          left === 0 ? "text-olive" : left > 0 ? "text-gold-deep" : "text-clay-deep",
        )}
      >
        {left === 0
          ? "Every dollar has a job"
          : left > 0
            ? `${fmtWhole(left)} still needs a bucket`
            : `${fmtWhole(-left)} over your pay`}
      </p>
      <p className="mt-0.5 font-serif text-xs text-black/50">
        {left === 0
          ? "Your whole pay is planned."
          : left > 0
            ? "Add it to a bucket below, or start a new one."
            : "Lower a bucket or two until this reaches $0."}
      </p>
      {whole > 0 && (
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-white/70">
          {buckets.map((b, i) =>
            Number(b.amount) > 0 ? (
              <div
                key={b.id}
                className={cn("h-full", BUCKET_COLOURS[i % BUCKET_COLOURS.length])}
                style={{ width: `${(Number(b.amount) / whole) * 100}%` }}
              />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

function BucketCard({
  bucket,
  dot,
  share,
  onClick,
}: {
  bucket: FinanceEntry;
  dot: string;
  share: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-white/80"
    >
      <span className={cn("size-3 shrink-0 rounded-full", dot)} />
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-sm text-black">{bucket.label}</span>
        {bucket.note && (
          <span className="block font-serif text-xs text-black/50">{bucket.note}</span>
        )}
        {bucket.account && (
          <span className="mt-0.5 block font-heading text-[10px] uppercase tracking-wide text-olive/70">
            → {bucket.account}
          </span>
        )}
      </span>
      <span className="text-right">
        <span className="block font-mono text-base text-black">
          {fmtWhole(Number(bucket.amount))}
        </span>
        {share > 0 && (
          <span className="block font-mono text-[11px] text-black/35">
            {Math.round(share * 100)}%
          </span>
        )}
      </span>
      <ChevronRight className="size-4 shrink-0 text-black/25" />
    </button>
  );
}

/** One column of buckets (spending or saving) with its total. */
function BucketColumn({
  group,
  buckets,
  payTotal,
  onOpen,
  onAdd,
  children,
}: {
  group: BucketGroup;
  buckets: FinanceEntry[];
  payTotal: number;
  onOpen: (entry: FinanceEntry) => void;
  onAdd: () => void;
  children?: ReactNode;
}) {
  // Colours follow each bucket's place in the full list, so they match the bar.
  const mine = buckets
    .map((b, i) => ({ b, dot: BUCKET_COLOURS[i % BUCKET_COLOURS.length]! }))
    .filter(({ b }) => bucketGroup(b) === group);
  const total = mine.reduce((s, { b }) => s + Number(b.amount), 0);
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-black/10 pb-2">
        <p className="font-heading text-sm uppercase text-black">
          {group === "spending" ? "Spending" : "Saving"}
        </p>
        <p className="font-mono text-sm text-black/60">{fmtWhole(total)}</p>
      </div>
      <div className="mt-3 space-y-2">
        {mine.length === 0 && (
          <p className="font-serif text-xs text-black/45">
            {group === "saving"
              ? "No saving buckets yet. Add one, or tap a bucket and switch it to Saving."
              : "No spending buckets yet."}
          </p>
        )}
        {mine.map(({ b, dot }) => (
          <BucketCard
            key={b.id}
            bucket={b}
            dot={dot}
            share={payTotal > 0 ? Number(b.amount) / payTotal : 0}
            onClick={() => onOpen(b)}
          />
        ))}
        <AddButton label={group === "spending" ? "Add spending" : "Add saving"} onClick={onAdd} />
      </div>
      {children}
    </div>
  );
}

const PROJECTION_MONTHS = [
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 9, label: "9 months" },
  { months: 12, label: "1 year" },
];

/** "If you save $X every fortnight for N months, you'll have $Y." */
function SavingsProjection({
  buckets,
  cycle,
  anchor,
}: {
  buckets: FinanceEntry[];
  cycle: PayCycle;
  anchor: string | null;
}) {
  const [months, setMonths] = useState(6);
  const perPay = buckets.reduce((s, b) => s + Number(b.amount), 0);
  if (perPay <= 0) return null;
  const pays = paysInMonths(cycle, anchor, months);
  const total = perPay * pays;
  const period = PROJECTION_MONTHS.find((p) => p.months === months)?.label ?? "";

  return (
    <div className="mt-4 rounded-2xl bg-olive/10 px-4 py-4">
      <div className="grid grid-cols-4 gap-1.5">
        {PROJECTION_MONTHS.map((p) => (
          <button
            key={p.months}
            type="button"
            onClick={() => setMonths(p.months)}
            aria-pressed={months === p.months}
            className={cn(
              "rounded-full px-1 py-1.5 font-heading text-[11px] whitespace-nowrap uppercase transition-colors",
              months === p.months ? "bg-olive text-white" : "bg-white/70 text-black/55",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-3 font-serif text-sm text-black/65">
        If you save {fmtWhole(perPay)} {CYCLE_PHRASE[cycle]} for {period}, you'll have
      </p>
      <p className="mt-1 font-mono text-3xl leading-none text-olive">{fmtWhole(total)}</p>
      <p className="mt-2 font-serif text-xs text-black/45">
        That's {pays} {pays === 1 ? "pay" : "pays"}
        {cycle !== "monthly" && anchor ? ", counted from your paydays" : ""}.
      </p>
      {buckets.length > 1 && (
        <div className="mt-3 space-y-1 border-t border-olive/15 pt-3">
          {buckets.map((b) => (
            <div key={b.id} className="flex justify-between font-serif text-xs text-black/60">
              <span>{b.label}</span>
              <span className="font-mono">{fmtWhole(Number(b.amount) * pays)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExtraPayMonths({ cycle, anchor }: { cycle: PayCycle; anchor: string | null }) {
  if (cycle === "monthly" || !anchor) return null;
  const months = extraPayMonths(cycle, anchor);
  if (months.length === 0) return null;
  const extra = cycle === "weekly" ? "fifth" : "third";
  return (
    <section className="rounded-2xl bg-gold/15 px-4 py-3">
      <div className="flex items-center gap-1.5">
        <CalendarDays className="size-4 text-gold-deep" strokeWidth={2} />
        <p className="font-heading text-sm uppercase text-gold-deep">Bonus pay months</p>
      </div>
      <p className="mt-1.5 font-serif text-sm text-black/65">
        {months
          .map((d) =>
            d.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }),
          )
          .join(" and ")}{" "}
        {months.length === 1 ? "has" : "have"} a {extra} pay. Your plan already works without it, so
        put the whole thing towards a savings goal.
      </p>
    </section>
  );
}

function SavingsGoals({
  cycle,
  onOpen,
}: {
  cycle: PayCycle;
  onOpen: (goal?: SavingsGoal) => void;
}) {
  const { data: goals } = useQuery({ ...savingsGoalsQueryOptions, retry: 1 });
  const list = (goals ?? []) as SavingsGoal[];
  return (
    <section>
      <SectionTitle Icon={PiggyBank} title="Savings goals" />
      <div className="mt-3 space-y-2">
        {list.map((g) => (
          <SavingsGoalCard key={g.id} goal={g} cycle={cycle} onClick={() => onOpen(g)} />
        ))}
        <AddButton label="Add a savings goal" onClick={() => onOpen()} />
      </div>
    </section>
  );
}

function SavingsGoalCard({
  goal,
  cycle,
  onClick,
}: {
  goal: SavingsGoal;
  cycle: PayCycle;
  onClick: () => void;
}) {
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
    eta = `around ${date.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-2xl bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-white/80"
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-heading text-sm text-black">{goal.name}</span>
        <span className="font-mono text-sm text-black">
          {fmtWhole(s)} <span className="text-black/35">/ {fmtWhole(t)}</span>
        </span>
      </span>
      <span className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-black/5">
        <span
          className={cn("block h-full rounded-full", done ? "bg-olive" : "bg-gold")}
          style={{ width: `${pct * 100}%` }}
        />
      </span>
      <span className="mt-2 block font-serif text-xs text-black/50">
        {done
          ? "Goal reached!"
          : eta
            ? `${fmtWhole(p)} each ${CYCLE_WORD[cycle]} · ${fmtWhole(remaining)} to go, ${eta}`
            : `${fmtWhole(remaining)} to go · tap to add how much you'll put in each ${CYCLE_WORD[cycle]}`}
      </span>
    </button>
  );
}
