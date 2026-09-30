import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import { useState } from "react";
import { listHabitMonth, toggleHabit } from "@/lib/habits.functions";
import { localToday } from "@/components/goal-ui";
import { Loading } from "@/components/loading";
import { cn } from "@/lib/utils";

const TIME_CELL: Record<string, string> = {
  morning: "bg-gold-deep",
  afternoon: "bg-clay-deep",
  evening: "bg-olive",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthKey(offset: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Monthly habit tracker: one row per habit, one cell per day of the month.
 * Filled cells are tinted by the habit's time of day; today is ringed.
 */
export function HabitMonthGrid() {
  const [offset, setOffset] = useState(0);
  const month = monthKey(offset);
  const fetchMonth = useServerFn(listHabitMonth);
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["habit-month", month],
    queryFn: () => fetchMonth({ data: { month } }),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; date: string; done: boolean }) =>
      toggleHabit({ data: { id: v.id, done: v.done, today: v.date } }),
    onSuccess: () => {
      for (const key of [
        ["habit-month"],
        ["habits"],
        ["habit-streaks"],
        ["habit-history"],
        ["habit-stamp-bonus"],
        ["stamp-balance"],
      ]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });

  const today = localToday();
  const [year, mon] = month.split("-").map(Number) as [number, number];
  const label = `${MONTH_NAMES[mon - 1]} ${year}`;
  const isCurrentMonth = month === today.slice(0, 7);
  const todayDay = isCurrentMonth ? Number(today.slice(8, 10)) : null;

  return (
    <section>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Grid3X3 className="size-4 text-olive" strokeWidth={2} />
          <p className="font-heading text-sm uppercase text-olive">
            Monthly tracker
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setOffset((o) => o - 1)}
            className="rounded-full bg-white p-1.5 shadow-sm transition-colors hover:bg-white/70"
          >
            <ChevronLeft className="size-4 text-olive" strokeWidth={2} />
          </button>
          <span className="min-w-28 text-center font-heading text-xs uppercase text-black/60">
            {label}
          </span>
          <button
            type="button"
            aria-label="Next month"
            disabled={offset >= 0}
            onClick={() => setOffset((o) => o + 1)}
            className="rounded-full bg-white p-1.5 shadow-sm transition-colors hover:bg-white/70 disabled:opacity-40"
          >
            <ChevronRight className="size-4 text-olive" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
        {isPending || !data ? (
          <Loading />
        ) : data.habits.length === 0 ? (
          <p className="py-4 text-center font-serif text-sm text-black/40">
            No habits to track yet.
          </p>
        ) : (
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white" />
                {Array.from({ length: data.days }, (_, i) => i + 1).map(
                  (day) => (
                    <th
                      key={day}
                      className={cn(
                        "min-w-5 text-center font-mono text-[10px] font-normal",
                        day === todayDay ? "text-focus" : "text-black/35",
                      )}
                    >
                      {day}
                    </th>
                  ),
                )}
                <th className="pl-1 text-right font-mono text-[10px] font-normal text-black/35">
                  Σ
                </th>
              </tr>
            </thead>
            <tbody>
              {data.habits.map((habit) => {
                const done = new Set(habit.days);
                return (
                  <tr key={habit.id}>
                    <td className="sticky left-0 max-w-28 truncate bg-white pr-2 font-serif text-xs text-black/70">
                      {habit.icon ? `${habit.icon} ` : ""}
                      {habit.name}
                    </td>
                    {Array.from({ length: data.days }, (_, i) => i + 1).map(
                      (day) => {
                        const isFuture =
                          isCurrentMonth && todayDay !== null && day > todayDay;
                        const date = `${month}-${String(day).padStart(2, "0")}`;
                        return (
                          <td key={day}>
                            <button
                              type="button"
                              disabled={isFuture || toggle.isPending}
                              onClick={() =>
                                toggle.mutate({
                                  id: habit.id,
                                  date,
                                  done: !done.has(day),
                                })
                              }
                              aria-label={`${habit.name}, ${date}${done.has(day) ? " — done" : ""}`}
                              className="grid place-items-center p-0.5 enabled:cursor-pointer disabled:cursor-default"
                            >
                              <span
                                className={cn(
                                  "size-4 rounded-full transition-colors",
                                  done.has(day)
                                    ? (TIME_CELL[habit.time_of_day] ?? "bg-olive")
                                    : "bg-black/8",
                                  day === todayDay &&
                                    "ring-1 ring-focus ring-offset-1",
                                  isFuture && "opacity-40",
                                )}
                              />
                            </button>
                          </td>
                        );
                      },
                    )}
                    <td className="pl-1 text-right font-mono text-[10px] text-black/50">
                      {habit.days.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-2 font-serif text-xs text-black/40">
        Tap any past day to tick it off or undo it. Dots are coloured by time of
        day — gold morning, clay afternoon, green evening.
      </p>
    </section>
  );
}
