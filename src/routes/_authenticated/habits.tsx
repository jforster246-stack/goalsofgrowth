import {
  createFileRoute,
  useNavigate,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Gem, Moon, Plus, Sun, Sunset } from "lucide-react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { HabitRow, type HabitTime } from "@/components/home-cards";
import { HabitFormModal, type EditableHabit } from "@/components/habit-form-modal";
import { localToday } from "@/components/goal-ui";
import { crystalsQueryOptions, habitsQueryOptions } from "@/lib/goal-queries";
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
  created_at: string;
  done: boolean;
};

const TIMES: {
  key: HabitTime;
  label: string;
  Icon: typeof Sun;
  color: string;
  activeBg: string;
}[] = [
  { key: "morning", label: "Morning", Icon: Sun, color: "text-gold-deep", activeBg: "bg-gold-deep" },
  { key: "afternoon", label: "Afternoon", Icon: Sunset, color: "text-clay-deep", activeBg: "bg-clay-deep" },
  { key: "evening", label: "Evening", Icon: Moon, color: "text-olive", activeBg: "bg-olive" },
];

function HabitsPage() {
  const today = localToday();
  const { new: openNew } = Route.useSearch();
  const navigate = useNavigate();
  const { data: habits, isPending } = useQuery(habitsQueryOptions(today));
  const { data: crystalData } = useQuery(crystalsQueryOptions);

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
      hideSettings
      right={
        <span
          className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm"
          title="Crystals earned from habits"
          aria-label={`${crystalData?.crystals ?? 0} crystals`}
        >
          <Gem className="size-4 text-clay-deep" strokeWidth={2} />
          <span className="font-mono text-sm text-olive">
            {crystalData?.crystals ?? 0}
          </span>
        </span>
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
    queryClient.invalidateQueries({ queryKey: ["crystals"] });
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

  return (
    <div className="mt-4 space-y-8 pb-4">
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
        <time.Icon className={cn("size-4", time.color)} strokeWidth={2} />
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
