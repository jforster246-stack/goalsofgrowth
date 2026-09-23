import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AccentStar, accentOf, DIAMOND_PATH, goalProgress } from "@/components/goal-ui";
import {
  GoalCompletePrompt,
  FOCUS_ADD_STEP_KEY,
  type CompletedGoal,
} from "@/components/goal-complete-prompt";
import { goalQueryOptions } from "@/lib/goal-queries";
import {
  addStep,
  deleteGoal,
  deleteStep,
  toggleStep,
  updateGoalDetails,
  updateStep,
} from "@/lib/goals.functions";

export const Route = createFileRoute("/_authenticated/goals/$goalId")({
  head: () => ({
    meta: [
      { title: "Goal — Goals of Growth" },
      {
        name: "description",
        content:
          "Your goal in detail: why it matters, what it looks like when it's done, and every small step.",
      },
      { property: "og:title", content: "Goal — Goals of Growth" },
      {
        property: "og:description",
        content: "Why it matters, how it will feel, and every small step.",
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
      <p className="text-base text-muted-foreground">Goal not found.</p>
    </div>
  ),
  component: GoalDetailPage,
});

function GoalDetailPage() {
  const { goalId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: goal, isPending } = useQuery(goalQueryOptions(goalId));

  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [vision, setVision] = useState("");
  const [stepDraft, setStepDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [promptGoal, setPromptGoal] = useState<CompletedGoal | null>(null);
  const stepInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!goal) return;
    setTitle(goal.title);
    setWhy(goal.why ?? "");
    setVision(goal.vision ?? "");
  }, [goal?.id, goal?.title, goal?.why, goal?.vision]);

  // If we were sent here from the "Not yet — add more steps" button
  // (on this page or the goals list page), focus the add-step box.
  useEffect(() => {
    const flagged = sessionStorage.getItem(FOCUS_ADD_STEP_KEY);
    if (flagged && flagged === goalId) {
      sessionStorage.removeItem(FOCUS_ADD_STEP_KEY);
      setTimeout(() => stepInputRef.current?.focus(), 100);
    }
  }, [goalId]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["goal", goalId] });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  };

  const saveMutation = useMutation({
    mutationFn: (input: { title: string; why: string; vision: string }) =>
      updateGoalDetails({ data: { id: goalId, ...input } }),
    onSuccess: () => {
      refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });
  const addStepMutation = useMutation({
    mutationFn: (input: { title: string }) =>
      addStep({ data: { goalId, title: input.title } }),
    onSuccess: refresh,
  });
  const updateStepMutation = useMutation({
    mutationFn: (input: { id: string; title: string }) =>
      updateStep({ data: input }),
    onSuccess: refresh,
  });
  const toggleStepMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleStep({ data: input }),
    onSuccess: refresh,
  });
  const deleteStepMutation = useMutation({
    mutationFn: (input: { id: string }) => deleteStep({ data: input }),
    onSuccess: refresh,
  });
  const deleteGoalMutation = useMutation({
    mutationFn: () => deleteGoal({ data: { id: goalId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      navigate({ to: "/overview", replace: true });
    },
  });

  if (isPending || !goal) {
    return (
      <AppShell backTo="/overview" title="Goal">
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      </AppShell>
    );
  }

  const accent = accentOf(goal);
  const { done, total, pct } = goalProgress(goal);

  const dirty =
    title.trim() !== goal.title ||
    why !== (goal.why ?? "") ||
    vision !== (goal.vision ?? "");

  const submitStep = (e: React.FormEvent) => {
    e.preventDefault();
    const value = stepDraft.trim();
    if (!value || addStepMutation.isPending) return;
    addStepMutation.mutate({ title: value });
    setStepDraft("");
  };

  const handleToggleStep = (stepId: string, currentlyDone: boolean) => {
    // If this step is being marked done AND it's the last one left, this
    // completes the whole goal — show the shared "have you completed this?" prompt.
    const willCompleteGoal =
      !currentlyDone &&
      goal.steps.every((s) => s.id === stepId || s.done);

    toggleStepMutation.mutate(
      { id: stepId, done: !currentlyDone },
      {
        onSuccess: () => {
          if (willCompleteGoal) setPromptGoal({ id: goal.id, title: goal.title });
        },
      },
    );
  };

  return (
    <AppShell backTo="/overview" title="Goal">
      <div className="mt-5 space-y-3">
        <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Goal
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            aria-label="Goal title"
            className="mt-2 w-full rounded-xl bg-muted/60 px-3 py-2.5 text-[15px] font-semibold tracking-tight focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <div className="mt-4 flex items-center gap-3">
            <AccentStar fillClass={accent.check} />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${accent.bar} transition-[width] duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {done}/{total}
            </span>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Small steps
          </p>

          <div className="mt-3 space-y-1">
            {goal.steps.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">
                No steps yet — add the smallest first one below.
              </p>
            )}
            {goal.steps.map((step) => (
              <div
                key={step.id}
                className="group flex items-center gap-3 rounded-xl px-1 py-1.5"
              >
                <button
                  onClick={() => handleToggleStep(step.id, step.done)}
                  aria-label={
                    step.done
                      ? `Reopen step: ${step.title}`
                      : `Complete step: ${step.title}`
                  }
                  className="grid size-6 shrink-0 place-items-center transition-transform active:scale-90"
                >
                  <svg
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    className={`size-5 transition-colors duration-200 ${
                      step.done
                        ? accent.check
                        : "fill-none stroke-muted-foreground/50 hover:stroke-foreground"
                    }`}
                  >
                    <path d={DIAMOND_PATH} />
                  </svg>
                </button>
                <EditableStepTitle
                  title={step.title}
                  done={step.done}
                  onSave={(next) =>
                    updateStepMutation.mutate({ id: step.id, title: next })
                  }
                />
                <button
                  onClick={() => deleteStepMutation.mutate({ id: step.id })}
                  aria-label={`Delete step: ${step.title}`}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-sm text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}

            <form onSubmit={submitStep} className="flex items-center gap-2 pt-2">
              <input
                ref={stepInputRef}
                value={stepDraft}
                onChange={(e) => setStepDraft(e.target.value)}
                placeholder="Add a step…"
                maxLength={240}
                className="min-w-0 flex-1 rounded-xl bg-muted/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={!stepDraft.trim()}
                className="shrink-0 rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <label
            htmlFor="goal-why"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Why I'm doing this
          </label>
          <textarea
            id="goal-why"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="What's pulling you towards this?"
            className="mt-2 w-full resize-y rounded-xl bg-muted/60 px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <label
            htmlFor="goal-vision"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            What it looks and feels like when it's done
          </label>
          <textarea
            id="goal-vision"
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Picture the finished version of this. Where are you? How does it feel?"
            className="mt-2 w-full resize-y rounded-xl bg-muted/60 px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </section>

        <button
          onClick={() =>
            saveMutation.mutate({ title: title.trim() || goal.title, why, vision })
          }
          disabled={!dirty || saveMutation.isPending}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {saved ? "Saved" : saveMutation.isPending ? "Saving…" : "Save changes"}
        </button>

        <button
          onClick={() => deleteGoalMutation.mutate()}
          className="w-full rounded-2xl py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Delete this goal
        </button>
      </div>

      <GoalCompletePrompt goal={promptGoal} onClose={() => setPromptGoal(null)} />
    </AppShell>
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
