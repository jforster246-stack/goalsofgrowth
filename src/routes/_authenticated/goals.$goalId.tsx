import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { accentOf } from "@/components/goal-ui";
import { GoalHero, StepRow, type HomeGoal } from "@/components/home-cards";
import {
  GoalCompletePrompt,
  FOCUS_ADD_STEP_KEY,
  type CompletedGoal,
} from "@/components/goal-complete-prompt";
import { StepActionsModal } from "@/components/step-actions-modal";
import { HabitFormModal } from "@/components/habit-form-modal";
import { Loading } from "@/components/loading";
import { goalQueryOptions } from "@/lib/goal-queries";
import {
  addStep,
  deleteGoal,
  deleteStep,
  reorderSteps,
  toggleStep,
  updateGoalDetails,
  updateStep,
} from "@/lib/goals.functions";

type Step = HomeGoal["steps"][number];

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
  const { data: goal, isPending } = useQuery(goalQueryOptions(goalId));

  return (
    <AppShell backTo="/overview">
      {isPending || !goal ? (
        <Loading />
      ) : (
        <GoalDetailBody goal={goal} goalId={goalId} />
      )}
    </AppShell>
  );
}

/**
 * The editable body. Rendered inside <AppShell> so it can read the
 * focus-timer context (useAppShell) for the per-step timer buttons.
 */
