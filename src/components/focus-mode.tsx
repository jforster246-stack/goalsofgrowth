import { useEffect, useState } from "react";
import { AccentStar, accentOf } from "@/components/goal-ui";
import type { GoalWithSteps } from "@/components/goal-ui";

type FocusTarget = {
  goalTitle: string;
  accentClass: string;
  accentTextClass: string;
  stepTitle: string;
  stepId: string;
};

const FOCUS_MINUTES = 25;

const CUSTOM_STEP_ID = "__custom__";

export function FocusMode({
  goals,
  onClose,
  onCompleteStep,
  initialStepId,
  customTarget,
}: {
  goals: GoalWithSteps[];
  onClose: () => void;
  onCompleteStep: (stepId: string) => void;
  initialStepId?: string | null;
  customTarget?: {
    title: string;
    subtitle?: string;
    onComplete?: () => void;
  } | null;
}) {
  const nextSteps = goals
    .map((goal): FocusTarget | null => {
      const step = goal.steps.find((s) => !s.done);
      return step
        ? {
            goalTitle: goal.title,
            accentClass: accentOf(goal).check,
            accentTextClass: accentOf(goal).text,
            stepTitle: step.title,
            stepId: step.id,
          }
        : null;
    })
    .filter((t): t is FocusTarget => t !== null);
  const [target, setTarget] = useState<FocusTarget | null>(() =>
    customTarget
      ? {
          goalTitle: customTarget.subtitle ?? "Focus",
          accentClass: "fill-olive",
          accentTextClass: "text-olive",
          stepTitle: customTarget.title,
          stepId: CUSTOM_STEP_ID,
        }
      : (nextSteps.find((item) => item.stepId === initialStepId) ?? null),
  );

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background [animation:rise_0.25s_both]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-6">
        {target ? (
          <FocusSession
            key={target.stepId}
            target={target}
            onComplete={() => {
              if (target.stepId === CUSTOM_STEP_ID) customTarget?.onComplete?.();
              else onCompleteStep(target.stepId);
              setTarget(null);
            }}
            onEnd={() => setTarget(null)}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Focus mode
              </h2>
              <button
                onClick={onClose}
                aria-label="Close focus mode"
                className="grid size-9 place-items-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick one small step to work on.
            </p>

            <div className="mt-6 flex-1 space-y-3 overflow-y-auto">
              {nextSteps.length === 0 ? (
                <div className="rounded-2xl bg-card p-8 text-center shadow-sm ring-1 ring-border">
                  <p className="text-base font-semibold">All caught up</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add a goal with some steps to focus on.
                  </p>
                </div>
              ) : (
                nextSteps.map((t) => (
                  <button
                    key={t.stepId}
                    onClick={() => setTarget(t)}
                    className="w-full rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-1.5">
                      <AccentStar fillClass={t.accentClass} />
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide ${t.accentTextClass}`}
                      >
                        {t.goalTitle}
                      </p>
                    </div>
                    <p className="mt-1.5 text-[15px] font-semibold tracking-tight">
                      {t.stepTitle}
                    </p>
                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                      Tap to start a {FOCUS_MINUTES}-minute focus
                    </p>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FocusSession({
  target,
  onEnd,
  onComplete,
}: {
  target: FocusTarget;
  onEnd: () => void;
  onComplete: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [running]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const finished = secondsLeft === 0;
  const pct = 1 - secondsLeft / (FOCUS_MINUTES * 60);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end">
        <button
          onClick={onEnd}
          aria-label="End focus session"
          className="grid size-9 place-items-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ×
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {target.goalTitle}
        </p>
        <h2 className="mt-3 max-w-xs text-2xl font-semibold leading-snug tracking-tight">
          {target.stepTitle}
        </h2>

        <div className="relative mt-10 grid size-56 place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              strokeWidth="4"
              className="stroke-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - pct)}`}
              className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <p className="text-5xl font-semibold tabular-nums tracking-tight">
            {display}
          </p>
        </div>

        {finished && (
          <p className="mt-6 text-sm font-medium text-primary [animation:rise_0.3s_both]">
            Time's up — nice work.
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={finished}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          onClick={onComplete}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          ✓ I finished this
        </button>
      </div>
    </div>
  );
}
