import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Moon, Plus, Sun, Sunset, X } from "lucide-react";
import type { HabitTime } from "@/components/home-cards";
import { parseDays, type Frequency } from "@/lib/habit-schedule";
import { createHabit, deleteHabit, updateHabit } from "@/lib/habits.functions";
import { cn } from "@/lib/utils";

export type EditableHabit = {
  id: string;
  name: string;
  time_of_day: HabitTime;
  frequency: string;
  days_of_week?: string | null;
  interval_days?: number | null;
  reason: string | null;
};

const TIMES: { key: HabitTime; label: string; Icon: typeof Sun; activeBg: string }[] = [
  { key: "morning", label: "Morning", Icon: Sun, activeBg: "bg-gold-deep" },
  { key: "afternoon", label: "Afternoon", Icon: Sunset, activeBg: "bg-clay-deep" },
  { key: "evening", label: "Evening", Icon: Moon, activeBg: "bg-olive" },
];

type PickFreq = "daily" | "weekdays" | "weekends" | "specific_days" | "interval";

const FREQ_OPTIONS: { key: PickFreq; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekdays", label: "Weekdays" },
  { key: "weekends", label: "Weekends" },
  { key: "specific_days", label: "Specific days" },
  { key: "interval", label: "Every N days" },
];

// Mon-first day toggles; values are JS getDay() numbers (0 = Sun).
const DAY_TOGGLES = [
  { v: 1, l: "M" },
  { v: 2, l: "T" },
  { v: 3, l: "W" },
  { v: 4, l: "T" },
  { v: 5, l: "F" },
  { v: 6, l: "S" },
  { v: 0, l: "S" },
];

function initialFreq(h?: EditableHabit): {
  freq: PickFreq;
  days: Set<number>;
  interval: number;
} {
  if (!h) return { freq: "daily", days: new Set(), interval: 3 };
  switch (h.frequency) {
    case "weekly":
      return { freq: "interval", days: new Set(), interval: 7 };
    case "fortnightly":
      return { freq: "interval", days: new Set(), interval: 14 };
    case "monthly":
      return { freq: "interval", days: new Set(), interval: 30 };
    case "interval":
      return { freq: "interval", days: new Set(), interval: h.interval_days ?? 3 };
    case "specific_days":
      return {
        freq: "specific_days",
        days: new Set(parseDays(h.days_of_week)),
        interval: 3,
      };
    case "weekdays":
    case "weekends":
      return { freq: h.frequency, days: new Set(), interval: 3 };
    default:
      return { freq: "daily", days: new Set(), interval: 3 };
  }
}

