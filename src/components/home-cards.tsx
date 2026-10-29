import type { ReactNode } from "react";
import { Archive, Check, Plus, Timer, Trophy, Undo2 } from "lucide-react";
import { useFocusTimerEnabled } from "@/lib/focus-timer";
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

/**
 * A goal's progress as a waxing moon: new moon at 0%, first quarter at 50%,
 * full moon at 100%. The lit area fills with currentColor, so it picks up the
 * goal's accent colour from the parent.
 */
export function MoonPhase({ pct, className }: { pct: number; className?: string }) {
  const f = Math.max(0, Math.min(1, pct / 100));
  const r = 46;
  const b = r * Math.cos(Math.PI * f); // signed terminator half-width
  const lit = `M 50 ${50 - r} A ${r} ${r} 0 0 1 50 ${50 + r} A ${Math.abs(b).toFixed(2)} ${r} 0 0 ${b > 0 ? 0 : 1} 50 ${50 - r} Z`;
  return (
    <svg viewBox="0 0 100 100" className={cn("block", className)} aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="3" />
      {f > 0 && <path d={lit} fill="currentColor" />}
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
  const focusEnabled = useFocusTimerEnabled();

  return (
    <div className="card-goal flex h-full flex-col gap-4 rounded-3xl p-3 shadow-sm">
      {/* Lock-up: icon + goal title in caps */}
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-2 rounded-2xl bg-white/85 px-2.5 py-2 text-left shadow-sm"
      >
        <span className="tile-pink grid size-8 shrink-0 place-items-center rounded-lg text-[#4f1506]">
          <GoalGlyph goal={goal} className="size-5" />
        </span>
        <span className="line-clamp-1 font-heading text-[10px] leading-tight tracking-wide text-[#201b2f]">
          {goal.title}
        </span>
      </button>

      {/* The next step, big */}
      <button type="button" onClick={onOpen} className="flex-1 text-left">
        <p className="line-clamp-4 font-display text-lg leading-[1.12] text-[#201b2f]">
          {step.title}
        </p>
      </button>

      {/* Complete */}
      <button
        type="button"
        onClick={onComplete}
        aria-label="Mark this step complete"
        className="btn-pink grid w-full place-items-center rounded-2xl py-3.5 text-[#201b2f] shadow-sm transition-transform hover:-translate-y-0.5"
      >
        <Check className="size-6" strokeWidth={2.5} />
      </button>
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
  const focusEnabled = useFocusTimerEnabled();

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
        {focusEnabled && (
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
        )}
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
    ? "Every step is done - nice work."
    : hasSteps
      ? (progress.nextStep?.title ?? "Every step is done - nice work.")
      : "Break down this dream into manageable tasks";

  return (
    <div className="relative w-full">
      {isGoalOfDay && (
        <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-olive px-5 py-2 font-heading text-[13.9px] leading-none text-white">
          Goal of the day
        </span>
      )}

      {dragHandle}

      {/* Modern style: a plain, quiet card */}
      <div className="hidden min-h-[260px] flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 modern:flex">
        <button type="button" onClick={onOpen} className="flex items-start gap-3 text-left">
          <MoonPhase
            pct={progress.pct}
            className={cn("mt-0.5 size-10 shrink-0", accent.text)}
          />
          <span className="min-w-0 flex-1 pr-8">
            <span className="line-clamp-2 block font-display text-lg leading-snug text-[#201b2f]">
              {goal.title}
            </span>
            <span className="mt-1 block font-heading text-[10px] tracking-[0.12em] text-[#928e9d]">
              {hasSteps
                ? `${progress.pct}% · ${progress.done} of ${progress.total} steps`
                : "No steps yet"}
            </span>
          </span>
        </button>
        {complete || !hasSteps ? (
          <>
            <p className="mt-5 font-heading text-[11px] tracking-[0.12em] text-[#928e9d]">
              {complete ? "Complete" : "Next step"}
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#201b2f]">{stepText}</p>
            <div className="mt-auto pt-5">
              <GoalCardActions
                variant="modern"
                accent={accent}
                complete={complete}
                onAdd={onAdd}
                onAddWin={onAddWin}
                onArchive={onArchive}
              />
            </div>
          </>
        ) : (
          <div className="mt-auto flex items-end gap-3 pt-5">
            <div className="min-w-0 flex-1">
              <p className="whitespace-nowrap font-heading text-[11px] tracking-[0.12em] text-[#928e9d]">
                Next step
              </p>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#201b2f]">{stepText}</p>
            </div>
            <StepActionButtons
              variant="modern"
              accent={accent}
              onFocus={onFocus}
              onComplete={onComplete}
            />
          </div>
        )}
      </div>

      {/* Traditional style: the ticket stub */}
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-sm bg-white shadow-sm modern:hidden",
          !complete && hasSteps ? "h-[360px]" : "h-[410px]",
        )}
      >
        {/* Coloured top — stamp in the corner, title below */}
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "relative flex h-[230px] w-full shrink-0 flex-col justify-end px-6 pb-6 pt-6 text-left mg-hero",
            accent.text,
          )}
        >
          <Stamp
            icon={goal.icon ?? null}
            accent={goal.accent}
            className="absolute right-5 top-5 size-14"
          />
          <p className="line-clamp-3 font-heading text-2xl leading-[1.15]">
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

          {!complete && hasSteps ? (
            <div className="flex flex-1 items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("font-serif text-base italic", accent.text)}>Next Step:</p>
                <p className="mt-1 line-clamp-2 font-serif text-sm leading-relaxed text-black">
                  {stepText}
                </p>
              </div>
              <StepActionButtons
                variant="ticket"
                accent={accent}
                onFocus={onFocus}
                onComplete={onComplete}
              />
            </div>
          ) : (
            <>
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
                  onAdd={onAdd}
                  onAddWin={onAddWin}
                  onArchive={onArchive}
                />
              </div>
            </>
          )}
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

