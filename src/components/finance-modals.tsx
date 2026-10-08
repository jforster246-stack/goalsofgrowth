import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  addFinanceEntry,
  addSavingsGoal,
  deleteFinanceEntry,
  deleteSavingsGoal,
  saveFinanceSettings,
  updateFinanceEntry,
  updateSavingsGoal,
} from "@/lib/finance.functions";
import {
  CYCLE_WORD,
  bucketGroup,
  fmtWhole,
  nthPayday,
  parseAmount,
  paysUntil,
  todayIso,
  type BucketGroup,
  type FinanceEntry,
  type PayCycle,
  type SavingsGoal,
} from "@/lib/finance-plan";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-2 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40";

/** Bottom sheet on mobile, centred card on larger screens. */
function Sheet({
  title,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <form
        onSubmit={onSubmit}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </form>
    </div>
  );
}

function Field({
  label,
  optional,
  help,
  children,
}: {
  label: string;
  optional?: boolean;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className="mt-5 block">
      <span className="flex items-baseline justify-between">
        <span className="font-heading text-sm uppercase text-olive">{label}</span>
        {optional && <span className="font-serif text-xs italic text-black/40">optional</span>}
      </span>
      {children}
      {help && <span className="mt-1.5 block font-serif text-xs text-black/45">{help}</span>}
    </label>
  );
}

function MoneyInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <span className="mt-2 flex items-center gap-1 rounded-2xl bg-black/5 px-4 py-3 focus-within:ring-1 focus-within:ring-olive/40">
      <span className="font-serif text-base text-black/40">$</span>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder="0"
        className="w-full min-w-0 bg-transparent font-mono text-base text-black placeholder:text-black/30 focus:outline-none"
      />
    </span>
  );
}

