import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  queryOptions,
} from "@tanstack/react-query";
import { useState } from "react";
import {
  addStep,
  createGoal,
  deleteGoal,
  deleteStep,
  listGoals,
  toggleStep,
  updateGoal,
  updateStep,
} from "@/lib/goals.functions";

const goalsQueryOptions = queryOptions({
  queryKey: ["goals"],
  queryFn: () => listGoals(),
});

type GoalWithSteps = Awaited<ReturnType<typeof listGoals>>[number];

const ACCENT_STYLES = {
  mint: { dot: "bg-mint", bar: "bg-mint", check: "bg-mint" },
  sea: { dot: "bg-sea", bar: "bg-sea", check: "bg-sea" },
  clay: { dot: "bg-clay", bar: "bg-clay", check: "bg-clay" },
} as const;

type Accent = keyof typeof ACCENT_STYLES;

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(goalsQueryOptions),
  head: () => ({
    meta: [
      { title: "Hatch — a quiet place to finish small things" },
      {
        name: "description",
        content:
          "Hatch is a gentle goal tracker: create goals, break them into small steps, and check them off one calm step at a time.",
      },
      {
        property: "og:title",
        content: "Hatch — a quiet place to finish small things",
      },
      {
        property: "og:description",
        content:
          "Create goals, break them into small steps, and check them off one calm step at a time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{String(error)}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-base text-muted-foreground">Nothing here.</p>
    </div>
  ),
  component: GoalsPage,
});

function GoalsPage() {
  const queryClient = useQueryClient();
  const { data: goals } = useSuspenseQuery(goalsQueryOptions);

  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [stepDrafts, setStepDrafts] = useState<Record<string, string>>({});

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["goals"] });

  const createGoalMutation = useMutation({
    mutationFn: (input: { title: string }) => createGoal({ data: input }),
    onSuccess: () => {
      setNewGoalTitle("");
      setShowNewGoal(false);
      invalidate();
    },
  });
  const updateGoalMutation = useMutation({
    mutationFn: (input: { id: string; title: string }) =>
      updateGoal({ data: input }),
    onSuccess: invalidate,
  });
  const deleteGoalMutation = useMutation({
    mutationFn: (input: { id: string }) => deleteGoal({ data: input }),
    onSuccess: invalidate,
  });
  const addStepMutation = useMutation({
    mutationFn: (input: { goalId: string; title: string }) =>
      addStep({ data: input }),
    onSuccess: invalidate,
  });
  const updateStepMutation = useMutation({
    mutationFn: (input: { id: string; title: string }) =>
      updateStep({ data: input }),
    onSuccess: invalidate,
  });
  const toggleStepMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleStep({ data: input }),
    onSuccess: invalidate,
  });
  const deleteStepMutation = useMutation({
    mutationFn: (input: { id: string }) => deleteStep({ data: input }),
    onSuccess: invalidate,
  });

  const submitNewGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newGoalTitle.trim();
    if (!title || createGoalMutation.isPending) return;
    createGoalMutation.mutate({ title });
  };

  const submitStep = (goalId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    const title = (stepDrafts[goalId] ?? "").trim();
    if (!title || addStepMutation.isPending) return;
    addStepMutation.mutate({ goalId, title });
    setStepDrafts((drafts) => ({ ...drafts, [goalId]: "" }));
  };

  const totalSteps = goals.reduce((sum, g) => sum + g.steps.length, 0);
  const doneSteps = goals.reduce(
    (sum, g) => sum + g.steps.filter((s) => s.done).length,
    0,
  );

  return (
    <div className="min-h-dvh bg-background font-body text-foreground antialiased">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              h
            </div>
            <span className="text-lg font-semibold tracking-tight">hatch</span>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {totalSteps === 0
              ? "Start small"
              : `${doneSteps} of ${totalSteps} steps done`}
          </p>
        </header>

        <div className="mt-8">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
            Your goals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Break big things into small, doable steps.
          </p>
        </div>

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
              Tap the button below to add your first one.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {goals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                draft={stepDrafts[goal.id] ?? ""}
                onDraftChange={(value) =>
                  setStepDrafts((drafts) => ({ ...drafts, [goal.id]: value }))
                }
                onSubmitStep={submitStep(goal.id)}
                onToggle={(id, done) => toggleStepMutation.mutate({ id, done })}
                onEditStep={(id, title) => updateStepMutation.mutate({ id, title })}
                onDeleteStep={(id) => deleteStepMutation.mutate({ id })}
                onEditGoal={(title) => updateGoalMutation.mutate({ id: goal.id, title })}
                onDeleteGoal={() => deleteGoalMutation.mutate({ id: goal.id })}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Fixed bottom add bar — thumb reach */}
        <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pb-5 pt-8">
          <div className="mx-auto max-w-md">
            <button
              onClick={() => setShowNewGoal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
            >
              <span className="text-base leading-none">+</span> New goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  draft,
  onDraftChange,
  onSubmitStep,
  onToggle,
  onEditStep,
  onDeleteStep,
  onEditGoal,
  onDeleteGoal,
  index,
}: {
  goal: GoalWithSteps;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmitStep: (e: React.FormEvent) => void;
  onToggle: (id: string, done: boolean) => void;
  onEditStep: (id: string, title: string) => void;
  onDeleteStep: (id: string) => void;
  onEditGoal: (title: string) => void;
  onDeleteGoal: () => void;
  index: number;
}) {
  const accent =
    ACCENT_STYLES[(goal.accent as Accent) ?? "mint"] ?? ACCENT_STYLES.mint;
  const total = goal.steps.length;
  const done = goal.steps.filter((s) => s.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(goal.title);

  const saveGoalTitle = () => {
    const title = goalDraft.trim();
    if (title && title !== goal.title) onEditGoal(title);
    else setGoalDraft(goal.title);
    setEditingGoal(false);
  };

  return (
    <article
      className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
      style={{ animation: `rise 0.35s ${index * 0.05}s both` }}
    >
      <div className="flex items-center gap-3">
        <span className={`size-2.5 shrink-0 rounded-full ${accent.dot}`} />
        {editingGoal ? (
          <input
            autoFocus
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
            onBlur={saveGoalTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveGoalTitle();
              if (e.key === "Escape") {
                setGoalDraft(goal.title);
                setEditingGoal(false);
              }
            }}
            maxLength={140}
            aria-label={`Edit goal: ${goal.title}`}
            className="min-w-0 flex-1 rounded-lg bg-muted/60 px-2 py-1 text-[15px] font-semibold tracking-tight focus:outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">
            {goal.title}
          </h3>
        )}
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {done}/{total}
        </span>
        <button
          onClick={() => {
            setGoalDraft(goal.title);
            setEditingGoal((v) => !v);
          }}
          aria-label={`Edit goal: ${goal.title}`}
          className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
        <button
          onClick={onDeleteGoal}
          aria-label={`Delete goal: ${goal.title}`}
          className="grid size-7 shrink-0 place-items-center rounded-full text-sm text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          ×
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${accent.bar} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 space-y-1">
        {goal.steps.map((step) => (
          <div
            key={step.id}
            className="group flex items-center gap-3 rounded-xl px-1 py-1.5"
          >
            <button
              onClick={() => onToggle(step.id, !step.done)}
              aria-label={
                step.done
                  ? `Reopen step: ${step.title}`
                  : `Complete step: ${step.title}`
              }
              className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white ring-1 transition-colors ${
                step.done
                  ? `${accent.check} ring-transparent`
                  : "bg-transparent ring-border hover:ring-foreground/40"
              }`}
            >
              {step.done ? "✓" : ""}
            </button>
            <EditableStepTitle
              title={step.title}
              done={step.done}
              onSave={(title) => onEditStep(step.id, title)}
            />
            <button
              onClick={() => onDeleteStep(step.id)}
              aria-label={`Delete step: ${step.title}`}
              className="grid size-7 shrink-0 place-items-center rounded-full text-sm text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}

        <form onSubmit={onSubmitStep} className="flex items-center gap-2 pt-1">
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Add a step…"
            maxLength={240}
            className="min-w-0 flex-1 rounded-xl bg-muted/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="shrink-0 rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 disabled:opacity-40"
          >
            Add
          </button>
        </form>
      </div>
    </article>
  );
}

function EditableStepTitle({
  title,
  done,
  onSave,
}: {
  title: string;
  done: boolean;
  onSave: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(title);
          setEditing(true);
        }}
        aria-label={`Edit step: ${title}`}
        className={`min-w-0 flex-1 text-left text-sm ${
          done
            ? "text-muted-foreground line-through decoration-muted-foreground/40"
            : ""
        }`}
      >
        {title}
      </button>
    );
  }

  const save = () => {
    const next = value.trim();
    if (next && next !== title) onSave(next);
    setEditing(false);
  };

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") setEditing(false);
      }}
      maxLength={240}
      aria-label={`Edit step: ${title}`}
      className="min-w-0 flex-1 rounded-lg bg-muted/60 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}
