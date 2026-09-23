import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { claimUnownedGoals, setGoalArchived, toggleStep } from "@/lib/goals.functions";
import { createWin } from "@/lib/wins.functions";

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

type Goal = GoalWithSteps & { archived_at?: string | null };

function GoalsListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: goals } = useSuspenseQuery(goalsQueryOptions);

  const [showCompleted, setShowCompleted] = useState(false);

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

  const active = (goals as Goal[]).filter((g) => !g.archived_at);
  const archived = (goals as Goal[]).filter((g) => g.archived_at);

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
        <div className="mt-4 pb-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {active.map((goal) => (
              <GoalCardItem key={goal.id} goal={goal} />
            ))}
          </div>
          {active.length === 0 && (
            <p className="rounded-2xl bg-white/60 px-4 py-4 text-center font-serif text-sm text-black/40">
              All your goals are complete — nice work.
            </p>
          )}

          {archived.length > 0 && (
            <div className="pt-6">
              <button
                type="button"
                onClick={() => setShowCompleted((v) => !v)}
                className="flex w-full items-center justify-between font-heading text-xs uppercase text-black/40 transition-colors hover:text-black/70"
              >
                <span>Completed goals ({archived.length})</span>
                <span>{showCompleted ? "Hide" : "Show"}</span>
              </button>
              {showCompleted && (
                <div className="mt-3 space-y-2">
                  {archived.map((goal) => (
                    <ArchivedGoalRow key={goal.id} goal={goal} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

/** A goal rendered as the full card. When complete it offers add-to-wins + archive. */
function GoalCardItem({ goal }: { goal: Goal }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openFocus, celebrate } = useAppShell();
  const [promptGoal, setPromptGoal] = useState<CompletedGoal | null>(null);

  const next = goalProgress(goal).nextStep;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["goal"] });
  };

  const completeMutation = useMutation({
    mutationFn: (stepId: string) => toggleStep({ data: { id: stepId, done: true } }),
    onSuccess: refresh,
  });
  // "Add to wins log" both records the win and files the goal away under
  // "Completed goals" at the bottom of the list.
  const winMutation = useMutation({
    mutationFn: async () => {
      await createWin({ data: { title: goal.title, kind: "achievement" } });
      await setGoalArchived({ data: { id: goal.id, archived: true } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wins"] });
      refresh();
    },
  });
  const archiveMutation = useMutation({
    mutationFn: () => setGoalArchived({ data: { id: goal.id, archived: true } }),
    onSuccess: refresh,
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
        onAddWin={() => winMutation.mutate()}
        onArchive={() => archiveMutation.mutate()}
      />
      <GoalCompletePrompt goal={promptGoal} onClose={() => setPromptGoal(null)} />
    </>
  );
}

/** A completed/archived goal, collapsed into the toggle. Can be brought back. */
function ArchivedGoalRow({ goal }: { goal: Goal }) {
  const queryClient = useQueryClient();
  const unarchive = useMutation({
    mutationFn: () => setGoalArchived({ data: { id: goal.id, archived: false } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <Link
        to="/goals/$goalId"
        params={{ goalId: goal.id }}
        className="min-w-0 flex-1 truncate font-serif text-sm text-black/60 line-through decoration-black/20"
      >
        {goal.title}
      </Link>
      <button
        type="button"
        onClick={() => unarchive.mutate()}
        className="shrink-0 font-heading text-[11px] uppercase text-olive transition-opacity hover:opacity-70"
      >
        Restore
      </button>
    </div>
  );
}
