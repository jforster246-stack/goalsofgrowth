import type { ReactNode } from "react";
import { Archive, Check, Plus, Timer, Trophy, Undo2 } from "lucide-react";
import { accentOf, goalProgress, STAR_PATH } from "@/components/goal-ui";
import { Motif, TIME_MOTIF } from "@/components/motif-icons";
import { Stamp } from "@/components/stamp";
import { cn } from "@/lib/utils";

/** Minimal goal shape the Home cards need (kept loose so mock + real data both fit). */
export type HomeGoal = {
  id: string;
  title: string;
  accent: string;
  icon?: string | null;
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

/** The goal's chosen motif, or the six-pointed star when none is set. */
function GoalGlyph({ goal, className }: { goal: HomeGoal; className: string }) {
  if (goal.icon) return <Motif id={goal.icon} className={className} />;
  return <Star className={className} />;
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
    <div className="flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:py-2 sm:pl-2.5 sm:pr-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-start gap-2 text-left sm:items-center"
      >
        <GoalGlyph goal={goal} className={cn("size-8 shrink-0 sm:size-10", accent.text)} />
        <span className="flex min-w-0 flex-col">
          <span className="font-serif text-xs leading-snug text-black line-clamp-3 sm:text-sm">
            {step.title}
          </span>
          <span className={cn("truncate font-serif text-[10px] italic", accent.text)}>
            {goal.title}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={onStartTimer}
          aria-label="Start a focus timer for this step"
          className={cn(
            "flex items-center justify-center rounded-lg p-1.5 text-white sm:p-2",
            accent.deep,
          )}
        >
          <Timer className="size-5 sm:size-6" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onComplete}
          aria-label="Mark this step complete"
          className={cn(
            "flex items-center justify-center rounded-lg p-1.5 text-white sm:p-2",
            accent.surface,
          )}
        >
          <Check className="size-5 sm:size-6" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/**
 * Portrait next-step card — a taller card for the wide (tablet/desktop) Home,
 * where several sit in a row. Star + step + goal on top, timer + tick below.
 */
export function NextStepPortrait({
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
    <div className="flex w-48 shrink-0 flex-col rounded-2xl bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col items-start gap-2 text-left"
      >
        <GoalGlyph goal={goal} className={cn("size-9 shrink-0", accent.text)} />
        <span className="font-serif text-sm leading-snug text-black [overflow-wrap:anywhere]">
          {step.title}
        </span>
        <span className={cn("font-serif text-[10px] italic", accent.text)}>{goal.title}</span>
      </button>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onStartTimer}
          aria-label="Start a focus timer for this step"
          className={cn(
            "flex flex-1 items-center justify-center rounded-lg p-2 text-white",
            accent.deep,
          )}
        >
          <Timer className="size-5" strokeWidth={1.75} />
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
          <Check className="size-5" strokeWidth={2} />
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
  dragHandle,
}: {
  goal: HomeGoal;
  isGoalOfDay?: boolean;
  onOpen?: () => void;
  onFocus?: () => void;
  onComplete?: () => void;
  onAdd?: () => void;
  onAddWin?: () => void;
  onArchive?: () => void;
  dragHandle?: ReactNode;
}) {
  const accent = accentOf(goal);
  const progress = goalProgress(goal);
  const hasSteps = goal.steps.length > 0;
  const complete = progress.complete;

  const stepText = complete
    ? "Every step is done — nice work."
    : hasSteps
      ? (progress.nextStep?.title ?? "Every step is done — nice work.")
      : "Break down this goal into manageable tasks";

  return (
    <div className="relative w-full">
      {isGoalOfDay && (
        <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-olive px-5 py-2 font-heading text-[13.9px] uppercase leading-none text-white">
          Goal of the day
        </span>
      )}

      {dragHandle}

      {/* Modern style: a plain, quiet card */}
      <div className="hidden min-h-[260px] flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 modern:flex">
        <button type="button" onClick={onOpen} className="flex items-start gap-3 text-left">
          <GoalGlyph goal={goal} className={cn("mt-0.5 size-6 shrink-0", accent.text)} />
          <span className="line-clamp-2 min-w-0 flex-1 pr-8 text-lg font-medium leading-snug text-black">
            {goal.title}
          </span>
        </button>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/5">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", accent.bar)}
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-black/45">
          {hasSteps
            ? `${progress.pct}% · ${progress.done} of ${progress.total} steps`
            : "No steps yet"}
        </p>
        <p className="mt-5 text-[11px] font-medium uppercase tracking-wide text-black/40">
          {complete ? "Complete" : "Next step"}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-black">{stepText}</p>
        <div className="mt-auto pt-5">
          <GoalCardActions
            variant="modern"
            accent={accent}
            complete={complete}
            hasSteps={hasSteps}
            onFocus={onFocus}
            onComplete={onComplete}
            onAdd={onAdd}
            onAddWin={onAddWin}
            onArchive={onArchive}
          />
        </div>
      </div>

      {/* Traditional style: the ticket stub */}
      <div className="relative flex h-[410px] flex-col overflow-hidden rounded-sm bg-white shadow-sm modern:hidden">
        {/* Coloured top — stamp in the corner, title below */}
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "relative flex h-[230px] w-full shrink-0 flex-col justify-end px-6 pb-6 pt-6 text-left",
            accent.surface,
          )}
        >
          <Stamp
            icon={goal.icon ?? null}
            accent={goal.accent}
            className="absolute right-5 top-5 size-14"
          />
          <p className="line-clamp-3 font-heading text-2xl leading-[1.15] text-white">
            {goal.title}
          </p>
        </button>

        {/* Bottom stub — perforation, notches, next step + actions */}
        <div className="relative flex flex-1 flex-col bg-white px-5 pb-5 pt-6">
          <div
            className={cn("absolute inset-x-6 top-0 h-[3px] -translate-y-1/2", accent.text)}
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.6px)",
              backgroundSize: "11px 100%",
              backgroundRepeat: "repeat-x",
              backgroundPosition: "center",
            }}
            aria-hidden
          />
          <span
            className="absolute left-0 top-0 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
            aria-hidden
          />
          <span
            className="absolute right-0 top-0 size-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
            aria-hidden
          />

          <p className={cn("font-serif text-base italic", accent.text)}>
            {complete ? "Complete" : "Next Step:"}
          </p>
          <p className="mt-2 line-clamp-2 font-serif text-sm leading-relaxed text-black">
            {stepText}
          </p>

          <div className="mt-auto pt-4">
            <GoalCardActions
              variant="ticket"
              accent={accent}
              complete={complete}
              hasSteps={hasSteps}
              onFocus={onFocus}
              onComplete={onComplete}
              onAdd={onAdd}
              onAddWin={onAddWin}
              onArchive={onArchive}
            />
          </div>
        </div>

        {/* Inverted (concave) corners — matching the side notches */}
        <span
          className="pointer-events-none absolute left-0 top-0 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-0 top-0 size-6 -translate-y-1/2 translate-x-1/2 rounded-full bg-background"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-0 left-0 size-6 -translate-x-1/2 translate-y-1/2 rounded-full bg-background"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-0 right-0 size-6 translate-x-1/2 translate-y-1/2 rounded-full bg-background"
          aria-hidden
        />
      </div>
    </div>
  );
}