/** One-screen habit sheet: name, time of day, frequency, optional reason. */
export function HabitFormModal({
  onClose,
  habit,
}: {
  onClose: () => void;
  habit?: EditableHabit;
}) {
  const queryClient = useQueryClient();
  const editing = !!habit;
  const init = initialFreq(habit);

  const [name, setName] = useState(habit?.name ?? "");
  const [timeOfDay, setTimeOfDay] = useState<HabitTime>(
    habit?.time_of_day ?? "morning",
  );
  const [frequency, setFrequency] = useState<PickFreq>(init.freq);
  const [days, setDays] = useState<Set<number>>(init.days);
  const [interval, setIntervalDays] = useState<number>(init.interval);
  const [reason, setReason] = useState(habit?.reason ?? "");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["habits"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const daysCsv =
        frequency === "specific_days"
          ? [...days].sort((a, b) => a - b).join(",")
          : null;
      const intervalDays = frequency === "interval" ? interval : null;
      const trimmedReason = reason.trim();
      if (editing) {
        await updateHabit({
          data: {
            id: habit!.id,
            name: name.trim(),
            timeOfDay,
            frequency,
            daysOfWeek: daysCsv,
            intervalDays,
            reason: trimmedReason,
          },
        });
      } else {
        await createHabit({
          data: {
            name: name.trim(),
            timeOfDay,
            frequency,
            ...(daysCsv ? { daysOfWeek: daysCsv } : {}),
            ...(intervalDays ? { intervalDays } : {}),
            ...(trimmedReason ? { reason: trimmedReason } : {}),
          },
        });
      }
    },
    onSuccess: () => {
      refresh();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteHabit({ data: { id: habit!.id } }),
    onSuccess: () => {
      refresh();
      onClose();
    },
  });

  const toggleDay = (v: number) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  const invalid =
    !name.trim() ||
    (frequency === "specific_days" && days.size === 0) ||
    saveMutation.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    saveMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <form
        onSubmit={submit}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">
            {editing ? "Edit habit" : "New habit"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Name */}
        <label className="mt-6 block font-heading text-sm uppercase text-olive">
          Habit
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning pages"
          maxLength={140}
          className="mt-2 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
        />

        {/* Time of day */}
        <p className="mt-5 font-heading text-sm uppercase text-olive">
          Time of day
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {TIMES.map((t) => {
            const active = timeOfDay === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTimeOfDay(t.key)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-2.5 font-heading text-[11px] uppercase transition-colors",
                  active ? `${t.activeBg} text-white` : "bg-black/5 text-black/50",
                )}
              >
                <t.Icon className="size-4" strokeWidth={2} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Frequency */}
        <p className="mt-5 font-heading text-sm uppercase text-olive">Frequency</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FREQ_OPTIONS.map((f) => {
            const active = frequency === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFrequency(f.key)}
                aria-pressed={active}
                className={cn(
                  "rounded-full px-4 py-2 font-heading text-xs uppercase transition-colors",
                  active ? "bg-olive text-white" : "bg-black/5 text-black/50",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Specific-days picker */}
        {frequency === "specific_days" && (
          <div className="mt-3 flex justify-between gap-1">
            {DAY_TOGGLES.map((d, i) => {
              const active = days.has(d.v);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(d.v)}
                  aria-pressed={active}
                  aria-label={`Toggle day ${d.v}`}
                  className={cn(
                    "grid size-9 place-items-center rounded-full font-heading text-xs uppercase transition-colors",
                    active ? "bg-olive text-white" : "bg-black/5 text-black/50",
                  )}
                >
                  {d.l}
                </button>
              );
            })}
          </div>
        )}

        {/* Every-N-days stepper */}
        {frequency === "interval" && (
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIntervalDays((n) => Math.max(1, n - 1))}
              aria-label="Fewer days"
              className="grid size-10 place-items-center rounded-full bg-black/5 text-black/60 transition-colors hover:bg-black/10"
            >
              <Minus className="size-4" strokeWidth={2.5} />
            </button>
            <span className="font-serif text-sm text-black">
              Every <span className="font-mono">{interval}</span>{" "}
              {interval === 1 ? "day" : "days"}
            </span>
            <button
              type="button"
              onClick={() => setIntervalDays((n) => Math.min(365, n + 1))}
              aria-label="More days"
              className="grid size-10 place-items-center rounded-full bg-black/5 text-black/60 transition-colors hover:bg-black/10"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Reason */}
        <div className="mt-5 flex items-baseline justify-between">
          <p className="font-heading text-sm uppercase text-olive">Why this habit</p>
          <span className="font-serif text-xs italic text-black/40">optional</span>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="What's the reason behind it? (you can skip this)"
          className="mt-2 w-full resize-y rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
        />

        <button
          type="submit"
          disabled={invalid}
          className="mt-6 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
        >
          {saveMutation.isPending
            ? editing
              ? "Saving…"
              : "Adding…"
            : editing
              ? "Save changes"
              : "Add habit"}
        </button>

        {editing && (
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="mt-2 w-full py-2 font-heading text-sm uppercase text-clay-deep transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            Delete habit
          </button>
        )}
      </form>
    </div>
  );
}
