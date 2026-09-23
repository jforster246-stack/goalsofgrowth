import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { GoalCard } from "@/components/home-cards";
import {
  GoalCompletePrompt,
  type CompletedGoal,
} from "@/components/goal-complete-prompt";
import { goalProgress, type GoalWithSteps } from "@/components/goal-ui";
import { goalsQueryOptions } from "@/lib/goal-queries";
import { claimUnownedGoals, toggleStep } from "@/lib/goals.functions";

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
  component: GoalsListPage,
});

function GoalsListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: goals } = useSuspenseQuery(goalsQueryOptions);

  // Adopt goals created before sign-in existed (no-op after the first account).
  const claimed = useRef(false);
  useEffect(() => {
    if (claimed.current) return;
    claimed.current = true;
    claimUnownedGoals()
      .then((r) => {
        if (r.claimed > 0)
          queryClient.invalidateQueries({ queryKey: ["goals"] });
      })
      .catch(() => {});
  }, [queryClient]);

  return (
    <AppShell title="All goals" hideSettings>
      {goals.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-heading text-base text-black">No goals yet</p>
          <p className="mt-2 font-serif text-sm text-black/50">
            Tap the + button to create your first goal.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/goals/new" })}
            className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-olive px-5 py-2.5 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
          >
            <Plus className="size-4" strokeWidth={2} />
            New goal
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4 pb-4">
          {goals.map((goal) => (
            <GoalCardItem key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

/** A goal rendered as the full card, wired to focus/complete its next step. */
function GoalCardItem({ goal }: { goal: GoalWithSteps }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openFocus, celebrate } = useAppShell();
  const [promptGoal, setPromptGoal] = useState<CompletedGoal | null>(null);

  const next = goalProgress(goal).nextStep;

  const completeMutation = useMutation({
    mutationFn: (stepId: string) =>
      toggleStep({ data: { id: stepId, done: true } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  const open = () =>
    navigate({ to: "/goals/$goalId", params: { goalId: goal.id } });

  return (
    <>
      <GoalCard
        goal={goal}
        onOpen={open}
        onAdd={open}
        onFocus={() => next && openFocus(next.id)}
        onComplete={() => {
          if (!next) return;
          celebrate();
          // This tick finishes the goal when every other step is already done.
          if (goal.steps.every((s) => s.done || s.id === next.id)) {
            setPromptGoal({ id: goal.id, title: goal.title });
          }
          completeMutation.mutate(next.id);
        }}
      />
      <GoalCompletePrompt
        goal={promptGoal}
        onClose={() => setPromptGoal(null)}
      />
    </>
  );
}