/**
 * Focus + tick for a goal's next step, sized to sit on the same line as the step
 * itself so the card stays short. The "Focus on this" label drops to a plain
 * icon on phones, where there's no room to spare.
 */
function StepActionButtons({
  variant,
  accent,
  onFocus,
  onComplete,
}: {
  variant: "ticket" | "modern";
  accent: ReturnType<typeof accentOf>;
  onFocus?: (() => void) | undefined;
  onComplete?: (() => void) | undefined;
}) {
  const ticket = variant === "ticket";
  const focusEnabled = useFocusTimerEnabled();
  return (
    <div className="flex shrink-0 items-center gap-2">
      {focusEnabled && (
        <button
          type="button"
          onClick={onFocus}
          aria-label="Focus on this step"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl text-white transition-colors",
            ticket
              ? cn("px-3.5 py-3 font-serif text-sm italic", accent.surface)
              : "bg-focus px-3 py-2.5 text-sm font-medium hover:bg-focus/90",
          )}
        >
          <Timer className={ticket ? "size-5" : "size-4"} strokeWidth={1.75} />
          <span className="hidden sm:inline">Focus on this</span>
        </button>
      )}
      <button
        type="button"
        onClick={onComplete}
        aria-label="Mark next step complete"
        className={cn(
          "grid shrink-0 place-items-center rounded-xl transition-colors",
          ticket
            ? cn("size-[46px] text-white", accent.deep)
            : "size-[42px] text-black/55 ring-1 ring-black/10 hover:bg-black/5 hover:text-black",
        )}
      >
        <Check className={ticket ? "size-6" : "size-5"} strokeWidth={2.25} />
      </button>
    </div>
  );
}

