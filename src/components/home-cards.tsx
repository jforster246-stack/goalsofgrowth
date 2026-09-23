import type { ReactNode } from "react";
import { Archive, Check, Moon, Plus, Sun, Sunset, Timer, Trophy } from "lucide-react";
import { accentOf, goalProgress, STAR_PATH } from "@/components/goal-ui";
import { cn } from "@/lib/utils";

/** Minimal goal shape the Home cards need (kept loose so mock + real data both fit). */
export type HomeGoal = {
  id: string;
  title: string;
  accent: string;
  steps: { id: string; title: string; done: boolean }[];
};

/** Hollow six-pointed star, tinted via `text-*` + currentColor. */
function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden>
      <path d={STAR_PATH} fillRule="evenodd" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Next-step row — "What next step will you take today?"               */
/* ------------------------------------------------------------------ */

export function NextStepRow({
  goal,
  step,
  onOpen,
  onStartTimer,
  onComplete,
}: {
  goal: HomeGoal;
  step: { id: string; title: string };
  onOpen?: () => void;
  onStartTimer?: () => void;
  onComplete?: () => void;
}) {
  const accent = accentOf(goal);

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-2xl bg-white py-2 pl-2.5 pr-2 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <Star className={cn("size-10 shrink-0", accent.text)} />
        <span className="flex min-w-0 flex-col">
          <span className="font-serif text-sm text-black">
            {step.title}
          </span>
          <span className={cn("truncate font-serif text-[10px] italic", accent.text)}>
            {goal.title}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onStartTimer}
          aria-label="Start a focus timer for this step"
          className={cn(
            "flex items-center justify-center rounded-lg p-2 text-white",
            accent.deep,
          )}
        >
          <Timer className="size-6" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onComplete}
          aria-label="Mark this step complete"
          className={cn(
            "flex items-center justify-center rounded-lg p-2 text-white",
            accent.surface,
          )}
        >
          <Check className="size-6" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Goal card — the horizontally-scrolling "All goals" cards            */
/* ------------------------------------------------------------------ */

export function GoalCard({
  goal,
  isGoalOfDay = false,
  onOpen,
  onFocus,
  onComplete,
  onAdd,
  onAddWin,
  onArchive,
}: {
  goal: HomeGoal;
  isGoalOfDay?: boolean;
  onOpen?: () => void;
  onFocus?: () => void;
  onComplete?: () => void;
  onAdd?: () => void;
  onAddWin?: () => void;
  onArchive?: () => void;
}) {
  const accent = accentOf(goal);
  const progress = goalProgress(goal);
  const hasSteps = goal.steps.length > 0;
  const complete = progress.complete;

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl bg-white shadow-sm",
        isGoalOfDay ? "overflow-visible" : "overflow-hidden",
      )}
    >
      {isGoalOfDay && (
        <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-olive px-5 py-2 font-heading text-[13.9px] uppercase leading-none text-white">
          Goal of the day
        </span>
      )}

      {/* Coloured header */}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex w-full flex-col items-center gap-7 rounded-t-2xl px-8 pb-6 pt-8 text-center",
          accent.surface,
        )}
      >
        <div className="flex w-full flex-col items-center gap-4">
          <Star className="size-[86px] text-white" />
          <p className="w-full font-heading text-2xl leading-tight text-white">
            {goal.title}
          </p>
        </div>

        <div className="flex w-full flex-col items-end gap-1.5">
          <div className="h-3 w-full overflow-hidden rounded-full bg-black/15">
            <div
              className="h-full rounded-full bg-white/85 transition-[width] duration-500"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="font-mono text-[11.8px] uppercase text-white/60">
            {progress.pct}%
          </p>
        </div>
      </button>

      {/* Next-step panel */}
      <div className="flex flex-col items-center gap-6 px-3 py-4">
        <p className="w-full text-center font-heading text-[14.75px] uppercase text-olive">
          {complete ? "Complete" : "Next Step:"}
        </p>
        <p className="w-full text-center font-serif text-sm text-black">
          {complete
            ? "Every step is done — nice work."
            : hasSteps
              ? (progress.nextStep?.title ?? "Every step is done — nice work.")
              : "Break down this goal into manageable tasks"}
        </p>

        {complete ? (
          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={onAddWin}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg p-2 font-heading text-[12.7px] uppercase text-white",
                accent.deep,
              )}
            >
              Add to wins log
              <Trophy className="size-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={onArchive}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-black/5 p-2 font-heading text-[12.7px] uppercase text-black/60 transition-colors hover:bg-black/10"
            >
              Archive
              <Archive className="size-5" strokeWidth={2} />
            </button>
          </div>
        ) : hasSteps ? (
          <div className="flex w-full items-center gap-2">
            <button
              type="button"
              onClick={onFocus}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg p-2 font-heading text-[12.7px] uppercase text-white",
                accent.deep,
              )}
            >
              Focus on this
              <Timer className="size-6" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={onComplete}
              aria-label="Mark next step complete"
              className={cn(
                "flex items-center justify-center rounded-lg p-2 text-white",
                accent.surface,
              )}
            >
              <Check className="size-6" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded p-2 font-heading text-[12.7px] uppercase text-white",
              accent.surface,
            )}
          >
            Add
            <Plus className="size-6" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Goal hero — the standalone coloured card on the Goal Detail screen  */
