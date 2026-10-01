import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, TrendingDown, TrendingUp, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { financeQueryOptions } from "@/lib/goal-queries";
import {
  addFinanceEntry,
  deleteFinanceEntry,
  updateFinanceEntry,
} from "@/lib/finance.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Finance planner — Goals of Growth" },
      {
        name: "description",
        content:
          "A simple monthly money plan: list your income and expenses and see what's left over.",
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
};

const fmt = (n: number) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function FinancePage() {
  const { data: entries, isPending } = useQuery(financeQueryOptions);

  const list = (entries ?? []) as Entry[];
  const income = list.filter((e) => e.kind === "income");
  const expenses = list.filter((e) => e.kind === "expense");
  const incomeTotal = income.reduce((s, e) => s + Number(e.amount), 0);
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const net = incomeTotal - expenseTotal;

  return (
    <AppShell title="Finance planner" hideSettings>
      <div className="mt-4 space-y-8 pb-4">
        <p className="font-serif text-sm text-black/50">
          Plan your month: list what's coming in and what's going out, and see
          what's left over.
        </p>

        {isPending || !entries ? (
          <Loading />
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard label="Income" value={fmt(incomeTotal)} tone="income" />
              <SummaryCard label="Expenses" value={fmt(expenseTotal)} tone="expense" />
              <SummaryCard
                label={net >= 0 ? "Left over" : "Over budget"}
                value={fmt(Math.abs(net))}
                tone={net >= 0 ? "net" : "expense"}
              />
            </div>

            <FinanceSection
              kind="income"
              title="Income"
              Icon={TrendingUp}
              entries={income}
            />
            <FinanceSection
              kind="expense"
              title="Expenses"
              Icon={TrendingDown}
              entries={expenses}
            />
          </>
        )}
      </div>
    </AppShell>
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
    tone === "income"
      ? "text-olive"
      : tone === "expense"
        ? "text-clay-deep"
        : "text-black";
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
      <p className="font-heading text-[10px] uppercase tracking-wide text-black/40">
        {label}
      </p>
      <p className={cn("mt-1 font-heading text-lg leading-tight", color)}>
        {value}
      </p>
    </div>
  );
}

function FinanceSection({
  kind,
  title,
  Icon,
  entries,
}: {
  kind: "income" | "expense";
  title: string;
  Icon: typeof TrendingUp;
  entries: Entry[];
}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["finance"] });

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
      </div>

      <div className="mt-3 space-y-2">
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} onChanged={invalidate} />
        ))}

        {/* Add row */}
        <div className="flex items-center gap-2 rounded-2xl bg-white/60 px-3 py-2 shadow-sm">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canAdd && add.mutate()}
            placeholder={kind === "income" ? "Add income…" : "Add expense…"}
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
            aria-label={`Add ${title.toLowerCase()}`}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-olive text-white transition-colors hover:bg-olive/90 disabled:opacity-30"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

/** A saved line item — label and amount edit inline (save on blur). */
function EntryRow({
  entry,
  onChanged,
}: {
  entry: Entry;
  onChanged: () => void;
}) {
  const [label, setLabel] = useState(entry.label);
  const [amount, setAmount] = useState(String(entry.amount));

  const save = useMutation({
    mutationFn: (patch: { label?: string; amount?: number }) =>
      updateFinanceEntry({ data: { id: entry.id, ...patch } }),
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

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-sm">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={saveLabel}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        maxLength={140}
        className="min-w-0 flex-1 bg-transparent font-serif text-sm text-black focus:outline-none"
      />
      <div className="flex items-center gap-1">
        <span className="font-serif text-sm text-black/40">$</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={saveAmount}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
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
  );
}

/** Parse a user-typed amount into a clamped, 2dp number. */
function parseAmount(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}
