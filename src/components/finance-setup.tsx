import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CalendarRange, Check, Plus, Repeat, X } from "lucide-react";
import { saveFinancePlan } from "@/lib/finance.functions";
import {
  BUCKET_COLOURS,
  CYCLE_PHRASE,
  CYCLE_WORD,
  SUGGESTED_BUCKETS,
  fmtWhole,
  parseAmount,
  todayIso,
  type FinanceEntry,
  type PayCycle,
} from "@/lib/finance-plan";
import { cn } from "@/lib/utils";

type Option = {
  key: string;
  id: string | null;
  label: string;
  note: string;
  hint: string;
  picked: boolean;
  amount: string;
};

const CYCLES: { key: PayCycle; label: string; detail: string; Icon: typeof Repeat }[] = [
  { key: "weekly", label: "Every week", detail: "52 pays a year", Icon: Repeat },
  { key: "fortnightly", label: "Every fortnight", detail: "26 pays a year", Icon: CalendarRange },
  { key: "monthly", label: "Every month", detail: "12 pays a year", Icon: CalendarDays },
];

const inputClass =
  "w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-base placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40";

/** Builds the bucket checklist: what's already saved, then the suggestions. */
function initialOptions(buckets: FinanceEntry[]): Option[] {
  const saved = buckets.map<Option>((b) => {
    const match = SUGGESTED_BUCKETS.find((s) => s.label === b.label);
    return {
      key: b.id,
      id: b.id,
      label: b.label,
      note: b.note ?? match?.note ?? "",
      hint: match?.hint ?? "",
      picked: true,
      amount: Number(b.amount) > 0 ? String(Number(b.amount)) : "",
    };
  });
  const taken = new Set(buckets.map((b) => b.label));
  const suggestions = SUGGESTED_BUCKETS.filter((s) => !taken.has(s.label)).map<Option>((s) => ({
    key: `suggested-${s.label}`,
    id: null,
    label: s.label,
    note: s.note,
    hint: s.hint,
    picked: buckets.length === 0,
    amount: "",
  }));
  return [...saved, ...suggestions];
}

