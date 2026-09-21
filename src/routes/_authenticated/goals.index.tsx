import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { accentOf, goalProgress, type GoalWithSteps } from "@/components/goal-ui";
import { goalsQueryOptions } from "@/lib/goal-queries";
import { claimUnownedGoals, createGoal } from "@/lib/goals.functions";

export const Route = createFileRoute("/_authenticated/goals/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(goalsQueryOptions),
  head: () => ({
    meta: [
      { title: "Your goals — Goals of Growth" },
      {
        name: "description",
        content:
          "Every goal you're growing, with its progress and the very next small step.",
      },
      { property: "og:title", content: "Your goals — Goals of Growth" },
      {
        property: "og:description",
        content: "Every goal you're growing, with its next small step.",
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
  component: GoalsListPage,
});

function GoalsListPage() {
  const queryClient = useQueryClient();
  const { data: goals } = useSuspenseQuery(goalsQueryOptions);

  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["goals"] });

  // Adopt goals created before sign-in existed (no-op after the first account).
  const claimed = useRef(false);
  useEffect(() => {
    if (claimed.current) return;
    claimed.current = true;
    claimUnownedGoals()
      .then((r) => {
        if (r.claimed > 0) invalidate();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createGoalMutation = useMutation({
    mutationFn: (input: { title: string }) => createGoal({ data: input }),
    onSuccess: () => {
      setNewGoalTitle("");
      setShowNewGoal(false);
      invalidate();
    },
  });

  const submitNewGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newGoalTitle.trim();
    if (!title || createGoalMutation.isPending) return;
    createGoalMutation.mutate({ title });
  };

  return (
    <AppShell
      right={
        <button
          onClick={() => setShowNewGoal(true)}
          aria-label="New goal"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      }
    >
      {showNewGoal && (
        <form
          onSubmit={submitNewGoal}
          className="mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border [animation:rise_0.3s_both]"
        >
          <input
            autoFocus
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="What do you want to achieve?"
            maxLength={140}
            className="w-full bg-transparent text-base placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={!newGoalTitle.trim() || createGoalMutation.isPending}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              Add goal
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewGoal(false);
                setNewGoalTitle("");
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 && !showNewGoal ? (
        <div className="mt-5 rounded-2xl bg-card p-8 text-center shadow-sm ring-1 ring-border [animation:rise_0.4s_both]">
          <p className="text-base font-semibold">No goals yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the + button up top to add your first one.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {goals.map((goal, index) => (
            <GoalSummaryCard key={goal.id} goal={goal} index={index} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function GoalSummaryCard({
  goal,
  index,
}: {
  goal: GoalWithSteps;
  index: number;
}) {
  const accent = accentOf(goal);
  const { done, total, pct, complete, nextStep } = goalProgress(goal);

  return (
    <Link
      to="/goals/$goalId"
      params={{ goalId: goal.id }}
      className="block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-colors hover:bg-muted/30"
      style={{ animation: `rise 0.35s ${index * 0.05}s both` }}
    >
      <div className="flex items-center gap-3">
        <span className={`size-2.5 shrink-0 rounded-full ${accent.dot}`} />
        <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">
          {goal.title}
        </h3>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {done}/{total}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${accent.bar} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {complete ? "Completed" : "Next step"}
      </p>
      <p className="mt-0.5 text-sm">
        {complete
          ? "Every step is done — nice work."
          : (nextStep?.title ?? "No steps yet — tap to add one.")}
      </p>
    </Link>
  );
}