/** The wide buttons under a goal card: a finished goal, or one with no steps yet. */
function GoalCardActions({
  variant,
  accent,
  complete,
  onAdd,
  onAddWin,
  onArchive,
}: {
  variant: "ticket" | "modern";
  accent: ReturnType<typeof accentOf>;
  complete: boolean;
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
  const { pct, complete } = goalProgress(goal);

  return (
    <div
      className={cn(
        "mg-hero flex w-full flex-col items-center gap-7 rounded-3xl px-8 pb-7 pt-9 text-center shadow-[0_12px_44px_-22px_rgba(90,70,130,0.55)]",
        accent.text,
      )}
    >
      <GoalGlyph goal={goal} className="size-[86px]" />
      {children}
      <div className="flex flex-col items-center gap-2">
        <MoonPhase pct={pct} className="size-14" />
        <span className="font-heading text-[11px] tracking-wide opacity-70">
          {complete
            ? "Full moon · complete"
            : pct === 0
              ? "New moon"
              : `${pct}% · waxing`}
        </span>
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
  const focusEnabled = useFocusTimerEnabled();
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
            {focusEnabled && (
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
            )}
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
  const focusEnabled = useFocusTimerEnabled();

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-2xl bg-white py-2.5 pl-3 pr-2.5 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Edit ${name}`}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="tile-pink grid size-11 shrink-0 place-items-center rounded-xl text-[#4f1506]">
          <Motif id={icon || TIME_MOTIF[timeOfDay]} className="size-6" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "font-heading text-base leading-tight",
              done ? "text-black/40 line-through decoration-black/30" : "text-[#201b2f]",
            )}
          >
            {name}
          </span>
          {showFrequency && (
            <span className="font-heading text-[10px] tracking-wide text-[#928e9d]">
              {frequencyLabel}
            </span>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? `Mark ${name} not done today` : `Mark ${name} done today`}
        className="btn-pink grid size-11 shrink-0 place-items-center rounded-xl text-[#201b2f] transition-transform hover:-translate-y-0.5"
      >
        <Check className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/**
 * Compact goal card for the phone grid: motif, title and progress only, so two
 * fit across a narrow screen without the title or the buttons crowding each other.
 */
export function GoalCardCompact({
  goal,
  onOpen,
  onFocus,
  onComplete,
  dragHandle,
}: {
  goal: HomeGoal;
  onOpen?: () => void;
  onFocus?: () => void;
  onComplete?: () => void;
  dragHandle?: ReactNode;
}) {
  const accent = accentOf(goal);
  const progress = goalProgress(goal);
  const next = progress.nextStep;
  const focusEnabled = useFocusTimerEnabled();

  return (
    <div className="flex h-full flex-col gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      {dragHandle}
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col gap-2.5 text-left"
      >
        {/* Lock-up: moon progress stands in for the icon */}
        <div className="flex items-center gap-1.5 text-[#201b2f]">
          <MoonPhase pct={progress.pct} className={cn("size-7 shrink-0", accent.text)} />
          <span className="font-heading text-[9px] tracking-[0.12em] text-[#928e9d]">
            {progress.complete ? "Done" : `${progress.pct}%`}
          </span>
        </div>

        {/* Goal title — the hero */}
        <p className="line-clamp-3 font-display text-base leading-[1.14] text-[#201b2f]">
          {goal.title}
        </p>

        {/* Next step — secondary */}
        {!progress.complete && next && (
          <p className="line-clamp-2 text-[11px] leading-tight text-[#201b2f]/70">
            <span className="font-heading text-[9px] tracking-wide text-[#928e9d]">
              Next ·{" "}
            </span>
            <span className="font-serif italic">{next.title}</span>
          </p>
        )}
      </button>

      {!progress.complete && next && (
        <button
          type="button"
          onClick={onComplete}
          aria-label={`Mark ${next.title} complete`}
          className="btn-pink mt-auto grid w-full place-items-center rounded-2xl py-3 text-[#201b2f] shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Check className="size-5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