function GoalDetailBody({
  goal,
  goalId,
}: {
  goal: HomeGoal & { why?: string | null; vision?: string | null };
  goalId: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { openFocus, celebrate } = useAppShell();
  const accent = accentOf(goal);

  const [title, setTitle] = useState(goal.title);
  const [why, setWhy] = useState(goal.why ?? "");
  const [vision, setVision] = useState(goal.vision ?? "");
  const [stepDraft, setStepDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [promptGoal, setPromptGoal] = useState<CompletedGoal | null>(null);
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const [habitPrefill, setHabitPrefill] = useState<string | null>(null);
  const [orderedSteps, setOrderedSteps] = useState<Step[]>(goal.steps);
  const stepInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the goal title so long titles wrap instead of truncating.
  useEffect(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [title]);

  useEffect(() => {
    setTitle(goal.title);
    setWhy(goal.why ?? "");
    setVision(goal.vision ?? "");
  }, [goal.id, goal.title, goal.why, goal.vision]);

  // Keep the local drag order in sync with the latest fetched steps.
  useEffect(() => {
    setOrderedSteps(goal.steps);
  }, [goal.steps]);

  // If we arrived from a "Not yet — add more steps" prompt, focus the add box.
  useEffect(() => {
    const flagged = sessionStorage.getItem(FOCUS_ADD_STEP_KEY);
    if (flagged === goalId) {
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
    mutationFn: (input: { id: string; title: string }) => updateStep({ data: input }),
    onSuccess: refresh,
  });
  const toggleStepMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) => toggleStep({ data: input }),
    onSuccess: refresh,
  });
  const deleteStepMutation = useMutation({
    mutationFn: (input: { id: string }) => deleteStep({ data: input }),
    onSuccess: refresh,
  });
  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderSteps({ data: { orderedIds } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const handleReorder = (next: Step[]) => {
    setOrderedSteps(next);
    reorderMutation.mutate(next.map((s) => s.id));
  };
  const deleteGoalMutation = useMutation({
    mutationFn: () => deleteGoal({ data: { id: goalId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      navigate({ to: "/overview", replace: true });
    },
  });

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

  const handleToggle = (stepId: string, currentlyDone: boolean) => {
    const markingDone = !currentlyDone;
    // Ticking the last remaining step completes the whole goal.
    const willComplete =
      markingDone && goal.steps.every((s) => s.id === stepId || s.done);
    if (markingDone) celebrate();
    toggleStepMutation.mutate(
      { id: stepId, done: markingDone },
      {
        onSuccess: () => {
          if (willComplete)
            setPromptGoal({ id: goal.id, title: goal.title });
        },
      },
    );
  };

  return (
    <div className="mt-4 space-y-6 pb-4">
      {/* Hero */}
      <GoalHero goal={goal}>
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={1}
          maxLength={140}
          aria-label="Goal title"
          placeholder="Name this goal"
          className="w-full resize-none overflow-hidden break-words bg-transparent text-center font-heading text-2xl leading-tight text-white placeholder:text-white/60 focus:outline-none"
        />
      </GoalHero>

      {/* Steps */}
      <section>
        <p className="font-heading text-sm uppercase text-olive">Next steps:</p>

        <Reorder.Group
          as="div"
          axis="y"
          values={orderedSteps}
          onReorder={handleReorder}
          className="mt-4 space-y-2"
        >
          {orderedSteps.map((step) => (
            <DraggableStep
              key={step.id}
              step={step}
              accent={accent}
              onTimer={() => openFocus(step.id)}
              onToggle={() => handleToggle(step.id, step.done)}
              titleNode={
                <button
                  type="button"
                  onClick={() => setActiveStep(step)}
                  aria-label={`Open ${step.title}`}
                  className={`block w-full text-left font-serif text-sm ${
                    step.done
                      ? "text-black/40 line-through decoration-black/30"
                      : "text-black"
                  }`}
                >
                  {step.title}
                </button>
              }
            />
          ))}
        </Reorder.Group>

        <div className="mt-2">
          <form onSubmit={submitStep} className="flex items-center gap-2 pt-1">
            <input
              ref={stepInputRef}
              value={stepDraft}
              onChange={(e) => setStepDraft(e.target.value)}
              placeholder="Add a step…"
              maxLength={240}
              className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
            />
            <button
              type="submit"
              disabled={!stepDraft.trim()}
              className="shrink-0 rounded-2xl bg-sage/60 px-6 py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-sage/80 disabled:opacity-40"
            >
              Add
            </button>
          </form>
        </div>
      </section>

      {/* Why */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <label htmlFor="goal-why" className="font-heading text-sm uppercase text-olive">
          Why I'm doing this
        </label>
        <textarea
          id="goal-why"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="What's pulling you towards this?"
          className="mt-3 w-full resize-y bg-transparent font-serif text-sm leading-relaxed text-black placeholder:text-black/40 focus:outline-none"
        />
      </section>

      {/* Vision */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <label htmlFor="goal-vision" className="font-heading text-sm uppercase text-olive">
          What it looks like and feels like when its done
        </label>
        <textarea
          id="goal-vision"
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Picture the finished version of this. Where are you? How does it feel?"
          className="mt-3 w-full resize-y bg-transparent font-serif text-sm leading-relaxed text-black placeholder:text-black/40 focus:outline-none"
        />
      </section>

      <button
        onClick={() =>
          saveMutation.mutate({ title: title.trim() || goal.title, why, vision })
        }
        disabled={!dirty || saveMutation.isPending}
        className="w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
      >
        {saved ? "Saved" : saveMutation.isPending ? "Saving…" : "Save changes"}
      </button>

      <button
        onClick={() => deleteGoalMutation.mutate()}
        className="w-full py-2 font-heading text-sm uppercase text-black/40 transition-colors hover:text-black/70"
      >
        Delete this goal
      </button>

      <GoalCompletePrompt goal={promptGoal} onClose={() => setPromptGoal(null)} />

      {activeStep && (
        <StepActionsModal
          title={activeStep.title}
          done={activeStep.done}
          onClose={() => setActiveStep(null)}
          onRename={(t) =>
            updateStepMutation.mutate({ id: activeStep.id, title: t })
          }
          onToggle={() => handleToggle(activeStep.id, activeStep.done)}
          onDelete={() => deleteStepMutation.mutate({ id: activeStep.id })}
          onAddAsHabit={(habitName) => {
            setActiveStep(null);
            setHabitPrefill(habitName);
          }}
        />
      )}

      {habitPrefill !== null && (
        <HabitFormModal
          initialName={habitPrefill}
          onClose={() => setHabitPrefill(null)}
        />
      )}
    </div>
  );
}

function DraggableStep({
  step,
  accent,
  onTimer,
  onToggle,
  titleNode,
}: {
  step: Step;
  accent: { deep: string; surface: string };
  onTimer: () => void;
  onToggle: () => void;
  titleNode: React.ReactNode;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={step}
      dragListener={false}
      dragControls={controls}
    >
      <StepRow
        accent={accent}
        done={step.done}
        onTimer={onTimer}
        onToggle={onToggle}
        titleNode={titleNode}
        dragHandle={
          <button
            type="button"
            aria-label="Drag to reorder"
            onPointerDown={(e) => controls.start(e)}
            className="grid size-8 shrink-0 cursor-grab touch-none place-items-center text-black/25 active:cursor-grabbing"
          >
            <GripVertical className="size-5" />
          </button>
        }
      />
    </Reorder.Item>
  );
}

function EditableStepTitle({
  title,
  done,
  onSave,
  onDelete,
}: {
  title: string;
  done: boolean;
  onSave: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(title);
          setEditing(true);
        }}
        aria-label={`Edit step: ${title}`}
        className={`block w-full text-left font-serif text-sm ${
          done ? "text-black/40 line-through decoration-black/30" : "text-black"
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
    <div className="flex items-center gap-1">
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
        className="min-w-0 flex-1 rounded-lg bg-black/5 px-2 py-1 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-olive/40"
      />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onDelete();
        }}
        aria-label={`Delete step: ${title}`}
        className="grid size-7 shrink-0 place-items-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
      >
        ×
      </button>
    </div>
  );
}
