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
} from "@/lib/goals.functions";
import goalHero from "@/assets/goals-hero.jpg";

const goalsQueryOptions = queryOptions({
  queryKey: ["goals"],
  queryFn: () => listGoals(),
});

type GoalWithSteps = Awaited<ReturnType<typeof listGoals>>[number];

const ACCENT_STYLES = {
  mint: { avatar: "bg-mint text-ink", bar: "bg-mint", check: "bg-mint" },
  sea: { avatar: "bg-sea text-ink/80", bar: "bg-sea", check: "bg-sea" },
  clay: {
    avatar: "bg-clay text-cream",
    bar: "bg-clay",
    check: "bg-clay",
  },
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
      { property: "og:title", content: "Hatch — a quiet place to finish small things" },
      {
        property: "og:description",
        content:
          "Create goals, break them into small steps, and check them off one calm step at a time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          Something went quiet
        </h1>
        <p className="mt-2 text-sm text-soft">{String(error)}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <p className="font-display text-lg text-ink">Nothing here.</p>
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
  const deleteGoalMutation = useMutation({
    mutationFn: (input: { id: string }) => deleteGoal({ data: input }),
    onSuccess: invalidate,
  });
  const addStepMutation = useMutation({
    mutationFn: (input: { goalId: string; title: string }) =>
      addStep({ data: input }),
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

  return (
    <div className="min-h-screen bg-cream font-body text-ink antialiased">
      <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-2xl bg-clay font-display text-lg font-bold text-cream">
              h
            </div>
            <span className="font-display text-[22px] font-bold tracking-tight">
              hatch
            </span>
          </div>
          <p className="hidden text-sm text-soft sm:block">
            {goals.length === 0
              ? "A calm place to begin"
              : `${goals.length} ${goals.length === 1 ? "goal" : "goals"} in motion`}
          </p>
        </header>

        <section className="mt-8 grid items-stretch gap-5 md:grid-cols-12">
          <div className="flex min-h-[240px] flex-col justify-between rounded-[28px] bg-mint/40 p-6 [animation:rise_0.5s_both]">
            <p className="font-display text-[15px] font-medium italic text-ink/70">
              A calm note
            </p>
            <div>
              <h1 className="font-display text-[40px] font-bold leading-[1.05] tracking-tight text-balance">
                Slow is steady.
              </h1>
              <p className="mt-2 max-w-[34ch] text-sm text-pretty text-ink/70">
                One small step today keeps the whole thing moving.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center rounded-[28px] bg-sand/60 p-6 [animation:rise_0.55s_both]">
            <img
              src={goalHero}
              alt="Illustration of a person calmly watering a small plant on a windowsill"
              width={1024}
              height={640}
              className="aspect-[16/10] w-full rounded-2xl object-cover outline-1 -outline-offset-1 outline-black/5"
            />
          </div>
        </section>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-display text-[19px] font-bold tracking-tight">
            Your goals
          </h2>
          <button
            onClick={() => setShowNewGoal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-clay px-4 py-2.5 text-sm font-semibold text-cream ring-1 ring-black/5 transition-colors hover:bg-clay/90"
          >
            <span className="text-base leading-none">+</span> New goal
          </button>
        </div>

        {showNewGoal && (
          <form
            onSubmit={submitNewGoal}
            className="mt-4 flex items-center gap-3 rounded-[24px] bg-white/70 p-5 ring-1 ring-black/5 [animation:rise_0.4s_both]"
          >
            <input
              autoFocus
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              maxLength={140}
              className="flex-1 bg-transparent font-display text-lg placeholder:text-soft/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newGoalTitle.trim() || createGoalMutation.isPending}
              className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-cream ring-1 ring-black/5 hover:bg-clay/90 disabled:opacity-40"
            >
              Add goal
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewGoal(false);
                setNewGoalTitle("");
              }}
              className="text-xs text-soft hover:text-ink"
            >
              Cancel
            </button>
          </form>
        )}

        {goals.length === 0 && !showNewGoal ? (
          <div className="mt-4 rounded-[24px] bg-white/70 p-10 text-center ring-1 ring-black/5 [animation:rise_0.5s_both]">
            <p className="font-display text-lg font-semibold text-ink">
              No goals yet
            </p>
            <p className="mt-1 text-sm text-soft">
              Start with one small thing you'd like to finish.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
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
                onDeleteStep={(id) => deleteStepMutation.mutate({ id })}
                onDeleteGoal={() => deleteGoalMutation.mutate({ id: goal.id })}
                index={index}
              />
            ))}
          </div>
        )}

        <footer className="mt-10 flex items-center justify-between border-t border-ink/10 pt-6 text-xs text-soft">
          <span>hatch — a quiet place to finish small things</span>
          <span>
            {totalSteps === 0
              ? "made slowly"
              : `${totalSteps} ${totalSteps === 1 ? "step" : "steps"} so far`}
          </span>
        </footer>
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
  onDeleteStep,
  onDeleteGoal,
  index,
}: {
  goal: GoalWithSteps;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmitStep: (e: React.FormEvent) => void;
  onToggle: (id: string, done: boolean) => void;
  onDeleteStep: (id: string) => void;
  onDeleteGoal: () => void;
  index: number;
}) {
  const accent = ACCENT_STYLES[(goal.accent as Accent) ?? "mint"] ?? ACCENT_STYLES.mint;
  const total = goal.steps.length;
  const done = goal.steps.filter((s) => s.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <article
      className="rounded-[24px] bg-white/70 p-5 ring-1 ring-black/5"
      style={{ animation: `rise 0.5s ${index * 0.05}s both` }}
    >
      <div className="flex items-start gap-4">
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-2xl font-display font-bold ${accent.avatar}`}
        >
          {(goal.title.trim()[0] ?? "?").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate font-display text-[17px] font-semibold tracking-tight">
              {goal.title}
            </h3>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-semibold text-soft">
                {done} / {total}
              </span>
              <button
                onClick={onDeleteGoal}
                aria-label={`Delete goal: ${goal.title}`}
                className="text-sm leading-none text-soft/50 transition-colors hover:text-clay"
              >
                ×
              </button>
            </div>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className={`h-full rounded-full ${accent.bar} transition-[width] duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="ml-1 mt-4 space-y-2.5 pl-15">
        {goal.steps.map((step) => (
          <div key={step.id} className="group flex items-center gap-3">
            <button
              onClick={() => onToggle(step.id, !step.done)}
              aria-label={step.done ? `Reopen step: ${step.title}` : `Complete step: ${step.title}`}
              className={`grid size-5 shrink-0 place-items-center rounded-md text-xs font-bold text-cream ring-1 transition-colors ${
                step.done
                  ? `${accent.check} ring-transparent`
                  : "bg-cream ring-ink/20 hover:ring-ink/40"
              }`}
            >
              {step.done ? "✓" : ""}
            </button>
            <span
              className={`flex-1 text-sm ${
                step.done ? "text-ink/50 line-through decoration-ink/30" : ""
              }`}
            >
              {step.title}
            </span>
            <button
              onClick={() => onDeleteStep(step.id)}
              aria-label={`Delete step: ${step.title}`}
              className="text-xs text-soft opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}

        <form onSubmit={onSubmitStep} className="flex items-center gap-3">
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Add a step…"
            maxLength={240}
            className="flex-1 bg-transparent py-1 text-sm placeholder:text-soft/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() || addStepPendingSafe(onSubmitStep)}
            className="text-xs font-semibold text-clay hover:text-clay/80 disabled:opacity-40"
          >
            Add
          </button>
        </form>
      </div>
    </article>
  );
}

function addStepPendingSafe(_fn: unknown) {
  return false;
}