function Actions({
  saveLabel,
  disabled,
  onDelete,
  deleting,
  error,
}: {
  saveLabel: string;
  disabled: boolean;
  onDelete?: (() => void) | undefined;
  deleting?: boolean;
  error?: boolean;
}) {
  return (
    <>
      <button
        type="submit"
        disabled={disabled}
        className="mt-7 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
      >
        {saveLabel}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="mt-2 w-full rounded-2xl py-3 font-heading text-sm uppercase text-clay-deep transition-colors hover:bg-clay/10 disabled:opacity-40"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      )}
      {error && (
        <p className="mt-3 text-center font-serif text-sm text-clay-deep">
          Something went wrong. Please try again.
        </p>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- */

/** How often, last payday and the main pay amount. */
export function PayModal({
  onClose,
  cycle: initialCycle,
  anchor: initialAnchor,
  income,
}: {
  onClose: () => void;
  cycle: PayCycle;
  anchor: string | null;
  income: FinanceEntry | null;
}) {
  const queryClient = useQueryClient();
  const [cycle, setCycle] = useState<PayCycle>(initialCycle);
  const [anchor, setAnchor] = useState(initialAnchor ?? "");
  const [amount, setAmount] = useState(income ? String(Number(income.amount)) : "");

  const save = useMutation({
    mutationFn: async () => {
      await saveFinanceSettings({
        data: { payCycle: cycle, payAnchor: cycle !== "monthly" && anchor ? anchor : null },
      });
      const value = parseAmount(amount);
      if (income) {
        if (value !== Number(income.amount)) {
          await updateFinanceEntry({ data: { id: income.id, amount: value } });
        }
      } else {
        await addFinanceEntry({ data: { label: "Pay", amount: value, kind: "income" } });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      onClose();
    },
  });

  return (
    <Sheet
      title="Your pay"
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Field label="How often">
        <span className="mt-2 grid grid-cols-3 gap-2">
          {(["weekly", "fortnightly", "monthly"] as PayCycle[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              aria-pressed={cycle === c}
              className={cn(
                "rounded-2xl py-2.5 font-heading text-xs uppercase transition-colors",
                cycle === c ? "bg-olive text-white" : "bg-black/5 text-black/50",
              )}
            >
              {c}
            </button>
          ))}
        </span>
      </Field>
      {cycle !== "monthly" && (
        <Field
          label="Last payday"
          optional
          help="Any recent payday. Used for your next payday and extra-pay months."
        >
          <input
            type="date"
            aria-label="Last payday"
            value={anchor}
            max={todayIso()}
            onChange={(e) => setAnchor(e.target.value)}
            className={cn(fieldClass, "font-mono")}
          />
        </Field>
      )}
      <Field label={`Pay each ${CYCLE_WORD[cycle]}`} help="After tax - what actually arrives.">
        <MoneyInput value={amount} onChange={setAmount} />
      </Field>
      <Actions
        saveLabel={save.isPending ? "Saving…" : "Save"}
        disabled={save.isPending}
        error={save.isError}
      />
    </Sheet>
  );
}

/* ---------------------------------------------------------------- */

/** Add or edit a bucket (or an extra income line). */
export function EntryModal({
  onClose,
  entry,
  kind = "expense",
  group: initialGroup,
  cycle,
}: {
  onClose: () => void;
  entry?: FinanceEntry | undefined;
  kind?: "income" | "expense";
  /** Preselects spending/saving for a new bucket. */
  group?: BucketGroup | undefined;
  cycle: PayCycle;
}) {
  const queryClient = useQueryClient();
  const editing = !!entry;
  const isIncome = (entry?.kind ?? kind) === "income";
  const [label, setLabel] = useState(entry?.label ?? "");
  const [amount, setAmount] = useState(entry ? String(Number(entry.amount)) : "");
  const [account, setAccount] = useState(entry?.account ?? "");
  const [note, setNote] = useState(entry?.note ?? "");
  const startGroup: BucketGroup = entry ? bucketGroup(entry) : (initialGroup ?? "spending");
  const [group, setGroup] = useState<BucketGroup>(startGroup);

  const done = async () => {
    await queryClient.invalidateQueries({ queryKey: ["finance"] });
    onClose();
  };

  const save = useMutation({
    mutationFn: async () => {
      const fields = {
        label: label.trim(),
        amount: parseAmount(amount),
        account: account.trim() || null,
        note: note.trim() || null,
        // Only send the group when it's a real choice, so names keep guessing.
        ...(!isIncome && (group !== startGroup || (!editing && initialGroup))
          ? { bucketGroup: group }
          : {}),
      };
      if (editing) await updateFinanceEntry({ data: { id: entry!.id, ...fields } });
      else await addFinanceEntry({ data: { ...fields, kind: isIncome ? "income" : "expense" } });
    },
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: () => deleteFinanceEntry({ data: { id: entry!.id } }),
    onSuccess: done,
  });

  const noun = isIncome ? "income" : "bucket";
  return (
    <Sheet
      title={editing ? `Edit ${noun}` : `New ${noun}`}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        if (label.trim() && !save.isPending) save.mutate();
      }}
    >
      <Field label="Name">
        <input
          autoFocus={!editing}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={isIncome ? "e.g. Side project" : "e.g. Spending"}
          maxLength={140}
          className={fieldClass}
        />
      </Field>
      <Field label={`Amount each ${CYCLE_WORD[cycle]}`}>
        <MoneyInput value={amount} onChange={setAmount} autoFocus={editing} />
      </Field>
      {!isIncome && (
        <>
          <Field label="Type">
            <span className="mt-2 grid grid-cols-2 gap-2">
              {(["spending", "saving"] as BucketGroup[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  aria-pressed={group === g}
                  className={cn(
                    "rounded-2xl py-2.5 font-heading text-xs uppercase transition-colors",
                    group === g ? "bg-olive text-white" : "bg-black/5 text-black/50",
                  )}
                >
                  {g}
                </button>
              ))}
            </span>
          </Field>
          <Field label="What it covers" optional>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Takeaway, fun, clothes"
              maxLength={500}
              className={fieldClass}
            />
          </Field>
          <Field label="Which account" optional help="Where you transfer this money each pay.">
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="e.g. Spending card"
              maxLength={140}
              className={fieldClass}
            />
          </Field>
        </>
      )}
      <Actions
        saveLabel={save.isPending ? "Saving…" : editing ? "Save" : `Add ${noun}`}
        disabled={!label.trim() || save.isPending}
        onDelete={editing ? () => remove.mutate() : undefined}
        deleting={remove.isPending}
        error={save.isError || remove.isError}
      />
    </Sheet>
  );
}

/* ---------------------------------------------------------------- */

function monthYear(d: Date | string) {
  const date = typeof d === "string" ? new Date(`${d}T00:00:00Z`) : d;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function SavingsGoalModal({
  onClose,
  goal,
  cycle,
  anchor,
}: {
  onClose: () => void;
  goal?: SavingsGoal | undefined;
  cycle: PayCycle;
  anchor: string | null;
}) {
  const queryClient = useQueryClient();
  const editing = !!goal;
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? String(Number(goal.target)) : "");
  const [saved, setSaved] = useState(goal ? String(Number(goal.saved)) : "");
  const [perPay, setPerPay] = useState(goal ? String(Number(goal.per_pay)) : "");
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");

  const word = CYCLE_WORD[cycle];
  const remaining = Math.max(0, parseAmount(target) - parseAmount(saved));
  const paysLeft = targetDate ? paysUntil(cycle, anchor, targetDate) : 0;
  const suggested =
    targetDate && remaining > 0 && paysLeft > 0 ? Math.ceil(remaining / paysLeft) : null;

  // Changing the date or amounts recalculates the per-pay amount; editing the
  // per-pay amount yourself is left alone. Skip the first run so opening an
  // existing goal keeps what was saved.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (suggested !== null) setPerPay(String(suggested));
  }, [suggested]);

  const perPayValue = parseAmount(perPay);
  const paysAtChosen = perPayValue > 0 && remaining > 0 ? Math.ceil(remaining / perPayValue) : null;
  const reachDate = paysAtChosen ? nthPayday(cycle, anchor, paysAtChosen) : null;
  const reachIso = reachDate ? reachDate.toISOString().slice(0, 10) : null;

  let perPayHelp = "Used to estimate when you'll reach it.";
  if (remaining === 0 && parseAmount(target) > 0) {
    perPayHelp = "You've already got there.";
  } else if (targetDate && paysLeft === 0) {
    perPayHelp = "Pick a date with at least one payday before it.";
  } else if (suggested !== null) {
    perPayHelp = `To reach ${fmtWhole(parseAmount(target))} by ${monthYear(targetDate)} (${paysLeft} ${paysLeft === 1 ? "pay" : "pays"}), put in about ${fmtWhole(suggested)} each ${word}.`;
    if (reachDate && reachIso && perPayValue > 0 && perPayValue < suggested) {
      perPayHelp += ` At ${fmtWhole(perPayValue)} you'd get there around ${monthYear(reachDate)} instead.`;
    } else if (reachDate && perPayValue > suggested) {
      perPayHelp += ` At ${fmtWhole(perPayValue)} you'd get there early, around ${monthYear(reachDate)}.`;
    }
  } else if (reachDate) {
    perPayHelp = `At this amount you'd get there around ${monthYear(reachDate)}.`;
  }

  const done = async () => {
    await queryClient.invalidateQueries({ queryKey: ["finance", "savings-goals"] });
    onClose();
  };
  const save = useMutation({
    mutationFn: () => {
      const fields = {
        name: name.trim(),
        target: parseAmount(target),
        saved: parseAmount(saved),
        perPay: parseAmount(perPay),
        // Only send the date when it's set or being cleared.
        ...(targetDate || goal?.target_date ? { targetDate: targetDate || null } : {}),
      };
      return editing
        ? updateSavingsGoal({ data: { id: goal!.id, ...fields } })
        : addSavingsGoal({ data: fields });
    },
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: () => deleteSavingsGoal({ data: { id: goal!.id } }),
    onSuccess: done,
  });

  return (
    <Sheet
      title={editing ? "Edit savings goal" : "New savings goal"}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && !save.isPending) save.mutate();
      }}
    >
      <Field label="What are you saving for?">
        <input
          autoFocus={!editing}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Europe trip"
          maxLength={140}
          className={fieldClass}
        />
      </Field>
      <Field label="Goal amount">
        <MoneyInput value={target} onChange={setTarget} />
      </Field>
      <Field label="Saved so far" optional>
        <MoneyInput value={saved} onChange={setSaved} />
      </Field>
      <Field label="Reach it by" optional help="Pick a date and we'll work out what to put in.">
        <span className="mt-2 flex items-center gap-2">
          <input
            type="date"
            aria-label="Reach it by"
            value={targetDate}
            min={tomorrowIso()}
            onChange={(e) => setTargetDate(e.target.value)}
            className={cn(fieldClass, "mt-0 flex-1 font-mono")}
          />
          {targetDate && (
            <button
              type="button"
              onClick={() => setTargetDate("")}
              className="shrink-0 px-2 font-heading text-[11px] uppercase text-black/45 hover:text-black/70"
            >
              Clear
            </button>
          )}
        </span>
      </Field>
      <Field label={`Put in each ${word}`} optional help={perPayHelp}>
        <MoneyInput value={perPay} onChange={setPerPay} />
      </Field>
      <Actions
        saveLabel={save.isPending ? "Saving…" : editing ? "Save" : "Add goal"}
        disabled={!name.trim() || save.isPending}
        onDelete={editing ? () => remove.mutate() : undefined}
        deleting={remove.isPending}
        error={save.isError || remove.isError}
      />
    </Sheet>
  );
}
