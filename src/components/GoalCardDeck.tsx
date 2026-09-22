import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AccentStar,
  accentOf,
  DIAMOND_PATH,
  goalProgress,
  type GoalWithSteps,
} from "@/components/goal-ui";

type GoalCardDeckProps = {
  goals: GoalWithSteps[];
  onFocus: (stepId: string) => void;
  onCompleteStep: (stepId: string) => Promise<unknown>;
};

const SWIPE_DISTANCE = 70;

export function GoalCardDeck({
  goals,
  onFocus,
  onCompleteStep,
}: GoalCardDeckProps) {
  const prefersReducedMotion = useReducedMotion();
  const [view, setView] = useState<"deck" | "grid">("deck");
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [locallyDone, setLocallyDone] = useState<Set<string>>(() => new Set());
  const [celebrating, setCelebrating] = useState<string | null>(null);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(goals.length - 1, 0)));
    setLocallyDone((current) => {
      const pending = new Set(
        [...current].filter((id) => !goals.some((goal) => goal.steps.some((step) => step.id === id && step.done))),
      );
      return pending.size === current.size ? current : pending;
    });
  }, [goals]);

  const visibleGoals = useMemo(
    () =>
      goals.map((goal) => ({
        ...goal,
        steps: goal.steps.map((step) =>
          locallyDone.has(step.id) ? { ...step, done: true } : step,
        ),
      })),
    [goals, locallyDone],
  );

  const moveTo = (index: number) => {
    const bounded = Math.max(0, Math.min(index, visibleGoals.length - 1));
    if (bounded === activeIndex) return;
    setDirection(bounded > activeIndex ? 1 : -1);
    setActiveIndex(bounded);
  };

  const completeStep = async (stepId: string) => {
    if (locallyDone.has(stepId)) return;
    setLocallyDone((current) => new Set(current).add(stepId));
    setCelebrating(stepId);
    window.setTimeout(() => setCelebrating(null), 650);
    try {
      await onCompleteStep(stepId);
    } catch {
      setLocallyDone((current) => {
        const next = new Set(current);
        next.delete(stepId);
        return next;
      });
    }
  };

  return (
    <section className="mt-5" aria-label="Your goals">
      {view === "deck" ? (
        <div>
          <div className="relative h-[430px]">
            {visibleGoals.length > 1 && (
              <div className="absolute inset-x-5 bottom-0 top-5 rounded-2xl bg-sand/70 shadow-sm ring-1 ring-border" />
            )}
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              {visibleGoals[activeIndex] && (
                <motion.div
                  key={visibleGoals[activeIndex].id}
                  custom={direction}
                  initial={prefersReducedMotion ? false : { x: direction * 110, opacity: 0, rotate: direction * 2 }}
                  animate={{ x: 0, opacity: 1, rotate: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { x: direction * -110, opacity: 0, rotate: direction * -2 }}
                  transition={{ type: "spring", stiffness: 310, damping: 30 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.16}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -SWIPE_DISTANCE) moveTo(activeIndex + 1);
                    if (info.offset.x > SWIPE_DISTANCE) moveTo(activeIndex - 1);
                  }}
                  className="absolute inset-x-0 top-0 touch-pan-y"
                >
                  <DeckCard
                    goal={visibleGoals[activeIndex]}
                    celebrating={celebrating}
                    onFocus={onFocus}
                    onCompleteStep={completeStep}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {visibleGoals.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={activeIndex === 0}
                onClick={() => moveTo(activeIndex - 1)}
                aria-label="Previous goal"
                className="rounded-full"
              >
                <span aria-hidden>←</span>
              </Button>
              <div className="flex items-center gap-1.5" aria-label={`Goal ${activeIndex + 1} of ${visibleGoals.length}`}>
                {visibleGoals.map((goal, index) => (
                  <Button
                    key={goal.id}
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveTo(index)}
                    aria-label={`Show ${goal.title}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    className={`h-2 min-h-0 rounded-full p-0 transition-all ${index === activeIndex ? "w-5 bg-focus hover:bg-focus" : "w-2 bg-star hover:bg-star"}`}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={activeIndex === visibleGoals.length - 1}
                onClick={() => moveTo(activeIndex + 1)}
                aria-label="Next goal"
                className="rounded-full"
              >
                <span aria-hidden>→</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleGoals.map((goal, index) => (
            <GridGoalCard
              key={goal.id}
              goal={goal}
              index={index}
              celebrating={celebrating}
              onCompleteStep={completeStep}
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={() => setView((current) => (current === "deck" ? "grid" : "deck"))}
        className="mx-auto mt-6 flex h-10 rounded-full px-5 text-[11px] font-semibold uppercase text-focus"
      >
        {view === "deck" ? "See all goals grid" : "See swipeable cards"}
      </Button>
    </section>
  );
}

function DeckCard({
  goal,
  celebrating,
  onFocus,
  onCompleteStep,
}: {
  goal: GoalWithSteps;
  celebrating: string | null;
  onFocus: (stepId: string) => void;
  onCompleteStep: (stepId: string) => void;
}) {
  const accent = accentOf(goal);
  const { done, total, pct, complete, nextStep } = goalProgress(goal);

  return (
    <article className="relative flex h-[410px] flex-col overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border">
      <AnimatePresence>
        {celebrating && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 1.2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
            className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-2xl bg-card/70"
          >
            <div className={`grid size-20 place-items-center rounded-full bg-background text-4xl ${accent.text}`}>✓</div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex min-h-0 flex-[1.05] flex-col bg-sand/45 p-6">
        <div className="flex items-start gap-3">
          <AccentStar fillClass={accent.check} />
          <Link
            to="/goals/$goalId"
            params={{ goalId: goal.id }}
            className="min-w-0 flex-1"
          >
            <h2 className={`text-balance text-[26px] leading-tight ${accent.text}`}>
              {goal.title}
            </h2>
          </Link>
          <span className={`text-lg font-semibold tabular-nums ${accent.text}`}>{pct}%</span>
        </div>
        <div className="mt-auto">
          <div className="h-2.5 overflow-hidden rounded-full bg-card/80">
            <motion.div
              className={`h-full rounded-full ${accent.bar}`}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground">{done} of {total} steps complete</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">{complete ? "Completed" : "Next step:"}</p>
        <p className="mt-2 line-clamp-2 min-h-12 text-lg font-medium leading-snug">
          {complete ? "Every step is done — beautiful work." : nextStep?.title ?? "Add your first small step."}
        </p>
        <div className="mt-auto flex items-center gap-3">
          {nextStep ? (
            <>
              <Button
                type="button"
                onClick={() => onFocus(nextStep.id)}
                className="h-12 flex-1 rounded-xl bg-focus text-primary-foreground hover:bg-focus/90"
              >
                Focus on this
              </Button>
              <CompleteButton
                stepTitle={nextStep.title}
                accentClass={accent.check}
                celebrating={celebrating === nextStep.id}
                onClick={() => onCompleteStep(nextStep.id)}
              />
            </>
          ) : (
            <Button asChild className="h-12 flex-1 rounded-xl">
              <Link to="/goals/$goalId" params={{ goalId: goal.id }}>View goal</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function GridGoalCard({
  goal,
  index,
  celebrating,
  onCompleteStep,
}: {
  goal: GoalWithSteps;
  index: number;
  celebrating: string | null;
  onCompleteStep: (stepId: string) => void;
}) {
  const accent = accentOf(goal);
  const { done, total, pct, complete, nextStep } = goalProgress(goal);
  return (
    <article className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border" style={{ animation: `rise 0.35s ${index * 0.05}s both` }}>
      <Link to="/goals/$goalId" params={{ goalId: goal.id }} className="block">
        <div className="flex items-center gap-3">
          <AccentStar fillClass={accent.check} />
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{goal.title}</h3>
          <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${accent.bar} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase text-muted-foreground">{complete ? "Completed" : "Next step:"}</p>
      </Link>
      {nextStep ? (
        <div className="mt-1 flex items-center gap-2">
          <CompleteButton
            compact
            stepTitle={nextStep.title}
            accentClass={accent.check}
            celebrating={celebrating === nextStep.id}
            onClick={() => onCompleteStep(nextStep.id)}
          />
          <span className="min-w-0 flex-1 text-sm">{nextStep.title}</span>
        </div>
      ) : (
        <p className="mt-1 text-sm">{total === 0 ? "No steps yet — tap to add one." : `${done} of ${total} complete`}</p>
      )}
    </article>
  );
}

function CompleteButton({
  stepTitle,
  accentClass,
  celebrating,
  compact = false,
  onClick,
}: {
  stepTitle: string;
  accentClass: string;
  celebrating: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      aria-label={`Complete ${stepTitle}`}
      className={`${compact ? "size-9" : "size-12"} relative shrink-0 rounded-full bg-card`}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className={`size-5 fill-none stroke-muted-foreground ${celebrating ? accentClass : ""}`}
        strokeWidth="1.8"
        animate={celebrating ? { scale: [1, 1.45, 1], rotate: [0, 12, 0] } : { scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <path d={DIAMOND_PATH} />
        <motion.path
          d="m8.5 12 2.2 2.2 4.8-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: celebrating ? 1 : 0, opacity: celebrating ? 1 : 0 }}
        />
      </motion.svg>
    </Button>
  );
}