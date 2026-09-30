import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import { useMemo, useState } from "react";
import { listHabitMonth, listHabitRange, toggleHabit } from "@/lib/habits.functions";
import { localToday } from "@/components/goal-ui";
import { Motif } from "@/components/motif-icons";
import { Loading } from "@/components/loading";
import { cn } from "@/lib/utils";

const TIME_CELL: Record<string, string> = {
  morning: "bg-gold-deep",
  afternoon: "bg-clay-deep",
  evening: "bg-olive",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type Toggle = UseMutationResult<
  unknown,
  unknown,
  { id: string; date: string; done: boolean }
>;

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function monthKey(offset: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function weekDates(offset: number): string[] {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
}

/** The habit's icon + name for the left column. */
function HabitLabel({
  icon,
  name,
  full = false,
}: {
  icon: string | null;
  name: string;
  full?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-1.5", !full && "max-w-32")}>
      {icon ? <Motif id={icon} className="size-4 shrink-0 text-olive" /> : null}
      <span
        className={cn("font-serif text-xs text-black/70", !full && "truncate")}
      >
        {name}
      </span>
    </span>
  );
}

/** A tinted, tappable completion cell — squarish with an 8pt radius. */
function DayDot({
  done,
  time,
  isToday,
  big = false,
  disabled,
  onClick,
  label,
}: {
  done: boolean;
  time: string;
  isToday: boolean;
  big?: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="grid place-items-center p-0.5 enabled:cursor-pointer disabled:cursor-default"
    >
      <span
        className={cn(
          "transition-colors",
          big ? "size-6 rounded-lg sm:size-7" : "size-4 rounded-[5px]",
          done ? (TIME_CELL[time] ?? "bg-olive") : "bg-black/[0.07]",
          // In the week view today is marked by the column frame, so the small
          // month dots keep the ring; the big week dots don't.
          !big && isToday && "ring-1 ring-focus ring-offset-1",
          disabled && !done && "opacity-40",
        )}
      />
    </button>
  );
}

/**
 * Habit tracker with a Month or Week view. One row per habit, one dot per day;
 * tap any past day to tick it off or undo it.
 */
export function HabitMonthGrid() {
  const [view, setView] = useState<"month" | "week">("week");
  const [monthOffset, setMonthOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: (v: { id: string; date: string; done: boolean }) =>
      toggleHabit({ data: { id: v.id, done: v.done, today: v.date } }),
    onSuccess: () => {
      for (const key of [
        ["habit-month"],
        ["habit-range"],
        ["habits"],
        ["habit-streaks"],
        ["habit-history"],
        ["habit-stamp-bonus"],
        ["stamp-balance"],
      ]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  }) as Toggle;

  return (
    <section>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Grid3X3 className="size-4 text-olive" strokeWidth={2} />
          <p className="font-heading text-sm uppercase text-olive">Tracker</p>
        </div>
        <div className="flex rounded-full bg-black/5 p-0.5 font-heading text-[11px] uppercase">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                view === v ? "bg-white text-olive shadow-sm" : "text-black/45",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <MonthView offset={monthOffset} setOffset={setMonthOffset} toggle={toggle} />
      ) : (
        <WeekView offset={weekOffset} setOffset={setWeekOffset} toggle={toggle} />
      )}

      <p className="mt-2 font-serif text-xs text-black/40">
        Tap any past day to tick it off or undo it — today's column is framed.
        Cells are coloured by time of day: gold morning, clay afternoon, green
        evening.
      </p>
    </section>
  );
}

function NavBar({
  label,
  onPrev,
  onNext,
  nextDisabled,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}) {
  return (
    <div className="mt-3 flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label="Previous"
        onClick={onPrev}
        className="rounded-full bg-white p-1.5 shadow-sm transition-colors hover:bg-white/70"
      >
        <ChevronLeft className="size-4 text-olive" strokeWidth={2} />
      </button>
      <span className="min-w-36 text-center font-heading text-xs uppercase text-black/60">
        {label}
      </span>
      <button
        type="button"
        aria-label="Next"
        disabled={nextDisabled}
        onClick={onNext}
        className="rounded-full bg-white p-1.5 shadow-sm transition-colors hover:bg-white/70 disabled:opacity-40"
      >
        <ChevronRight className="size-4 text-olive" strokeWidth={2} />
      </button>
    </div>
  );
}

function MonthView({
  offset,
  setOffset,
  toggle,
}: {
  offset: number;
  setOffset: (fn: (o: number) => number) => void;
  toggle: Toggle;
}) {
  const month = monthKey(offset);
  const fetchMonth = useServerFn(listHabitMonth);
  const { data, isPending } = useQuery({
    queryKey: ["habit-month", month],
    queryFn: () => fetchMonth({ data: { month } }),
  });

  const today = localToday();
  const [year, mon] = month.split("-").map(Number) as [number, number];
  const label = `${MONTH_NAMES[mon - 1]} ${year}`;
  const isCurrentMonth = month === today.slice(0, 7);
  const todayDay = isCurrentMonth ? Number(today.slice(8, 10)) : null;

  return (
    <>
      <NavBar
        label={label}
        onPrev={() => setOffset((o) => o - 1)}
        onNext={() => setOffset((o) => o + 1)}
        nextDisabled={offset >= 0}
      />
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
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
                {Array.from({ length: data.days }, (_, i) => i + 1).map((day) => (
                  <th
                    key={day}
                    className={cn(
                      "min-w-5 text-center font-mono text-[10px] font-normal",
                      day === todayDay ? "text-focus" : "text-black/35",
                    )}
                  >
                    {day}
                  </th>
                ))}
                <th className="pl-1 text-right font-mono text-[10px] font-normal text-black/35">
                  Σ
                </th>
              </tr>
            </thead>
            <tbody>
              {[...data.habits].sort((a, b) => b.days.length - a.days.length).map((habit) => {
                const done = new Set(habit.days);
                return (
                  <tr key={habit.id}>
                    <td className="sticky left-0 bg-white pr-2">
                      <HabitLabel icon={habit.icon} name={habit.name} />
                    </td>
                    {Array.from({ length: data.days }, (_, i) => i + 1).map((day) => {
                      const isFuture =
                        isCurrentMonth && todayDay !== null && day > todayDay;
                      const date = `${month}-${pad(day)}`;
                      return (
                        <td key={day}>
                          <DayDot
                            done={done.has(day)}
                            time={habit.time_of_day}
                            isToday={day === todayDay}
                            disabled={isFuture || toggle.isPending}
                            onClick={() =>
                              toggle.mutate({ id: habit.id, date, done: !done.has(day) })
                            }
                            label={`${habit.name}, ${date}`}
                          />
                        </td>
                      );
                    })}
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
    </>
  );
}

function WeekView({
  offset,
  setOffset,
  toggle,
}: {
  offset: number;
  setOffset: (fn: (o: number) => number) => void;
  toggle: Toggle;
}) {
  const dates = useMemo(() => weekDates(offset), [offset]);
  const start = dates[0]!;
  const end = dates[6]!;
  const today = localToday();

  const fetchRange = useServerFn(listHabitRange);
  const { data, isPending } = useQuery({
    queryKey: ["habit-range", start, end],
    queryFn: () => fetchRange({ data: { start, end } }),
  });

  const sm = Number(start.slice(5, 7));
  const em = Number(end.slice(5, 7));
  const label =
    sm === em
      ? `${Number(start.slice(8, 10))}–${Number(end.slice(8, 10))} ${MONTH_ABBR[sm - 1]}`
      : `${Number(start.slice(8, 10))} ${MONTH_ABBR[sm - 1]} – ${Number(end.slice(8, 10))} ${MONTH_ABBR[em - 1]}`;

  const todayIdx = dates.indexOf(today); // -1 when viewing another week
  const sorted = data
    ? [...data.habits].sort((a, b) => b.days.length - a.days.length)
    : [];

  return (
    <>
      <NavBar
        label={label}
        onPrev={() => setOffset((o) => o - 1)}
        onNext={() => setOffset((o) => o + 1)}
        nextDisabled={offset >= 0}
      />
      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        {isPending || !data ? (
          <Loading />
        ) : data.habits.length === 0 ? (
          <p className="py-4 text-center font-serif text-sm text-black/40">
            No habits to track yet.
          </p>
        ) : (
          <div className="relative">
            {/* Today's column, framed from the header through the last row.
                Positioned as a fraction of the (responsive) day strip so it
                stays aligned at any width. */}
            {todayIdx >= 0 && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-[196px] sm:w-[266px]"
              >
                <div
                  className="absolute -top-1.5 -bottom-1.5 rounded-full border border-black/70"
                  style={{
                    left: `${(todayIdx / 7) * 100}%`,
                    width: `${100 / 7}%`,
                  }}
                />
              </div>
            )}

            {/* Header: "Habit" + the weekday initials for this week. */}
            <div className="flex items-center border-b border-black/10 pb-3">
              <div className="min-w-0 flex-1 font-serif text-sm text-black/70">
                Habit
              </div>
              <div className="grid w-[196px] shrink-0 grid-cols-7 sm:w-[266px]">
                {WEEK_LABELS.map((letter, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-center font-serif text-xs",
                      dates[i] === today ? "text-black/80" : "text-black/45",
                    )}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            </div>

            {/* One row per habit, separated by a hairline. */}
            {sorted.map((habit, ri) => {
              const done = new Set(habit.days);
              return (
                <div
                  key={habit.id}
                  className={cn(
                    "flex items-center py-3 sm:py-3.5",
                    ri < sorted.length - 1 && "border-b border-black/10",
                  )}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <HabitLabel icon={habit.icon} name={habit.name} full />
                  </div>
                  <div className="grid w-[196px] shrink-0 grid-cols-7 sm:w-[266px]">
                    {dates.map((date) => {
                      const isFuture = date > today;
                      return (
                        <div key={date} className="flex justify-center">
                          <DayDot
                            done={done.has(date)}
                            time={habit.time_of_day}
                            isToday={date === today}
                            big
                            disabled={isFuture || toggle.isPending}
                            onClick={() =>
                              toggle.mutate({
                                id: habit.id,
                                date,
                                done: !done.has(date),
                              })
                            }
                            label={`${habit.name}, ${date}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