/** Full-screen, one-question-per-screen setup for the finance planner. */
export function FinanceSetup({
  onClose,
  cycle: initialCycle,
  anchor: initialAnchor,
  income,
  buckets,
}: {
  onClose: () => void;
  cycle: PayCycle | null;
  anchor: string | null;
  income: FinanceEntry | null;
  buckets: FinanceEntry[];
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState<PayCycle | null>(initialCycle);
  const [anchor, setAnchor] = useState(initialAnchor ?? "");
  const [pay, setPay] = useState(
    income && Number(income.amount) > 0 ? String(Number(income.amount)) : "",
  );
  const [options, setOptions] = useState<Option[]>(() => initialOptions(buckets));
  const [customDraft, setCustomDraft] = useState("");

  // Monthly pay has no payday question, so it skips that screen.
  const steps = [
    "cycle",
    ...(cycle === "monthly" ? [] : ["payday"]),
    "pay",
    "pick",
    "amounts",
    "done",
  ];
  const current = steps[step] ?? "cycle";
  const word = CYCLE_WORD[cycle ?? "fortnightly"];

  const picked = options.filter((o) => o.picked);
  const payAmount = parseAmount(pay);
  const planned = picked.reduce((s, o) => s + parseAmount(o.amount), 0);
  const left = payAmount - planned;

  const save = useMutation({
    mutationFn: () =>
      saveFinancePlan({
        data: {
          payCycle: cycle ?? "fortnightly",
          payAnchor: cycle !== "monthly" && anchor ? anchor : null,
          income: { id: income?.id ?? null, amount: payAmount },
          buckets: picked.map((o) => ({
            id: o.id,
            label: o.label,
            amount: parseAmount(o.amount),
            note: o.note || null,
          })),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      onClose();
    },
  });

  const canContinue =
    current === "cycle"
      ? cycle !== null
      : current === "pay"
        ? payAmount > 0
        : current === "pick"
          ? picked.length > 0
          : true;

  const next = () => {
    if (!canContinue) return;
    if (current === "done") save.mutate();
    else setStep((s) => s + 1);
  };

  const toggle = (key: string) =>
    setOptions((all) => all.map((o) => (o.key === key ? { ...o, picked: !o.picked } : o)));

  const addCustom = () => {
    const label = customDraft.trim();
    if (!label) return;
    setOptions((all) => [
      ...all,
      {
        key: `custom-${Date.now()}`,
        id: null,
        label,
        note: "",
        hint: "",
        picked: true,
        amount: "",
      },
    ]);
    setCustomDraft("");
  };

  const setAmount = (key: string, amount: string) =>
    setOptions((all) => all.map((o) => (o.key === key ? { ...o, amount } : o)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6">
        {/* Header + progress */}
        <div className="flex items-center justify-between">
          <p className="font-heading text-sm uppercase text-olive">
            Step {step + 1} of {steps.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-olive" : "bg-black/10",
              )}
            />
          ))}
        </div>

        <div className="mt-8 flex-1">
          {current === "cycle" && (
            <div>
              <h2 className="font-display text-3xl leading-tight text-black">
                How often do you get paid?
              </h2>
              <div className="mt-6 space-y-2">
                {CYCLES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCycle(c.key)}
                    aria-pressed={cycle === c.key}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left shadow-sm transition-colors",
                      cycle === c.key ? "bg-olive text-white" : "bg-white text-black",
                    )}
                  >
                    <c.Icon className="size-5 shrink-0" strokeWidth={2} />
                    <span className="flex-1">
                      <span className="block font-heading text-base">{c.label}</span>
                      <span
                        className={cn(
                          "block font-serif text-xs",
                          cycle === c.key ? "text-white/70" : "text-black/45",
                        )}
                      >
                        {c.detail}
                      </span>
                    </span>
                    {cycle === c.key && <Check className="size-5" strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current === "payday" && (
            <div>
              <h2 className="font-display text-3xl leading-tight text-black">
                When was your last payday?
              </h2>
              <p className="mt-2 font-serif text-sm text-black/55">
                Any recent payday works. It's used to show your next payday and the months that get
                an extra pay.
              </p>
              <input
                type="date"
                aria-label="Last payday"
                value={anchor}
                max={todayIso()}
                onChange={(e) => setAnchor(e.target.value)}
                className={cn(inputClass, "mt-6 font-mono")}
              />
              <p className="mt-3 font-serif text-xs text-black/40">
                Not sure? You can skip this and add it later.
              </p>
            </div>
          )}

          {current === "pay" && (
            <div>
              <h2 className="font-display text-3xl leading-tight text-black">
                How much lands in your account each pay?
              </h2>
              <p className="mt-2 font-serif text-sm text-black/55">
                Use the amount after tax, the number you actually see arrive.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-4 shadow-sm">
                <span className="font-serif text-2xl text-black/40">$</span>
                <input
                  autoFocus
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  inputMode="decimal"
                  placeholder="0"
                  aria-label="Pay amount"
                  className="w-full min-w-0 bg-transparent font-mono text-3xl text-black placeholder:text-black/20 focus:outline-none"
                />
              </div>
              <p className="mt-3 font-serif text-xs text-black/40">
                {CYCLE_PHRASE[cycle ?? "fortnightly"]}
              </p>
            </div>
          )}

          {current === "pick" && (
            <div>
              <h2 className="font-display text-3xl leading-tight text-black">
                Where does your pay need to go?
              </h2>
              <p className="mt-2 font-serif text-sm text-black/55">
                Tick the buckets you want. You'll pick the amounts next, and you can rename or add
                more any time.
              </p>
              <div className="mt-5 space-y-2">
                {options.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => toggle(o.key)}
                    aria-pressed={o.picked}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left shadow-sm transition-colors",
                      o.picked ? "bg-white" : "bg-white/50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
                        o.picked ? "border-olive bg-olive text-white" : "border-black/20",
                      )}
                    >
                      {o.picked && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block font-heading text-sm",
                          o.picked ? "text-black" : "text-black/50",
                        )}
                      >
                        {o.label}
                      </span>
                      {o.note && (
                        <span className="block font-serif text-xs text-black/45">{o.note}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  placeholder="Add your own bucket…"
                  maxLength={140}
                  className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
                />
                <button
                  type="button"
                  onClick={addCustom}
                  disabled={!customDraft.trim()}
                  aria-label="Add bucket"
                  className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage/60 text-white transition-colors hover:bg-sage/80 disabled:opacity-40"
                >
                  <Plus className="size-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {current === "amounts" && (
            <div>
              <h2 className="font-display text-3xl leading-tight text-black">
                How much goes to each?
              </h2>
              <p className="mt-2 font-serif text-sm text-black/55">
                Amounts per {word}. Start with the must-pays, then share out what's left.
              </p>
              <div className="mt-5 space-y-2">
                {picked.map((o, i) => (
                  <label key={o.key} className="block rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          BUCKET_COLOURS[i % BUCKET_COLOURS.length],
                        )}
                      />
                      <span className="min-w-0 flex-1 font-heading text-sm text-black">
                        {o.label}
                      </span>
                      <span className="flex items-center gap-1 rounded-xl bg-black/5 px-3 py-1.5">
                        <span className="font-serif text-sm text-black/40">$</span>
                        <input
                          value={o.amount}
                          onChange={(e) => setAmount(o.key, e.target.value)}
                          inputMode="decimal"
                          placeholder="0"
                          aria-label={`${o.label} amount`}
                          className="w-20 bg-transparent text-right font-mono text-base text-black placeholder:text-black/25 focus:outline-none"
                        />
                      </span>
                    </span>
                    {(o.hint || o.note) && (
                      <span className="mt-1 block pl-[22px] font-serif text-xs text-black/45">
                        {o.hint || o.note}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {current === "done" && (
            <div>
              <h2 className="font-display text-3xl leading-tight text-black">
                {left === 0
                  ? "Every dollar has a job"
                  : left > 0
                    ? "Nearly there"
                    : "A little over"}
              </h2>
              <p className="mt-2 font-serif text-sm text-black/55">
                {left === 0
                  ? `Your ${fmtWhole(payAmount)} pay is fully planned. You can change anything later from the planner.`
                  : left > 0
                    ? `${fmtWhole(left)} of your pay doesn't have a bucket yet. You can save now and sort it out on the planner, or go back and add it to a bucket.`
                    : `Your buckets add up to ${fmtWhole(-left)} more than your pay. You can save now and trim them on the planner, or go back and adjust.`}
              </p>
              <div className="mt-5 space-y-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm">
                {picked.map((o, i) => (
                  <div key={o.key} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "size-2.5 shrink-0 rounded-full",
                        BUCKET_COLOURS[i % BUCKET_COLOURS.length],
                      )}
                    />
                    <span className="min-w-0 flex-1 font-serif text-sm text-black">{o.label}</span>
                    <span className="font-mono text-sm text-black">
                      {fmtWhole(parseAmount(o.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer: running total + buttons stay in view while typing */}
        <div className="sticky bottom-0 -mx-5 mt-6 bg-background px-5 pt-3 pb-4">
          {(current === "amounts" || current === "done") && (
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-center font-serif text-sm",
                left === 0
                  ? "bg-olive/10 text-olive"
                  : left > 0
                    ? "bg-gold/15 text-gold-deep"
                    : "bg-clay/10 text-clay-deep",
              )}
            >
              {left === 0
                ? "All planned - nothing left over"
                : left > 0
                  ? `${fmtWhole(left)} left to plan`
                  : `${fmtWhole(-left)} over your pay`}
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2",
              (current === "amounts" || current === "done") && "mt-3",
            )}
          >
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-2xl px-5 py-3.5 font-heading text-sm uppercase text-black/50 transition-colors hover:text-black/80"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!canContinue || save.isPending}
              className="flex-1 rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
            >
              {current === "done"
                ? save.isPending
                  ? "Saving…"
                  : "Save my plan"
                : current === "payday" && !anchor
                  ? "Skip"
                  : "Continue"}
            </button>
          </div>
          {save.isError && (
            <p className="mt-3 text-center font-serif text-sm text-clay-deep">
              Something went wrong saving. Please try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
