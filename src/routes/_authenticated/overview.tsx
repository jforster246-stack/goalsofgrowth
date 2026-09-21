import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { accentOf, goalProgress, localToday } from "@/components/goal-ui";
import { goalsQueryOptions, profileQueryOptions } from "@/lib/goal-queries";
import { setGoalOfDay } from "@/lib/goals.functions";

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
  const [picking, setPicking] = useState(false);

  const today = localToday();
  const completed = goals.filter((g) => goalProgress(g).complete).length;
  const streak = profile?.streak_count ?? 0;

  const goalOfDay =
    profile?.goal_of_day_date === today
      ? (goals.find((g) => g.id === profile?.goal_of_day_id) ?? null)
      : null;

  const chooseMutation = useMutation({
    mutationFn: (goalId: string | null) =>
      setGoalOfDay({ data: { goalId, today } }),
    onSuccess: () => {
      setPicking(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return (
    <AppShell>
      <div className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 text-center shadow-sm ring-1 ring-border [animation:rise_0.3s_both]">
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-focus">
              {completed}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {completed === 1 ? "goal completed" : "goals completed"}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              of {goals.length} {goals.length === 1 ? "goal" : "goals"}
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4 text-center shadow-sm ring-1 ring-border [animation:rise_0.35s_both]">
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-focus">
              {streak}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {streak === 1 ? "day streak" : "day streak"}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              best {profile?.longest_streak ?? 0}
            </p>
          </div>
        </div>

        <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border [animation:rise_0.4s_both]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Goal of the day
            </p>
            {goals.length > 0 && (
              <button
                onClick={() => setPicking((v) => !v)}
                className="text-xs font-semibold text-primary underline underline-offset-4"
              >
                {picking ? "Close" : goalOfDay ? "Change" : "Choose"}
              </button>
            )}
          </div>

          {picking ? (
            <div className="mt-3 space-y-2">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => chooseMutation.mutate(goal.id)}
                  className="flex w-full items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${accentOf(goal).dot}`}
                  />
                  <span className="min-w-0 flex-1 truncate">{goal.title}</span>
                </button>
              ))}
              {goalOfDay && (
                <button
                  onClick={() => chooseMutation.mutate(null)}
                  className="w-full rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Clear goal of the day
                </button>
              )}
            </div>
          ) : goalOfDay ? (
            <Link
              to="/goals/$goalId"
              params={{ goalId: goalOfDay.id }}
              className="mt-3 block"
            >
              <p className="text-lg font-semibold leading-snug tracking-tight">
                {goalOfDay.title}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${accentOf(goalOfDay).bar} transition-[width] duration-500`}
                  style={{ width: `${goalProgress(goalOfDay).pct}%` }}
                />
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Next step
              </p>
              <p className="mt-0.5 text-sm">
                {goalProgress(goalOfDay).nextStep?.title ??
                  "Every step is done — nice work."}
              </p>
            </Link>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {goals.length === 0
                ? "Add a goal first, then pick one to focus on today."
                : "Pick one goal to give your attention to today."}
            </p>
          )}
        </section>

        <Link
          to="/goals"
          className="block rounded-2xl bg-card p-4 text-center text-sm font-semibold shadow-sm ring-1 ring-border transition-colors hover:bg-muted/40 [animation:rise_0.45s_both]"
        >
          See all {goals.length} {goals.length === 1 ? "goal" : "goals"}
        </Link>
      </div>
    </AppShell>
  );
}
