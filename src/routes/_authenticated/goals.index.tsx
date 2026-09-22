import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Plus, Sparkle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { accentOf, goalProgress, type GoalWithSteps } from "@/components/goal-ui";
import { Button } from "@/components/ui/button";
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
      title="All goals"
      right={
        <button
          onClick={() => setShowNewGoal(true)}
          aria-label="New goal"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-foreground shadow-sm ring-1 ring-border"
        >
          <Plus className="size-5" strokeWidth={2} />
        </button>
      }
    >
      {!showNewGoal && goals.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Tap to see next step
        </p>
      )}

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
            <Button
              type="submit"
              disabled={!newGoalTitle.trim() || createGoalMutation.isPending}
              className="h-10 flex-1 rounded-xl"
            >
              Add goal
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowNewGoal(false);
                setNewGoalTitle("");
              }}
              className="h-10 rounded-xl px-4 text-muted-foreground"
            >
              Cancel
            </Button>
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
        <GoalsGrid goals={goals} />
      )}
    </AppShell>
  );
}

function GoalsGrid({ goals }: { goals: GoalWithSteps[] }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {goals.map((goal) => {
        const progress = goalProgress(goal);
        return (
          <Link
            key={goal.id}
            to="/goals/$goalId"
            params={{ goalId: goal.id }}
            className={`flex flex-col rounded-2xl px-4 py-5 text-primary-foreground shadow-sm ring-1 ring-border ${accentOf(goal).bar}`}
          >
            <Sparkle className="size-7" strokeWidth={1.25} />
            <p className="mt-3 flex-1 text-base font-semibold leading-snug">
              {goal.title}
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-primary-foreground/90 transition-[width] duration-500"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
