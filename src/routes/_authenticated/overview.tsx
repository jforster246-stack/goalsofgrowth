import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus, Sparkle, Timer } from "lucide-react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { accentOf, goalProgress, localToday } from "@/components/goal-ui";
import { goalsQueryOptions, profileQueryOptions } from "@/lib/goal-queries";
import { setGoalOfDay, toggleStep } from "@/lib/goals.functions";

export const Route = createFileRoute("/_authenticated/overview")({
  loader: ({ context }) => context.queryClient.ensureQueryData(goalsQueryOptions),
  head: () => ({
    meta: [
      { title: "Overview — Goals of Growth" },
      {
        name: "description",
        content:
          "Your progress at a glance: goals completed, your goal of the day, and your sign-in streak.",
      },
      { property: "og:title", content: "Overview — Goals of Growth" },
      {
        property: "og:description",
        content: "Goals completed, goal of the day, and your day streak.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{String(error)}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5">
      <p className="text-base text-muted-foreground">Nothing here.</p>
    </div>
  ),
  component: OverviewPage,
});

function OverviewPage() {
  const queryClient = useQueryClient();
  const { data: goals } = useSuspenseQuery(goalsQueryOptions);
  const { data: profile } = useQuery(profileQueryOptions);

  const today = localToday();

  const goalOfDay =
    profile?.goal_of_day_date === today
      ? (goals.find((g) => g.id === profile?.goal_of_day_id) ?? null)
      : null;

  // Up to 3 "next steps" pulled from goals that aren't finished yet,
  // goal-of-day first if it has one.
  const upcoming = [...goals]
    .sort((a, b) =>
      a.id === goalOfDay?.id ? -1 : b.id === goalOfDay?.id ? 1 : 0,
    )
    .map((goal) => ({ goal, next: goalProgress(goal).nextStep }))
    .filter((row) => row.next)
    .slice(0, 3);

  const chooseMutation = useMutation({
    mutationFn: (goalId: string | null) =>
      setGoalOfDay({ data: { goalId, today } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // Marks a step as done, then shows the "nice work" popup.
  const [celebrating, setCelebrating] = useState<{
    goalId: string;
    completedTitle: string;
  } | null>(null);

  const completeStepMutation = useMutation({
    mutationFn: (stepId: string) => toggleStep({ data: { id: stepId, done: true } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  const handleComplete = (goalId: string, stepTitle: string, stepId: string) => {
    completeStepMutation.mutate(stepId, {
      onSuccess: () => setCelebrating({ goalId, completedTitle: stepTitle }),
    });
  };

  // Once the "nice work" popup is showing, look up the freshest data
  // for that goal so we can show what's next.
  const celebratingGoal = celebrating
    ? goals.find((g) => g.id === celebrating.goalId)
    : null;
  const celebratingNext = celebratingGoal
    ? goalProgress(celebratingGoal).nextStep
    : null;

  return (
    <AppShell>
      <div className="relative mx-auto max-w-md px-1 pb-24 pt-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex size-11 flex-col items-center justify-center gap-0.5 rounded-xl bg-card shadow-sm ring-1 ring-border">
            <Sparkle className="size-4 text-focus" strokeWidth={1.5} />
            <span className="text-[9px] font-semibold tracking-wide text-muted-foreground">
              WINS
            </span>
          </div>
          <div className="flex-1 px-2 text-center">
            <h1 className="font-display text-3xl italic leading-tight text-focus">
              Goals of Growth
            </h1>
          </div>
          <div className="size-11 shrink-0" />
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          I am a vibrational match to all that I desire
        </p>

        <div className="mt-5 border-t border-dashed border-border" />

        {/* Next steps */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What next step will you take today?
        </p>

        <div className="mt-3 space-y-2.5">
          {upcoming.length === 0 && (
            <p className="rounded-xl bg-card px-3 py-3 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
              {goals.length === 0
                ? "Add a goal to see your next steps here."
                : "You're all caught up — nice work."}
            </p>
          )}

          {upcoming.map(({ goal, next }) => (
            <NextStepCard
              key={goal.id}
              goal={goal}
              step={next!}
              onComplete={() => handleComplete(goal.id, next!.title, next!.id)}
            />
          ))}
        </div>

        <div className="mt-6 border-t border-dashed border-border" />

        {/* All goals carousel */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          All goals
        </p>

        <div className="-mx-1 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
          {goals.map((goal) => {
            const progress = goalProgress(goal);
            const isGoalOfDay = goal.id === goalOfDay?.id;
            return (
              <div
                key={goal.id}
                className={`w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl shadow-sm ring-1 ring-border ${accentOf(goal).bar}`}
              >
                <div className="flex flex-col items-center px-4 pb-5 pt-4 text-primary-foreground">
                  {isGoalOfDay && (
                    <span className="mb-2 rounded-full bg-black/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Goal of the day
                    </span>
                  )}
                  <Sparkle className="size-8" strokeWidth={1.25} />
                  <p className="mt-3 text-center text-lg font-semibold leading-snug">
                    {goal.title}
                  </p>
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
                    <div
                      className="h-full rounded-full bg-primary-foreground/90 transition-[width] duration-500"
                      style={{ width: `${progress.pct}%` }}
                    />
                  </div>
                  <p className="mt-1 self-end text-[11px] text-primary-foreground/80">
                    {progress.pct}%
                  </p>
                </div>

                <div className="bg-card px-4 py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Next step
                  </p>
                  <p className="mt-1 text-sm">
                    {progress.nextStep?.title ?? "Every step is done — nice work."}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => chooseMutation.mutate(goal.id)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-primary-foreground ${accentOf(goal).bar}`}
                    >
                      Focus on this
                      <Timer className="size-3.5" strokeWidth={2} />
                    </button>
                    <Link
                      to="/goals/$goalId"
                      params={{ goalId: goal.id }}
                      className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"
                      aria-label="Open goal"
                    >
                      <Check className="size-4" strokeWidth={2} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating add button */}
        <Link
          to="/goals"
          className="fixed bottom-24 right-1/2 z-10 flex size-12 translate-x-[calc(50%-1px)] translate-y-0 items-center justify-center rounded-full bg-card text-foreground shadow-lg ring-1 ring-border"
          style={{ marginRight: "-9.5rem" }}
          aria-label="Add a goal"
        >
          <Plus className="size-5" strokeWidth={2} />
        </Link>

        <Link
          to="/goals"
          className="mt-4 block text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          See goals grid
        </Link>
      </div>

      {/* "Nice work" popup after completing a step */}
      {celebrating && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-card p-6 text-center shadow-xl sm:rounded-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nice work
            </p>
            <p className="mt-2 text-lg font-semibold">
              You completed: {celebrating.completedTitle}
            </p>
            {celebratingNext ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Next up for this goal
                </p>
                <p className="mt-1 text-base">{celebratingNext.title}</p>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                That was the last step — this goal is complete!
              </p>
            )}
            <button
              onClick={() => setCelebrating(null)}
              className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function NextStepCard({
  goal,
  step,
  onComplete,
}: {
  goal: ReturnType<typeof goalProgress> extends never ? never : any;
  step: { id: string; title: string };
  onComplete: () => void;
}) {
  const { openFocus } = useAppShell();

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-sm ring-1 ring-border">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${accentOf(goal).dot}`}
      >
        <Sparkle className="size-4 text-primary-foreground" strokeWidth={1.5} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{step.title}</p>
        <p className="truncate text-xs italic text-muted-foreground">
          {goal.title}
        </p>
      </div>

      <button
        onClick={() => openFocus(step.id)}
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${accentOf(goal).dot} text-primary-foreground`}
        aria-label="Start a 20-minute focus timer for this step"
      >
        <Timer className="size-4" strokeWidth={1.5} />
      </button>
      <button
        onClick={onComplete}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
        aria-label="Mark this step complete"
      >
        <Check className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