/** The buttons under a goal card, styled for the ticket or the modern card. */
function GoalCardActions({
  variant,
  accent,
  complete,
  hasSteps,
  onFocus,
  onComplete,
  onAdd,
  onAddWin,
  onArchive,
}: {
  variant: "ticket" | "modern";
  accent: ReturnType<typeof accentOf>;
  complete: boolean;
  hasSteps: boolean;
  onFocus?: (() => void) | undefined;
  onComplete?: (() => void) | undefined;
  onAdd?: (() => void) | undefined;
  onAddWin?: (() => void) | undefined;
  onArchive?: (() => void) | undefined;
}) {
  if (variant === "modern") {
    const primary =
      "flex flex-1 items-center justify-center gap-2 rounded-xl bg-focus py-2.5 text-sm font-medium text-white transition-colors hover:bg-focus/90";
    const quiet =
      "flex w-full items-center justify-center gap-2 rounded-xl bg-black/5 py-2.5 text-sm font-medium text-black/60 transition-colors hover:bg-black/10";
    if (complete) {
      return (
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={onAddWin} className={primary}>
            <Trophy className="size-4" strokeWidth={2} />
            Add to wins log
          </button>
          <button type="button" onClick={onArchive} className={quiet}>
            <Archive className="size-4" strokeWidth={2} />
            Archive
          </button>
        </div>
      );
    }
    if (hasSteps) {
      return (
        <div className="flex items-center gap-2">
          <button type="button" onClick={onFocus} className={primary}>
            <Timer className="size-4" strokeWidth={2} />
            Focus on this
          </button>
          <button
            type="button"
            onClick={onComplete}
            aria-label="Mark next step complete"
            className="grid size-[42px] shrink-0 place-items-center rounded-xl text-black/55 ring-1 ring-black/10 transition-colors hover:bg-black/5 hover:text-black"
          >
            <Check className="size-5" strokeWidth={2.25} />
          </button>
        </div>
      );
    }
    return (
      <button type="button" onClick={onAdd} className={quiet}>
        <Plus className="size-4" strokeWidth={2} />
        Add a step
      </button>
    );
  }

  return complete ? (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onAddWin}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-serif text-sm italic text-white",
          accent.deep,
        )}
      >
        Add to wins log
        <Trophy className="size-5" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={onArchive}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-black/5 py-2.5 font-serif text-sm italic text-black/60 transition-colors hover:bg-black/10"
      >
        Archive
        <Archive className="size-5" strokeWidth={2} />
      </button>
    </div>
  ) : hasSteps ? (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onFocus}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-serif text-sm italic text-white",
          accent.surface,
        )}
      >
        Focus on this
        <Timer className="size-5" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={onComplete}
        aria-label="Mark next step complete"
        className={cn(
          "grid size-[46px] shrink-0 place-items-center rounded-xl text-white",
          accent.deep,
        )}
      >
        <Check className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-3 font-serif text-sm italic text-white",
        accent.surface,
      )}
    >
      Add a step
      <Plus className="size-5" strokeWidth={2} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Goal hero — the standalone coloured card on the Goal Detail screen  */
