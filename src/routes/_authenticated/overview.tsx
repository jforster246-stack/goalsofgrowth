import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, useAppShell, WinsButton } from "@/components/app-shell";
import { goalProgress, localToday } from "@/components/goal-ui";
import { GoalCard, NextStepRow } from "@/components/home-cards";
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
  const navigate = useNavigate();
  const { openFocus } = useAppShell();
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

  const openGoal = (goalId: string) =>
    navigate({ to: "/goals/$goalId", params: { goalId } });

  // Once the "nice work" popup is showing, look up the freshest data
  // for that goal so we can show what's next.
  const celebratingGoal = celebrating
    ? goals.find((g) => g.id === celebrating.goalId)
    : null;
  const celebratingNext = celebratingGoal
    ? goalProgress(celebratingGoal).nextStep
    : null;

  return (
    <AppShell left={<WinsButton />}>
      <div className="relative mx-auto max-w-md pb-24 pt-2">
        <div className="mt-6 border-t border-dashed border-black/15" />

        {/* Next steps */}
        <p className="mt-6 font-heading text-sm uppercase text-olive">
          What next step will you take today?
        </p>

        <div className="mt-6 space-y-2">
          {upcoming.length === 0 && (
            <p className="rounded-2xl bg-white px-3 py-3 font-serif text-sm text-black shadow-sm">
              {goals.length === 0
                ? "Add a goal to see your next steps here."
                : "You're all caught up — nice work."}
            </p>
          )}

          {upcoming.map(({ goal, next }) => (
            <NextStepRow
              key={goal.id}
              goal={goal}
              step={next!}
              onOpen={() => openGoal(goal.id)}
              onStartTimer={() => openFocus(next!.id)}
              onComplete={() => handleComplete(goal.id, next!.title, next!.id)}
            />
          ))}
        </div>

        <div className="mt-7 border-t border-dashed border-black/15" />

        {/* All goals carousel */}
        <p className="mt-6 font-heading text-sm uppercase text-olive">
          All goals
        </p>

        <div className="mt-3 flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-2 pt-6">
          {goals.map((goal) => {
            const next = goalProgress(goal).nextStep;
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                isGoalOfDay={goal.id === goalOfDay?.id}
                onOpen={() => openGoal(goal.id)}
                onFocus={() => chooseMutation.mutate(goal.id)}
                onComplete={() =>
                  next && handleComplete(goal.id, next.title, next.id)
                }
                onAdd={() => openGoal(goal.id)}
              />
            );
          })}
        </div>

        <Link
          to="/goals"
          className="fixed bottom-28 right-5 z-10 flex size-[52px] items-center justify-center rounded-full bg-white text-olive shadow-lg drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]"
          aria-label="Add a goal"
        >
          <Plus className="size-6" strokeWidth={2} />
        </Link>

        <Link
          to="/goals"
          className="mt-6 block text-center font-heading text-[13.9px] uppercase text-black/50"
        >
          See goals grid
        </Link>
      </div>

      {/* "Nice work" popup after completing a step */}
      {celebrating && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-card p-6 text-center shadow-xl sm:rounded-3xl">
            <p className="font-heading text-sm uppercase text-olive">
              Nice work
            </p>
            <p className="mt-2 font-serif text-lg text-black">
              You completed: {celebrating.completedTitle}
            </p>
            {celebratingNext ? (
              <>
                <p className="mt-4 font-heading text-sm uppercase text-olive">
                  Next up for this goal
                </p>
                <p className="mt-1 font-serif text-base text-black">
                  {celebratingNext.title}
                </p>
              </>
            ) : (
              <p className="mt-4 font-serif text-sm text-muted-foreground">
                That was the last step — this goal is complete!
              </p>
            )}
            <button
              onClick={() => setCelebrating(null)}
              className="mt-6 w-full rounded-2xl bg-olive py-3 font-heading text-sm uppercase text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
