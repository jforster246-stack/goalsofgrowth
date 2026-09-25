import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Flame, Pencil, Timer, Trash2, X } from "lucide-react";
import { Motif, TIME_MOTIF } from "@/components/motif-icons";
import { StampMark } from "@/components/stamp-mark";
import { HabitFormModal, type EditableHabit } from "@/components/habit-form-modal";
import { useAppShell } from "@/components/app-shell";
import { localToday } from "@/components/goal-ui";
import type { HabitTime } from "@/components/home-cards";
import { toggleHabit, deleteHabit } from "@/lib/habits.functions";
import {
  habitHistoryQueryOptions,
  habitStreaksQueryOptions,
} from "@/lib/goal-queries";
import { frequencyLabel } from "@/lib/habit-schedule";
import { cn } from "@/lib/utils";

export type HabitFull = {
  id: string;
  name: string;
  time_of_day: HabitTime;
  frequency: string;
  days_of_week: string | null;
  interval_days: number | null;
  reason: string | null;
  icon: string | null;
  done: boolean;
};

const TIME_LABEL: Record<HabitTime, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};
const TIME_COLOR: Record<HabitTime, string> = {
  morning: "text-gold-deep",
  afternoon: "text-clay-deep",
  evening: "text-olive",
};

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function localYmd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** This week's seven dates (Monday-first) as local YYYY-MM-DD, plus today. */
function currentWeek() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localYmd(d);
  });
  return { days, todayYmd: localYmd(today) };
}

/**
 * The popup that opens when you tap a habit anywhere: its icon, cadence and
 * time of day, its streak and ticked week (in stamp shapes), and quick timer /
 * tick actions. Tapping edit slides the full edit sheet up over the top.
 */
