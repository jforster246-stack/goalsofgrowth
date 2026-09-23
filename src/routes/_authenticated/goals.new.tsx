import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GOAL_ACCENTS, type Accent } from "@/components/goal-ui";
import { addStep, createGoal, updateGoalDetails } from "@/lib/goals.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/goals/new")({
  head: () => ({
    meta: [{ title: "New goal — Goals of Growth" }],
  }),
  component: NewGoalPage,
});

const STEPS = [
  { key: "title", label: "Name your goal" },
  { key: "steps", label: "Next steps" },
  { key: "why", label: "Why you're doing this" },
  { key: "vision", label: "When it's done" },
] as const;

function NewGoalPage() {
  return (
    <AppShell title="New goal" backTo="/goals">
      <NewGoalForm />
    </AppShell>
  );
}

export function NewGoalForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [accent, setAccent] = useState<Accent>("mint");
  const [steps, setSteps] = useState<string[]>([]);
  const [stepDraft, setStepDraft] = useState("");
  const [why, setWhy] = useState("");
  const [vision, setVision] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const goal = await createGoal({ data: { title: title.trim(), accent } });
      for (const s of steps) {
        await addStep({ data: { goalId: goal.id, title: s } });
      }
      if (why.trim() || vision.trim()) {
        await updateGoalDetails({
          data: { id: goal.id, why: why.trim(), vision: vision.trim() },
        });
      }
      return goal;
    },
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      navigate({ to: "/goals/$goalId", params: { goalId: goal.id }, replace: true });
    },
  });

  const addDraftStep = () => {
    const value = stepDraft.trim();
    if (!value) return;
    setSteps((s) => [...s, value]);
    setStepDraft("");
  };

  const isLast = step === STEPS.length - 1;
  const canContinue = step === 0 ? title.trim().length > 0 : true;

  const next = () => {
    if (!canContinue) return;
    if (isLast) {
      if (!createMutation.isPending) createMutation.mutate();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="mt-4 flex min-h-[70dvh] flex-col pb-4 md:mx-auto md:max-w-xl">
        {/* Progress */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-olive" : "bg-black/10",
              )}
            />
          ))}
        </div>
        <p className="mt-3 font-heading text-sm uppercase text-olive">
          Step {step + 1} of {STEPS.length}
        </p>

        {/* Step body */}
        <div className="mt-4 flex-1">
          {step === 0 && (
            <div>
              <h2 className="font-display text-2xl leading-tight text-black">
                What do you want to achieve?
              </h2>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && next()}
                placeholder="Name your goal"
                maxLength={140}
                className="mt-5 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-base placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
              />

              <p className="mt-6 font-heading text-sm uppercase text-olive">
                Colour
              </p>
              <div className="mt-2 flex gap-3">
                {GOAL_ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAccent(a.key)}
                    aria-label={a.label}
                    aria-pressed={accent === a.key}
                    className={cn(
                      "grid size-11 place-items-center rounded-full text-white transition-transform",
                      a.swatch,
                      accent === a.key
                        ? "ring-2 ring-black/40 ring-offset-2 ring-offset-background"
                        : "",
                    )}
                  >
                    {accent === a.key && <Check className="size-5" strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl leading-tight text-black">
                What are the next steps?
              </h2>
              <p className="mt-2 font-serif text-sm text-black/50">
                Break it into small, doable actions. You can add more later.
              </p>

              <div className="mt-4 space-y-2">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-serif text-sm text-black">
                      {s}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSteps((arr) => arr.filter((_, idx) => idx !== i))}
                      aria-label={`Remove ${s}`}
                      className="grid size-7 shrink-0 place-items-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  value={stepDraft}
                  onChange={(e) => setStepDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDraftStep();
                    }
                  }}
                  placeholder="Add a step…"
                  maxLength={240}
                  className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
                />
                <button
                  type="button"
                  onClick={addDraftStep}
                  disabled={!stepDraft.trim()}
                  aria-label="Add step"
                  className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage/60 text-white transition-colors hover:bg-sage/80 disabled:opacity-40"
                >
                  <Plus className="size-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl leading-tight text-black">
                Why are you doing this?
              </h2>
              <p className="mt-2 font-serif text-sm text-black/50">
                What's pulling you towards it? (optional)
              </p>
              <textarea
                autoFocus
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Because…"
                className="mt-4 w-full resize-y rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm leading-relaxed placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-2xl leading-tight text-black">
                What does it look and feel like when it's done?
              </h2>
              <p className="mt-2 font-serif text-sm text-black/50">
                Picture the finished version. (optional)
              </p>
              <textarea
                autoFocus
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Where are you? How does it feel?"
                className="mt-4 w-full resize-y rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm leading-relaxed placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-2xl px-5 py-3.5 font-heading text-sm uppercase text-black/50 transition-colors hover:text-black/80"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canContinue || createMutation.isPending}
            className="flex-1 rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
          >
            {isLast
              ? createMutation.isPending
                ? "Creating…"
                : "Create goal"
              : "Continue"}
          </button>
        </div>

        {createMutation.isError && (
          <p className="mt-3 text-center font-serif text-sm text-clay-deep">
            Something went wrong. Please try again.
          </p>
        )}
    </div>
  );
}