/* ------------------------------------------------------------------ */

export function GoalHero({ goal, children }: { goal: HomeGoal; children: ReactNode }) {
  const accent = accentOf(goal);
  const { pct } = goalProgress(goal);

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-7 rounded-3xl px-8 pb-7 pt-9 text-center",
        accent.surface,
      )}
    >
      <GoalGlyph goal={goal} className="size-[86px] text-white" />
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
  dragHandle,
  onTimer,
  onToggle,
}: {
  accent: { deep: string; surface: string };
  done: boolean;
  titleNode: ReactNode;
  dragHandle?: ReactNode;
  onTimer?: () => void;
  onToggle?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-2xl bg-white py-2 pr-2 shadow-sm",
        dragHandle ? "select-none pl-1.5" : "pl-3.5",
      )}
    >
      {dragHandle}
      <div className="min-w-0 flex-1">{titleNode}</div>
      <div className="flex shrink-0 items-center gap-2">
        {done ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Mark step not done"
            className="flex items-center justify-center rounded-lg bg-black/5 p-2 text-black/45 transition-colors hover:bg-black/10 hover:text-black/70"
          >
            <Undo2 className="size-6" strokeWidth={2} />
          </button>
        ) : (
          <>
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
              aria-label="Mark step done"
              className={cn(
                "flex items-center justify-center rounded-lg p-2 text-white transition-colors",
                accent.surface,
              )}
            >
              <Check className="size-6" strokeWidth={2} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Habit row — a habit styled like a step card, with a sun/moon icon   */
/* on the left for its time of day, plus a focus timer + daily tick.   */
/* ------------------------------------------------------------------ */

export type HabitTime = "morning" | "afternoon" | "evening";

const HABIT_ICON_COLOR = {
  morning: "text-gold-deep",
  afternoon: "text-clay-deep",
  evening: "text-olive",
} as const;

export function HabitRow({
  name,
  timeOfDay,
  done,
  frequencyLabel,
  icon,
  onOpen,
  onTimer,
  onToggle,
}: {
  name: string;
  timeOfDay: HabitTime;
  done: boolean;
  frequencyLabel?: string;
  icon?: string | null;
  onOpen?: () => void;
  onTimer?: () => void;
  onToggle?: () => void;
}) {
  const showFrequency = frequencyLabel && frequencyLabel !== "Daily";

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-2xl bg-white py-2 pl-3 pr-2 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Edit ${name}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <Motif
          id={icon || TIME_MOTIF[timeOfDay]}
          className={cn("size-8 shrink-0", HABIT_ICON_COLOR[timeOfDay])}
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
              {frequencyLabel}
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
