import {
  createFileRoute,
  Link,
  useNavigate,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { HabitRow, type HabitTime } from "@/components/home-cards";
import { Motif, TIME_MOTIF } from "@/components/motif-icons";
import { HabitFormModal, type EditableHabit } from "@/components/habit-form-modal";
import { Stamp } from "@/components/stamp";
import { goalProgress, localToday } from "@/components/goal-ui";
import { goalsQueryOptions, habitsQueryOptions } from "@/lib/goal-queries";
import { toggleHabit } from "@/lib/habits.functions";
import { frequencyLabel } from "@/lib/habit-schedule";
import { Loading } from "@/components/loading";
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
        content:
          "Your daily habits by time of day — tick each one off and it resets for tomorrow.",
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
  const { data: goals } = useQuery(goalsQueryOptions);
  const stampCount = (goals ?? []).filter((g) => goalProgress(g).complete).length;

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EditableHabit | null>(null);

  // Opened straight from the FAB (?new=true) — show the sheet, then clear the flag.
  const showAdd = adding || openNew;
  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    if (openNew) navigate({ to: "/habits", search: { new: false }, replace: true });
  };

  return (
    <AppShell
      title="Habits"
      titleLeft
      hideSettings
      right={
        <Link
          to="/wins"
          aria-label={`${stampCount} stamps earned`}
          title="Stamps earned"
          className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"
        >
          <Stamp icon={null} accent="sea" className="size-5" />
          <span className="font-mono text-sm text-olive">{stampCount}</span>
        </Link>
      }
    >
      {isPending || !habits ? (
        <Loading />
      ) : (
        <HabitsBody
          habits={habits as Habit[]}
          today={today}
          onAdd={() => setAdding(true)}
          onEdit={setEditing}
        />
      )}

      {editing ? (
        <HabitFormModal habit={editing} onClose={closeModal} />
      ) : (
        showAdd && <HabitFormModal onClose={closeModal} />
      )}
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
  onEdit,
}: {
  habits: Habit[];
  today: string;
  onAdd: () => void;
  onEdit: (habit: EditableHabit) => void;
}) {
  const queryClient = useQueryClient();
  const { openTimer, celebrate } = useAppShell();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries({ queryKey: ["habit-streaks"] });
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
      onOpen={() =>
        onEdit({
          id: habit.id,
          name: habit.name,
          time_of_day: habit.time_of_day,
          frequency: habit.frequency,
          days_of_week: habit.days_of_week,
          interval_days: habit.interval_days,
          reason: habit.reason,
          icon: habit.icon,
        })
      }
      onTimer={() =>
        openTimer({
          title: habit.name,
          subtitle: `${label} habit`,
          onComplete: () => complete(habit),
        })
      }
      onToggle={() =>
        habit.done
          ? toggleMutation.mutate({ id: habit.id, done: false })
          : complete(habit)
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

  // "Special" habits: anything on a custom cadence (every N days, certain days,
  // weekdays/weekends). They still appear in their time-of-day section above;
  // this is just a place to see them all at a glance.
  const timeLabel = (t: HabitTime) =>
    TIMES.find((x) => x.key === t)?.label ?? "";
  const scheduled = habits.filter((h) => frequencyLabel(h) !== "Daily");

  return (
    <div className="mt-4 space-y-8 pb-4">
      <div className="grid gap-8 md:grid-cols-2 md:items-start lg:grid-cols-3">
        {TIMES.map((time) => {
          const inBucket = habits.filter((h) => h.time_of_day === time.key);
          if (inBucket.length === 0) return null;
          return (
            <HabitSection
              key={time.key}
              time={time}
              habits={inBucket}
              renderHabit={(h) => renderHabit(h, time.label)}
            />
          );
        })}
      </div>

      {scheduled.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5">
            <CalendarClock className="size-4 text-olive" strokeWidth={2} />
            <p className="font-heading text-sm uppercase text-olive">Scheduled</p>
          </div>
          <p className="mt-1 font-serif text-xs text-black/40">
            Habits on a custom cadence — they also show under their time of day
            above.
          </p>
          <div className="mt-4 space-y-2">
            {scheduled.map((h) => renderHabit(h, timeLabel(h.time_of_day)))}
          </div>
        </section>
      )}
    </div>
  );
}

/** One time-of-day group: header with a done/total count, the active habits,
 *  and a reveal for the ones already ticked off today (so a mistap is undoable). */
function HabitSection({
  time,
  habits,
  renderHabit,
}: {
  time: (typeof TIMES)[number];
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
        <span className="ml-1 font-mono text-xs text-olive/50">
          {completed.length}/{habits.length}
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
          {showDone && (
            <div className="mt-2 space-y-2">{completed.map(renderHabit)}</div>
          )}
        </div>
      )}
    </section>
  );
}
