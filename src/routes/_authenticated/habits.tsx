import { createFileRoute, useNavigate, type SearchSchemaInput } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { HabitRow, type HabitTime } from "@/components/home-cards";
import { Motif, TIME_MOTIF } from "@/components/motif-icons";
import { HabitFormModal } from "@/components/habit-form-modal";
import { HabitDetailModal } from "@/components/habit-detail-modal";
import { HabitTally } from "@/components/habit-tally";
import { localToday } from "@/components/goal-ui";
import { habitsQueryOptions } from "@/lib/goal-queries";
import { toggleHabit } from "@/lib/habits.functions";
import { frequencyLabel } from "@/lib/habit-schedule";
import { Loading } from "@/components/loading";
import { HabitTracker } from "@/components/habit-month-grid";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/habits")({
  validateSearch: (search: { new?: boolean } & SearchSchemaInput) => ({
    new: search["new"] === true || (search["new"] as unknown) === "true",
  }),
  head: () => ({
    meta: [
      { title: "Habits — Goals of Growth" },
      {
        name: "description",
        content: "Your daily habits by time of day — tick each one off and it resets for tomorrow.",
      },
    ],
  }),
  component: HabitsPage,
});

type Habit = {
  id: string;
  name: string;
  time_of_day: HabitTime;
  frequency: string;
  days_of_week: string | null;
  interval_days: number | null;
  reason: string | null;
  icon: string | null;
  created_at: string;
  done: boolean;
};

const TIMES: {
  key: HabitTime;
  label: string;
  color: string;
}[] = [
  { key: "morning", label: "Morning", color: "text-gold-deep" },
  { key: "afternoon", label: "Afternoon", color: "text-clay-deep" },
  { key: "evening", label: "Evening", color: "text-olive" },
];

function HabitsPage() {
  const today = localToday();
  const { new: openNew } = Route.useSearch();
  const navigate = useNavigate();
  const { data: habits, isPending } = useQuery(habitsQueryOptions(today));

  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Habit | null>(null);

  // Opened straight from the FAB (?new=true) — show the sheet, then clear the flag.
  const showAdd = adding || openNew;
  const closeModal = () => {
    setAdding(false);
    if (openNew) navigate({ to: "/habits", search: { new: false }, replace: true });
  };

  return (
    <AppShell
      title="Habits"
      titleLeft
      hideSettings
      subtitle={habits && habits.length > 0 ? <HabitTally compact /> : undefined}
    >
      {isPending || !habits ? (
        <Loading />
      ) : (
        <HabitsBody
          habits={habits as Habit[]}
          today={today}
          onAdd={() => setAdding(true)}
          onOpen={setSelected}
        />
      )}

      {selected && <HabitDetailModal habit={selected} onClose={() => setSelected(null)} />}
      {showAdd && <HabitFormModal onClose={closeModal} />}
    </AppShell>
  );
}

/**
 * The habits list + add form. Rendered inside <AppShell> so the per-habit
 * timer button can open the shared focus timer (useAppShell).
 */
function HabitsBody({
  habits,
  today,
  onAdd,
  onOpen,
}: {
  habits: Habit[];
  today: string;
  onAdd: () => void;
  onOpen: (habit: Habit) => void;
}) {
  const queryClient = useQueryClient();
  const { openTimer, celebrate } = useAppShell();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries({ queryKey: ["habit-streaks"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stamp-bonus"] });
    queryClient.invalidateQueries({ queryKey: ["habit-history"] });
    queryClient.invalidateQueries({ queryKey: ["stamp-balance"] });
  };

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleHabit({ data: { ...input, today } }),
    onSuccess: refresh,
  });

  const complete = (habit: Habit) => {
    celebrate();
    toggleMutation.mutate({ id: habit.id, done: true });
  };

  const renderHabit = (habit: Habit, label: string) => (
    <HabitRow
      key={habit.id}
      name={habit.name}
      timeOfDay={habit.time_of_day}
      frequencyLabel={frequencyLabel(habit)}
      icon={habit.icon}
      done={habit.done}
      onOpen={() => onOpen(habit)}
      onTimer={() =>
        openTimer({
          title: habit.name,
          subtitle: `${label} habit`,
          onComplete: () => complete(habit),
        })
      }
      onToggle={() =>
        habit.done ? toggleMutation.mutate({ id: habit.id, done: false }) : complete(habit)
      }
    />
  );

  if (habits.length === 0) {
    return (
      <div className="mt-4 rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="font-heading text-base text-black">No habits yet</p>
        <p className="mt-2 font-serif text-sm text-black/50">
          Add a small habit to start building momentum.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-olive px-5 py-2.5 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
        >
          <Plus className="size-4" strokeWidth={2} />
          Add a habit
        </button>
      </div>
    );
  }

  // Which part of the day it is now, matching the Home page.
  const hour = new Date().getHours();
  const now: HabitTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <div className="mt-5 space-y-8 pb-4">
      <div className="grid gap-8 md:grid-cols-2 md:items-start lg:grid-cols-3">
        {TIMES.map((time) => {
          const inBucket = habits.filter((h) => h.time_of_day === time.key);
          if (inBucket.length === 0) return null;
          return (
            <HabitSection
              key={time.key}
              time={time}
              isNow={time.key === now}
              habits={inBucket}
              renderHabit={(h) => renderHabit(h, time.label)}
            />
          );
        })}
      </div>

      <HabitTracker />
    </div>
  );
}

/** One time-of-day group: header with a done/total count, the active habits,
 *  and a reveal for the ones already ticked off today (so a mistap is undoable). */
function HabitSection({
  time,
  isNow,
  habits,
  renderHabit,
}: {
  time: (typeof TIMES)[number];
  isNow: boolean;
  habits: Habit[];
  renderHabit: (habit: Habit) => React.ReactNode;
}) {
  const [showDone, setShowDone] = useState(false);
  const active = habits.filter((h) => !h.done);
  const completed = habits.filter((h) => h.done);

  return (
    <section>
      <div className="flex items-center gap-1.5">
        <Motif id={TIME_MOTIF[time.key]} className={cn("size-4", time.color)} />
        <p className="font-heading text-sm uppercase text-olive">{time.label}</p>
        {isNow && (
          <span className="rounded-full bg-olive px-2 py-0.5 font-heading text-[9px] uppercase tracking-wide text-white">
            Now
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-black/[0.07]">
            <span
              className="block h-full rounded-full bg-olive transition-[width] duration-500"
              style={{ width: `${habits.length ? (completed.length / habits.length) * 100 : 0}%` }}
            />
          </span>
          <span className="font-mono text-xs text-olive/60">
            {completed.length}/{habits.length}
          </span>
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {active.map(renderHabit)}
        {active.length === 0 && (
          <p className="rounded-2xl bg-white/60 py-4 text-center font-serif text-sm text-black/40">
            All done for now ✨
          </p>
        )}
      </div>

      {completed.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="font-heading text-[11px] uppercase text-black/40 transition-colors hover:text-black/70"
          >
            {showDone ? "Hide done" : `Done today (${completed.length})`}
          </button>
          {showDone && <div className="mt-2 space-y-2">{completed.map(renderHabit)}</div>}
        </div>
      )}
    </section>
  );
}
