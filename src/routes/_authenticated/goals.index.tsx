import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Plus } from "lucide-react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { GoalCard } from "@/components/home-cards";
import {
  GoalCompletePrompt,
  type CompletedGoal,
} from "@/components/goal-complete-prompt";
import { goalProgress, type GoalWithSteps } from "@/components/goal-ui";
import { Stamp } from "@/components/stamp";
import { mergeStamps } from "@/lib/stamp-view";
import {
  goalsQueryOptions,
  habitStampBonusQueryOptions,
  stampsQueryOptions,
} from "@/lib/goal-queries";
import {
  claimUnownedGoals,
  reorderGoals,
  setGoalArchived,
  toggleStep,
} from "@/lib/goals.functions";
import { createWin } from "@/lib/wins.functions";
import { createStamp } from "@/lib/stamps.functions";

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
  const { data: stamps } = useQuery(stampsQueryOptions);
  const { data: habitBonus } = useQuery(habitStampBonusQueryOptions);
  const stampCount = mergeStamps(stamps, goals).length + (habitBonus ?? 0);

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

  const active = useMemo(
    () => (goals as Goal[]).filter((g) => !g.archived_at),
    [goals],
  );
  const archived = (goals as Goal[]).filter((g) => g.archived_at);

  // Local, drag-reorderable copy of the active goals.
  const [order, setOrder] = useState<Goal[]>(active);
  useEffect(() => setOrder(active), [active]);

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderGoals({ data: { orderedIds } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
  const handleReorder = (next: Goal[]) => {
    setOrder(next);
    reorderMutation.mutate(next.map((g) => g.id));
  };

  return (
    <AppShell
      title="All goals"
      titleLeft
      hideSettings
      right={
        <Link
          to="/wins"
          aria-label={`${stampCount} stamps earned`}
          title="Stamps earned"
          className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"
        >
          <Stamp icon={null} accent="sea" className="size-5" />
          <span className="font-mono text-sm text-olive">{stampCount}</span>
        </Link>
      }
    >
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
          <Reorder.Group
            as="div"
            values={order}
            onReorder={handleReorder}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {order.map((goal) => (
              <DraggableGoalCard key={goal.id} goal={goal} />
            ))}
          </Reorder.Group>
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

/** Wraps a goal card so it can be dragged to reorder via its grip handle. */
function DraggableGoalCard({ goal }: { goal: Goal }) {
  const controls = useDragControls();
  return (
    <Reorder.Item as="div" value={goal} dragListener={false} dragControls={controls}>
      <GoalCardItem
        goal={goal}
        dragHandle={
          <button
            type="button"
            aria-label="Drag to reorder"
            onPointerDown={(e) => controls.start(e)}
            className="absolute left-2 top-2 z-20 grid size-8 cursor-grab touch-none place-items-center rounded-full bg-white/25 text-white backdrop-blur transition-colors hover:bg-white/40 active:cursor-grabbing"
          >
            <GripVertical className="size-4" strokeWidth={2} />
          </button>
        }
      />
    </Reorder.Item>
  );
}

/** A goal rendered as the full card. When complete it offers add-to-wins + archive. */
function GoalCardItem({ goal, dragHandle }: { goal: Goal; dragHandle?: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openFocus, celebrate } = useAppShell();
  const [promptGoal, setPromptGoal] = useState<CompletedGoal | null>(null);

  const next = goalProgress(goal).nextStep;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["goal"] });
  };

  // Move the goal into (or out of) the "Completed goals" section right away,
  // before the server round-trip. Returns the previous list so we can roll
  // back if the save fails.
  const optimisticArchive = async (archived: boolean) => {
    await queryClient.cancelQueries({ queryKey: ["goals"] });
    const prev = queryClient.getQueryData<Goal[]>(["goals"]);
    queryClient.setQueryData<Goal[]>(["goals"], (old) =>
      (old ?? []).map((g) =>
        g.id === goal.id
          ? { ...g, archived_at: archived ? new Date().toISOString() : null }
          : g,
      ),
    );
    return { prev };
  };
  const rollback = (ctx: { prev: Goal[] | undefined } | undefined) => {
    if (ctx?.prev) queryClient.setQueryData(["goals"], ctx.prev);
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
      await createStamp({
        data: {
          goalId: goal.id,
          title: goal.title,
          ...(goal.icon ? { icon: goal.icon } : {}),
          accent: goal.accent,
        },
      });
      await setGoalArchived({ data: { id: goal.id, archived: true } });
    },
    onMutate: () => optimisticArchive(true),
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wins"] });
      queryClient.invalidateQueries({ queryKey: ["stamps"] });
      refresh();
    },
  });
  const archiveMutation = useMutation({
    mutationFn: () => setGoalArchived({ data: { id: goal.id, archived: true } }),
    onMutate: () => optimisticArchive(true),
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: refresh,
  });

  const open = () =>
    navigate({ to: "/goals/$goalId", params: { goalId: goal.id } });

  return (
    <>
      <GoalCard
        goal={goal}
        dragHandle={dragHandle}
        onOpen={open}
        onAdd={open}
        onFocus={() => next && openFocus(next.id)}
        onComplete={() => {
          if (!next) return;
          celebrate();
          // This tick finishes the goal when every other step is already done.
          if (goal.steps.every((s) => s.done || s.id === next.id)) {
            setPromptGoal({ id: goal.id, title: goal.title, icon: goal.icon, accent: goal.accent });
          }
          completeMutation.mutate(next.id);
        }}
        onAddWin={() => winMutation.mutate()}
        onArchive={() => archiveMutation.mutate()}
      />
      {(winMutation.isError || archiveMutation.isError) && (
        <p className="mt-2 rounded-xl bg-clay/10 px-3 py-2 font-mono text-[11px] leading-snug text-clay-deep">
          Couldn't save:{" "}
          {String(
            (winMutation.error ?? archiveMutation.error) as unknown,
          ).replace(/^Error:\s*/, "")}
        </p>
      )}
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