/* ------------------------------------------------------------------ */

export function GoalHero({
  goal,
  children,
}: {
  goal: HomeGoal;
  children: ReactNode;
}) {
  const accent = accentOf(goal);
  const { pct } = goalProgress(goal);

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-7 rounded-3xl px-8 pb-7 pt-9 text-center",
        accent.surface,
      )}
    >
      <Star className="size-[86px] text-white" />
      {children}
      <div className="h-3 w-full overflow-hidden rounded-full bg-black/15">
        <div
          className="h-full rounded-full bg-white/85 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step row — a goal's step as a white card with timer + check         */
/* ------------------------------------------------------------------ */

export function StepRow({
  accent,
  done,
  titleNode,
  onTimer,
  onToggle,
}: {
  accent: { deep: string; surface: string };
  done: boolean;
  titleNode: ReactNode;
  onTimer?: () => void;
  onToggle?: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-2xl bg-white py-2 pl-3.5 pr-2 shadow-sm">
      <div className="min-w-0 flex-1">{titleNode}</div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onTimer}
          aria-label="Start a focus timer for this step"
          className={cn(
            "flex items-center justify-center rounded-lg p-2 text-white",
            accent.deep,
          )}
        >
          <Timer className="size-6" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={done ? "Mark step not done" : "Mark step done"}
          className={cn(
            "flex items-center justify-center rounded-lg p-2 text-white transition-colors",
            done ? accent.deep : accent.surface,
          )}
        >
          <Check className="size-6" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Habit row — a habit styled like a step card, with a sun/moon icon   */
/* on the left for its time of day, plus a focus timer + daily tick.   */
/* ------------------------------------------------------------------ */

export type HabitTime = "morning" | "afternoon" | "evening";

const HABIT_ICON = { morning: Sun, afternoon: Sunset, evening: Moon } as const;
const HABIT_ICON_COLOR = {
  morning: "text-gold-deep",
  afternoon: "text-clay-deep",
  evening: "text-olive",
} as const;

export function HabitRow({
  name,
  timeOfDay,
  done,
  frequency,
  onOpen,
  onTimer,
  onToggle,
}: {
  name: string;
  timeOfDay: HabitTime;
  done: boolean;
  frequency?: string;
  onOpen?: () => void;
  onTimer?: () => void;
  onToggle?: () => void;
}) {
  const Icon = HABIT_ICON[timeOfDay];
  const showFrequency = frequency && frequency !== "daily";

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-2xl bg-white py-2 pl-3 pr-2 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Edit ${name}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <Icon
          className={cn("size-8 shrink-0", HABIT_ICON_COLOR[timeOfDay])}
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "font-serif text-sm",
              done ? "text-black/40 line-through decoration-black/30" : "text-black",
            )}
          >
            {name}
          </span>
          {showFrequency && (
            <span className="font-heading text-[10px] uppercase text-black/40">
              {frequency}
            </span>
          )}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onTimer}
          aria-label={`Start a focus timer for ${name}`}
          className="flex items-center justify-center rounded-lg bg-olive p-2 text-white"
        >
          <Timer className="size-6" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={done ? `Mark ${name} not done today` : `Mark ${name} done today`}
          className={cn(
            "flex items-center justify-center rounded-lg p-2 text-white transition-colors",
            done ? "bg-olive" : "bg-sage",
          )}
        >
          <Check className="size-6" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
