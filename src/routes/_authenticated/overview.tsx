import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Flame } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { goalProgress, localToday, STAR_PATH } from "@/components/goal-ui";
import { HabitRow, NextStepRow, type HabitTime } from "@/components/home-cards";
import {
  GoalCompletePrompt,
  type CompletedGoal,
} from "@/components/goal-complete-prompt";
import {
  goalsQueryOptions,
  habitsQueryOptions,
  profileQueryOptions,
} from "@/lib/goal-queries";
import { deleteStep, setGoalOfDay, toggleStep, updateStep } from "@/lib/goals.functions";
import { toggleHabit } from "@/lib/habits.functions";
import { frequencyLabel, isHabitDueToday } from "@/lib/habit-schedule";
import { StepActionsModal } from "@/components/step-actions-modal";
import { HabitFormModal } from "@/components/habit-form-modal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/overview")({
  loader: ({ context }) => context.queryClient.ensureQueryData(goalsQueryOptions),
  head: () => ({
    meta: [
      { title: "Overview — Goals of Growth" },
      {
        name: "description",
        content:
          "Your progress at a glance: goals completed, your goal of the day, and your sign-in streak.",
      },
      { property: "og:title", content: "Overview — Goals of Growth" },
      {
        property: "og:description",
        content: "Goals completed, goal of the day, and your day streak.",
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
      <p className="text-base text-muted-foreground">Nothing here.</p>
    </div>
  ),
  component: OverviewPage,
});

function OverviewPage() {
  const queryClient = useQueryClient();
  const { data: goals } = useSuspenseQuery(goalsQueryOptions);
  const { data: profile } = useQuery(profileQueryOptions);

  const today = localToday();

  const goalOfDay =
    profile?.goal_of_day_date === today
      ? (goals.find((g) => g.id === profile?.goal_of_day_id) ?? null)
      : null;

  // One "next step" per goal, for every goal that has a step left to do.
  // Goal-of-day (if set) is shown first.
  const upcoming = [...goals]
    .sort((a, b) =>
      a.id === goalOfDay?.id ? -1 : b.id === goalOfDay?.id ? 1 : 0,
    )
    .map((goal) => ({ goal, next: goalProgress(goal).nextStep }))
    .filter((row) => row.next);

  const chooseMutation = useMutation({
    mutationFn: (goalId: string | null) =>
      setGoalOfDay({ data: { goalId, today } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // Marks a step as done, then shows either the "nice work" popup or,
  // if that was the goal's last remaining step, the shared completion prompt.
  const [celebrating, setCelebrating] = useState<{
    goalId: string;
    completedTitle: string;
  } | null>(null);
  const [promptGoal, setPromptGoal] = useState<CompletedGoal | null>(null);

  const completeStepMutation = useMutation({
    mutationFn: (stepId: string) => toggleStep({ data: { id: stepId, done: true } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  const handleComplete = (goalId: string, stepTitle: string, stepId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    const willComplete =
      !!goal && goal.steps.every((s) => s.id === stepId || s.done);

    completeStepMutation.mutate(stepId, {
      onSuccess: () => {
        if (willComplete && goal) {
          setCelebrating(null);
          setPromptGoal({ id: goal.id, title: goal.title });
        } else {
          setPromptGoal(null);
          setCelebrating({ goalId, completedTitle: stepTitle });
        }
      },
    });
  };

  // Once the "nice work" popup is showing, look up the freshest data
  // for that goal so we can show what's next.
  const celebratingGoal = celebrating
    ? goals.find((g) => g.id === celebrating.goalId)
    : null;
  const celebratingNext = celebratingGoal
    ? goalProgress(celebratingGoal).nextStep
    : null;

  return (
    <AppShell
      right={
        <Link
          to="/wins"
          aria-label="Wins"
          className="flex size-[50px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-white shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-gold-deep" aria-hidden>
            <path d={STAR_PATH} fillRule="evenodd" />
          </svg>
          <span className="font-heading text-[8px] uppercase leading-none text-black">
            Wins
          </span>
        </Link>
      }
    >
      <div className="relative w-full pb-24 pt-2">
        {profile && (
          <StreakCard
            streak={profile.streak_count ?? 0}
            lastActive={profile.last_active_date ?? null}
            name={profile.display_name ?? null}
          />
        )}

        <div className="mt-5 border-t border-dashed border-border" />

        {/* Next steps */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What next step will you take today?
        </p>

        <div className="mt-3 space-y-2.5">
          {upcoming.length === 0 && (
            <p className="rounded-xl bg-card px-3 py-3 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
              {goals.length === 0
                ? "Add a goal to see your next steps here."
                : "You're all caught up — nice work."}
            </p>
          )}

          {upcoming.map(({ goal, next }) => (
            <NextStepCard
              key={goal.id}
              goal={goal}
              step={next!}
              onComplete={() => handleComplete(goal.id, next!.title, next!.id)}
            />
          ))}
        </div>

        <div className="mt-6 border-t border-dashed border-border" />

        {/* Habits for the current time of day */}
        <TodayHabits />

        {/* Habits missed yesterday — a gentle nudge to catch up today */}
        <MissedYesterday />

        <Link
          to="/goals"
          className="mt-6 block text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          See all goals
        </Link>
      </div>

      {/* "Nice work" popup after completing a step (when the goal isn't finished yet) */}
      {celebrating && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-card p-6 text-center shadow-xl sm:rounded-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nice work
            </p>
            <p className="mt-2 text-lg font-semibold">
              You completed: {celebrating.completedTitle}
            </p>
            {celebratingNext && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Next up for this goal
                </p>
                <p className="mt-1 text-base">{celebratingNext.title}</p>
              </>
            )}
            <button
              onClick={() => setCelebrating(null)}
              className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Shown instead of the popup above when that was the goal's last step */}
      <GoalCompletePrompt goal={promptGoal} onClose={() => setPromptGoal(null)} />
    </AppShell>
  );
}

/** Parses a YYYY-MM-DD string into a local Date (midnight). */
function parseLocal(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}
function fmtLocal(dt: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/**
 * The sign-in streak as a flame count plus the current week, so the run of
 * connected days reads at a glance: active days show a tick, the rest show
 * their date, and today is highlighted.
 */
function StreakCard({
  streak,
  lastActive,
  name,
}: {
  streak: number;
  lastActive: string | null;
  name: string | null;
}) {
  const todayStr = localToday();
  const today = parseLocal(todayStr);

  // Monday-first week containing today.
  const monday = parseLocal(todayStr);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const lastActiveDate = lastActive ? parseLocal(lastActive) : null;
  const activeStart =
    lastActiveDate && streak > 0
      ? (() => {
          const a = new Date(lastActiveDate);
          a.setDate(a.getDate() - (streak - 1));
          return a;
        })()
      : null;

  const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
  const days = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const active =
      !!activeStart &&
      !!lastActiveDate &&
      dt.getTime() >= activeStart.getTime() &&
      dt.getTime() <= lastActiveDate.getTime();
    return {
      letter: LETTERS[i]!,
      dateNum: dt.getDate(),
      isToday: fmtLocal(dt) === todayStr,
      active,
    };
  });

  return (
    <div className="mt-1 flex flex-col items-center rounded-3xl bg-white px-5 py-6 text-center shadow-sm">
      <div className="grid size-16 place-items-center rounded-full bg-clay/15">
        <Flame className="size-8 text-clay-deep" strokeWidth={2} fill="currentColor" />
      </div>
      <p className="mt-3 font-heading text-4xl leading-none text-black">{streak}</p>
      <p className="mt-1 font-heading text-sm uppercase tracking-wide text-olive">
        Day streak
      </p>
      <p className="mt-1 font-serif text-xs italic text-black/50">
        {streak > 0
          ? `You are doing really great${name ? `, ${name}` : ""}!`
          : "Check in each day to start your streak."}
      </p>

      <div className="mt-5 grid w-full grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "font-heading text-[11px] uppercase",
                d.isToday ? "text-clay-deep" : "text-black/40",
              )}
            >
              {d.letter}
            </span>
            {d.active ? (
              <span className="grid size-8 place-items-center rounded-full bg-clay-deep text-white">
                <Check className="size-4" strokeWidth={3} />
              </span>
            ) : (
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full font-mono text-xs",
                  d.isToday
                    ? "ring-2 ring-clay-deep/40 text-clay-deep"
                    : "text-black/30",
                )}
              >
                {d.dateNum}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NextStepCard({
  goal,
  step,
  onComplete,
}: {
  goal: { id: string; title: string; accent: string; steps: { id: string; title: string; done: boolean }[] };
  step: { id: string; title: string };
  onComplete: () => void;
}) {
  const { openFocus, celebrate } = useAppShell();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [habitPrefill, setHabitPrefill] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["goal"] });
  };
  const renameMutation = useMutation({
    mutationFn: (title: string) => updateStep({ data: { id: step.id, title } }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteStep({ data: { id: step.id } }),
    onSuccess: invalidate,
  });

  return (
    <>
      <NextStepRow
        goal={goal}
        step={step}
        onOpen={() => setOpen(true)}
        onStartTimer={() => openFocus(step.id)}
        onComplete={() => {
          celebrate();
          onComplete();
        }}
      />
      {open && (
        <StepActionsModal
          title={step.title}
          done={false}
          onClose={() => setOpen(false)}
          onRename={(t) => renameMutation.mutate(t)}
          onToggle={() => {
            celebrate();
            onComplete();
          }}
          onDelete={() => deleteMutation.mutate()}
          onAddAsHabit={(name) => {
            setOpen(false);
            setHabitPrefill(name);
          }}
          onGoToGoal={() =>
            navigate({ to: "/goals/$goalId", params: { goalId: goal.id } })
          }
        />
      )}
      {habitPrefill !== null && (
        <HabitFormModal
          initialName={habitPrefill}
          onClose={() => setHabitPrefill(null)}
        />
      )}
    </>
  );
}

const BUCKET_LABEL: Record<HabitTime, string> = {
  morning: "This morning",
  afternoon: "This afternoon",
  evening: "This evening",
};

/** morning 12am–12pm, afternoon 12–5pm, evening 5pm–12am. */
function currentBucket(): HabitTime {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** The local calendar day before `today` (YYYY-MM-DD). */
function yesterdayKey(today: string): string {
  const d = new Date(`${today}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Habits that were due yesterday but never ticked off, so they can be caught up
 * today. Ticking one marks it done for today, which removes it from the list.
 */
function MissedYesterday() {
  const today = localToday();
  const yKey = yesterdayKey(today);
  const yDate = new Date(`${yKey}T00:00:00`);
  const queryClient = useQueryClient();
  const { openTimer, celebrate } = useAppShell();
  const { data: yesterdayHabits } = useQuery(habitsQueryOptions(yKey));
  const { data: todayHabits } = useQuery(habitsQueryOptions(today));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries({ queryKey: ["crystals"] });
    queryClient.invalidateQueries({ queryKey: ["habit-streaks"] });
  };
  const toggle = useMutation({
    mutationFn: (id: string) => toggleHabit({ data: { id, done: true, today } }),
    onSuccess: refresh,
  });
  const complete = (id: string) => {
    celebrate();
    toggle.mutate(id);
  };

  // Done today already? Then it's caught up — no need to nag.
  const doneToday = new Set(
    (todayHabits ?? []).filter((h) => h.done).map((h) => h.id),
  );
  const missed = (yesterdayHabits ?? []).filter(
    (h) => isHabitDueToday(h, yDate) && !h.done && !doneToday.has(h.id),
  );

  if (missed.length === 0) return null;

  return (
    <section>
      <div className="mt-6 border-t border-dashed border-border" />
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Missed yesterday
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        These are the habits that you didn't complete yesterday. Can you do them
        today?
      </p>
      <div className="mt-3 space-y-2">
        {missed.map((h) => (
          <HabitRow
            key={h.id}
            name={h.name}
            timeOfDay={h.time_of_day as HabitTime}
            frequencyLabel={frequencyLabel(h)}
            done={false}
            onTimer={() =>
              openTimer({
                title: h.name,
                subtitle: "Missed yesterday",
                onComplete: () => complete(h.id),
              })
            }
            onToggle={() => complete(h.id)}
          />
        ))}
      </div>
    </section>
  );
}

/** The current time-of-day's habits, shown on Home in place of the goal list. */
function TodayHabits() {
  const today = localToday();
  const bucket = currentBucket();
  const queryClient = useQueryClient();
  const { openTimer, celebrate } = useAppShell();
  const { data: habits } = useQuery(habitsQueryOptions(today));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
    queryClient.invalidateQueries({ queryKey: ["crystals"] });
    queryClient.invalidateQueries({ queryKey: ["habit-streaks"] });
  };
  const toggle = useMutation({
    mutationFn: (id: string) => toggleHabit({ data: { id, done: true, today } }),
    onSuccess: refresh,
  });

  const complete = (id: string) => {
    celebrate();
    toggle.mutate(id);
  };

  const inBucket = (habits ?? []).filter(
    (h) => h.time_of_day === bucket && isHabitDueToday(h),
  );
  const active = inBucket.filter((h) => !h.done);

  return (
    <section>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {BUCKET_LABEL[bucket]}
      </p>
      <div className="mt-3 space-y-2">
        {active.length === 0 ? (
          <p className="rounded-xl bg-card px-3 py-3 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
            {inBucket.length === 0
              ? "No habits for this time of day yet — add one with the + button."
              : "All done for now — nice work."}
          </p>
        ) : (
          active.map((h) => (
            <HabitRow
              key={h.id}
              name={h.name}
              timeOfDay={h.time_of_day as HabitTime}
              frequencyLabel={frequencyLabel(h)}
              done={h.done}
              onTimer={() =>
                openTimer({
                  title: h.name,
                  subtitle: `${BUCKET_LABEL[bucket]} habit`,
                  onComplete: () => complete(h.id),
                })
              }
              onToggle={() => complete(h.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
