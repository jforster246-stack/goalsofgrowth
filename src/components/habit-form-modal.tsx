import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Moon, Sun, Sunset, X } from "lucide-react";
import type { HabitTime } from "@/components/home-cards";
import { createHabit, deleteHabit, updateHabit } from "@/lib/habits.functions";
import { cn } from "@/lib/utils";

type Frequency = "daily" | "weekly" | "fortnightly" | "monthly";

export type EditableHabit = {
  id: string;
  name: string;
  time_of_day: HabitTime;
  frequency: string;
  reason: string | null;
};

const TIMES: { key: HabitTime; label: string; Icon: typeof Sun; activeBg: string }[] = [
  { key: "morning", label: "Morning", Icon: Sun, activeBg: "bg-gold-deep" },
  { key: "afternoon", label: "Afternoon", Icon: Sunset, activeBg: "bg-clay-deep" },
  { key: "evening", label: "Evening", Icon: Moon, activeBg: "bg-olive" },
];

const FREQUENCIES: { key: Frequency; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "fortnightly", label: "Fortnightly" },
  { key: "monthly", label: "Monthly" },
];

/** One-screen habit sheet: name, time of day, frequency, optional reason.
 *  Pass `habit` to edit an existing one (adds Save + Delete). */
export function HabitFormModal({
  onClose,
  habit,
}: {
  onClose: () => void;
  habit?: EditableHabit;
}) {
  const queryClient = useQueryClient();
  const editing = !!habit;

  const [name, setName] = useState(habit?.name ?? "");
  const [timeOfDay, setTimeOfDay] = useState<HabitTime>(
    habit?.time_of_day ?? "morning",
  );
  const [frequency, setFrequency] = useState<Frequency>(
    (habit?.frequency as Frequency) ?? "daily",
  );
  const [reason, setReason] = useState(habit?.reason ?? "");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["habits"] });

  const saveMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      timeOfDay: HabitTime;
      frequency: Frequency;
      reason: string;
    }) => {
      if (editing) await updateHabit({ data: { id: habit!.id, ...input } });
      else await createHabit({ data: input });
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value || saveMutation.isPending) return;
    saveMutation.mutate({ name: value, timeOfDay, frequency, reason: reason.trim() });
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
        <div className="mt-2 grid grid-cols-2 gap-2">
          {FREQUENCIES.map((f) => {
            const active = frequency === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFrequency(f.key)}
                aria-pressed={active}
                className={cn(
                  "rounded-2xl py-2.5 font-heading text-xs uppercase transition-colors",
                  active ? "bg-olive text-white" : "bg-black/5 text-black/50",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

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
          disabled={!name.trim() || saveMutation.isPending}
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