export function HabitDetailModal({
  habit,
  onClose,
}: {
  habit: HabitFull;
  onClose: () => void;
}) {
  const today = localToday();
  const queryClient = useQueryClient();
  const { openTimer, celebrate } = useAppShell();
  const [done, setDone] = useState(habit.done);
  const [editing, setEditing] = useState(false);

  const { days, todayYmd } = useMemo(currentWeek, []);
  const { data: history } = useQuery(habitHistoryQueryOptions(habit.id));
  const { data: streaks } = useQuery(habitStreaksQueryOptions(today));

  const doneDays = useMemo(() => new Set(history ?? []), [history]);
  const weekCount = days.filter((d) => doneDays.has(d)).length;
  const streak = streaks?.find((s) => s.id === habit.id)?.streak ?? 0;

  // How many consecutive days end on `ymd` (0 if not completed). Every third
  // day in a run fills its stamp; the others just show an outline.
  const runLenTo = (ymd: string): number => {
    if (!doneDays.has(ymd)) return 0;
    let n = 0;
    const cursor = new Date(`${ymd}T00:00:00Z`);
    while (doneDays.has(cursor.toISOString().slice(0, 10))) {
      n += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return n;
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries({ queryKey: ["habit-streaks"] });
    queryClient.invalidateQueries({ queryKey: ["habit-history"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stamp-bonus"] });
  };

  const toggle = useMutation({
    mutationFn: (next: boolean) =>
      toggleHabit({ data: { id: habit.id, done: next, today } }),
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: () => deleteHabit({ data: { id: habit.id } }),
    onSuccess: () => {
      invalidate();
      onClose();
    },
  });

  const setTick = (next: boolean) => {
    setDone(next);
    if (next) celebrate();
    toggle.mutate(next);
  };

  const editable: EditableHabit = {
    id: habit.id,
    name: habit.name,
    time_of_day: habit.time_of_day,
    frequency: habit.frequency,
    days_of_week: habit.days_of_week,
    interval_days: habit.interval_days,
    reason: habit.reason,
    icon: habit.icon,
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
        >
          {/* Top bar: close, then edit + delete */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit habit"
                className="grid size-9 place-items-center rounded-full bg-black/5 text-olive transition-colors hover:bg-black/10"
              >
                <Pencil className="size-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => del.mutate()}
                disabled={del.isPending}
                aria-label="Delete habit"
                className="grid size-9 place-items-center rounded-full bg-black/5 text-clay-deep transition-colors hover:bg-black/10 disabled:opacity-40"
              >
                <Trash2 className="size-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Icon + name + cadence */}
          <div className="mt-1 flex flex-col items-center text-center">
            <Motif
              id={habit.icon || TIME_MOTIF[habit.time_of_day]}
              className={cn("size-14", TIME_COLOR[habit.time_of_day])}
            />
            <h2 className="mt-3 font-display text-2xl leading-tight text-black">
              {habit.name}
            </h2>
            <p className="mt-1 font-heading text-xs uppercase tracking-wide text-olive">
              {TIME_LABEL[habit.time_of_day]} · {frequencyLabel(habit)}
            </p>
            {habit.reason?.trim() && (
              <p className="mt-2 max-w-xs font-serif text-sm italic leading-relaxed text-black/50">
                {habit.reason}
              </p>
            )}
          </div>

          {/* Streak */}
          <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-black/5 py-4">
            <StampMark className="size-12 text-clay-deep">
              {streak > 0 ? (
                <span className="font-heading text-base leading-none text-white">
                  {streak}
                </span>
              ) : (
                <Flame className="size-5 text-white" strokeWidth={2} />
              )}
            </StampMark>
            <div className="text-left">
              <p className="font-heading text-lg leading-none text-black">
                {streak} day{streak === 1 ? "" : "s"}
              </p>
              <p className="mt-0.5 font-serif text-xs text-black/50">
                {streak > 0 ? "in a row" : "Tick it off to start a streak"}
              </p>
            </div>
          </div>

          {/* This week */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="font-heading text-sm uppercase text-olive">This week</p>
              <span className="font-serif text-xs text-black/50">
                {weekCount} {weekCount === 1 ? "day" : "days"} done
              </span>
            </div>
            <div className="mt-3 flex justify-between gap-1">
              {days.map((d, i) => {
                const ticked = doneDays.has(d);
                const filled = ticked && runLenTo(d) % 3 === 0;
                const isToday = d === todayYmd;
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "font-heading text-[10px] uppercase",
                        isToday ? "text-olive" : "text-black/40",
                      )}
                    >
                      {WEEK_LABELS[i]}
                    </span>
                    {filled ? (
                      // Every third day in a row — the stamp fills in.
                      <StampMark className="size-9 text-olive">
                        <Check className="size-4 text-white" strokeWidth={3} />
                      </StampMark>
                    ) : ticked ? (
                      // Ticked, but not a full three yet — just the outline.
                      <StampMark outline className="size-9 text-olive">
                        <Check className="size-4 text-olive" strokeWidth={3} />
                      </StampMark>
                    ) : (
                      <StampMark
                        className={cn(
                          "size-9",
                          isToday ? "text-olive/25" : "text-black/10",
                        )}
                      >
                        <span
                          className={cn(
                            "font-mono text-[11px]",
                            isToday ? "text-olive" : "text-black/40",
                          )}
                        >
                          {Number(d.slice(8, 10))}
                        </span>
                      </StampMark>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timer + tick */}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() =>
                openTimer({
                  title: habit.name,
                  subtitle: `${TIME_LABEL[habit.time_of_day]} habit`,
                  onComplete: () => setTick(true),
                })
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-black/5 py-3.5 font-heading text-sm uppercase text-olive transition-colors hover:bg-black/10"
            >
              <Timer className="size-5" strokeWidth={1.75} />
              Timer
            </button>
            <button
              type="button"
              onClick={() => setTick(!done)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors",
                done ? "bg-olive hover:bg-olive/90" : "bg-sage hover:bg-sage/80",
              )}
            >
              <Check className="size-5" strokeWidth={2.5} />
              {done ? "Done today" : "Tick off"}
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <HabitFormModal habit={editable} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
