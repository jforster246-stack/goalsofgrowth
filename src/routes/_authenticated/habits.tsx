import {
  createFileRoute,
  useNavigate,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Moon, Plus, Sun, Sunset } from "lucide-react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { HabitRow, type HabitTime } from "@/components/home-cards";
import { HabitFormModal } from "@/components/habit-form-modal";
import { localToday } from "@/components/goal-ui";
import { habitsQueryOptions } from "@/lib/goal-queries";
import { deleteHabit, toggleHabit } from "@/lib/habits.functions";
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

  const [adding, setAdding] = useState(false);

  // Opened straight from the FAB (?new=true) — show the sheet, then clear the flag.
  const showModal = adding || openNew;
  const closeModal = () => {
    setAdding(false);
    if (openNew) navigate({ to: "/habits", search: { new: false }, replace: true });
  };

  return (
    <AppShell
      title="Habits"
      backTo="/overview"
      right={
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-label="Add a habit"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-olive text-white shadow-sm transition-colors hover:bg-olive/90"
        >
          <Plus className="size-5" strokeWidth={2} />
        </button>
      }
    >
      {isPending || !habits ? (
        <p className="mt-10 text-center font-serif text-sm text-muted-foreground">
          Loading…
        </p>
      ) : (
        <HabitsBody habits={habits as Habit[]} today={today} onAdd={() => setAdding(true)} />
      )}

      {showModal && <HabitFormModal onClose={closeModal} />}
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
}: {
  habits: Habit[];
  today: string;
  onAdd: () => void;
}) {
  const queryClient = useQueryClient();
  const { openTimer } = useAppShell();

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["habits"] });

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleHabit({ data: { ...input, today } }),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: (input: { id: string }) => deleteHabit({ data: input }),
    onSuccess: refresh,
  });

  const renderHabit = (habit: Habit, label: string) => (
    <HabitRow
      key={habit.id}
      name={habit.name}
      timeOfDay={habit.time_of_day}
      frequency={habit.frequency}
      done={habit.done}
      onTimer={() =>
        openTimer({
          title: habit.name,
          subtitle: `${label} habit`,
          onComplete: () => toggleMutation.mutate({ id: habit.id, done: true }),
        })
      }
      onToggle={() => toggleMutation.mutate({ id: habit.id, done: !habit.done })}
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

      <DeleteHabitList
        habits={habits}
        onDelete={(id) => deleteMutation.mutate({ id })}
      />
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

/** A small "manage" area so habits can be removed without cluttering each row. */
function DeleteHabitList({
  habits,
  onDelete,
}: {
  habits: Habit[];
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="font-heading text-xs uppercase text-black/40 transition-colors hover:text-black/70"
      >
        {open ? "Done managing" : "Manage habits"}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm"
            >
              <span className="min-w-0 flex-1 truncate font-serif text-sm text-black">
                {habit.name}
              </span>
              <button
                type="button"
                onClick={() => onDelete(habit.id)}
                aria-label={`Delete ${habit.name}`}
                className="shrink-0 font-heading text-xs uppercase text-clay-deep transition-opacity hover:opacity-70"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
