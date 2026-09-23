import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { HabitRow, type HabitTime } from "@/components/home-cards";
import { localToday } from "@/components/goal-ui";
import { habitsQueryOptions } from "@/lib/goal-queries";
import {
  createHabit,
  deleteHabit,
  toggleHabit,
} from "@/lib/habits.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({
    meta: [
      { title: "Habits — Goals of Growth" },
      {
        name: "description",
        content:
          "Your daily habits, morning and afternoon — tick each one off and it resets for tomorrow.",
      },
    ],
  }),
  component: HabitsPage,
});

type Habit = {
  id: string;
  name: string;
  time_of_day: HabitTime;
  done: boolean;
};

function HabitsPage() {
  const today = localToday();
  const { data: habits, isPending } = useQuery(habitsQueryOptions(today));

  return (
    <AppShell title="Habits" backTo="/overview">
      {isPending || !habits ? (
        <p className="mt-10 text-center font-serif text-sm text-muted-foreground">
          Loading…
        </p>
      ) : (
        <HabitsBody habits={habits as Habit[]} today={today} />
      )}
    </AppShell>
  );
}

/**
 * The habits list + add form. Rendered inside <AppShell> so the per-habit
 * timer button can open the shared focus timer (useAppShell).
 */
function HabitsBody({ habits, today }: { habits: Habit[]; today: string }) {
  const queryClient = useQueryClient();
  const { openTimer } = useAppShell();

  const [name, setName] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<HabitTime>("morning");

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["habits"] });

  const addMutation = useMutation({
    mutationFn: (input: { name: string; timeOfDay: HabitTime }) =>
      createHabit({ data: input }),
    onSuccess: refresh,
  });
  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleHabit({ data: { ...input, today } }),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: (input: { id: string }) => deleteHabit({ data: input }),
    onSuccess: refresh,
  });

  const morning = habits.filter((h) => h.time_of_day === "morning");
  const afternoon = habits.filter((h) => h.time_of_day === "afternoon");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value || addMutation.isPending) return;
    addMutation.mutate({ name: value, timeOfDay });
    setName("");
  };

  const renderHabit = (habit: Habit) => (
    <HabitRow
      key={habit.id}
      name={habit.name}
      timeOfDay={habit.time_of_day}
      done={habit.done}
      onTimer={() =>
        openTimer({
          title: habit.name,
          subtitle:
            habit.time_of_day === "morning" ? "Morning habit" : "Afternoon habit",
          onComplete: () => toggleMutation.mutate({ id: habit.id, done: true }),
        })
      }
      onToggle={() => toggleMutation.mutate({ id: habit.id, done: !habit.done })}
    />
  );

  return (
    <div className="mt-4 space-y-8 pb-4">
      {habits.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-heading text-base text-black">No habits yet</p>
          <p className="mt-2 font-serif text-sm text-black/50">
            Add a small daily habit below — it'll reset each morning so you can
            keep the streak going.
          </p>
        </div>
      ) : (
        <>
          {morning.length > 0 && (
            <HabitGroup
              label="Morning"
              icon={<Sun className="size-4 text-gold-deep" strokeWidth={2} />}
            >
              {morning.map(renderHabit)}
            </HabitGroup>
          )}
          {afternoon.length > 0 && (
            <HabitGroup
              label="Afternoon"
              icon={<Moon className="size-4 text-olive" strokeWidth={2} />}
            >
              {afternoon.map(renderHabit)}
            </HabitGroup>
          )}
        </>
      )}

      {/* Add a habit */}
      <form onSubmit={submit} className="space-y-3">
        <p className="font-heading text-sm uppercase text-olive">Add a habit</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTimeOfDay("morning")}
            aria-pressed={timeOfDay === "morning"}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 font-heading text-xs uppercase transition-colors",
              timeOfDay === "morning"
                ? "bg-gold-deep text-white"
                : "bg-black/5 text-black/50",
            )}
          >
            <Sun className="size-4" strokeWidth={2} />
            Morning
          </button>
          <button
            type="button"
            onClick={() => setTimeOfDay("afternoon")}
            aria-pressed={timeOfDay === "afternoon"}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 font-heading text-xs uppercase transition-colors",
              timeOfDay === "afternoon"
                ? "bg-olive text-white"
                : "bg-black/5 text-black/50",
            )}
          >
            <Moon className="size-4" strokeWidth={2} />
            Afternoon
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name your habit…"
            maxLength={140}
            className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="shrink-0 rounded-2xl bg-sage/60 px-6 py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-sage/80 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </form>

      {habits.length > 0 && (
        <DeleteHabitList habits={habits} onDelete={(id) => deleteMutation.mutate({ id })} />
      )}
    </div>
  );
}

function HabitGroup({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="font-heading text-sm uppercase text-olive">{label}</p>
      </div>
      <div className="mt-4 space-y-2">{children}</div>
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
