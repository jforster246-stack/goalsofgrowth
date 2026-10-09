import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, X } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, useAppShell } from "@/components/app-shell";
import { goalProgress, localToday } from "@/components/goal-ui";
import { Stamp } from "@/components/stamp";
import { StampMark } from "@/components/stamp-mark";
import { HabitDetailModal, type HabitFull } from "@/components/habit-detail-modal";
import { winStampStyle } from "@/components/win-form-modal";
import {
  HabitRow,
  NextStepPortrait,
  NextStepRow,
  type HabitTime,
} from "@/components/home-cards";
import {
  GoalCompletePrompt,
  type CompletedGoal,
} from "@/components/goal-complete-prompt";
import {
  checklistsQueryOptions,
  goalsQueryOptions,
  habitsQueryOptions,
  profileQueryOptions,
  winsQueryOptions,
} from "@/lib/goal-queries";
import { deleteStep, setGoalOfDay, toggleStep, updateStep } from "@/lib/goals.functions";
import { setChecklistHome } from "@/lib/checklists.functions";
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

type Win = {
  id: string;
  title: string;
  note: string | null;
  kind: string;
  achieved_on: string;
  icon: string | null;
  accent: string | null;
};

function winDateLabel(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OverviewPage() {
  const queryClient = useQueryClient();
  const { data: goals } = useSuspenseQuery(goalsQueryOptions);
  const { data: profile } = useQuery(profileQueryOptions);
  const { data: wins } = useQuery(winsQueryOptions);

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

  // A random goal's next step and a random win, both rotating once a day.
  const dayIdx = Math.floor(Date.parse(`${today}T00:00:00`) / 86_400_000);
  const randomGoal =
    upcoming.length > 0 ? upcoming[dayIdx % upcoming.length]! : null;
  const winList = (wins ?? []) as Win[];
  const randomWin =
    winList.length > 0 ? winList[dayIdx % winList.length]! : null;
  const winStyle = randomWin
    ? winStampStyle(randomWin.kind, randomWin.icon, randomWin.accent)
    : null;

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
    mutationFn: (stepId: string) =>
      toggleStep({ data: { id: stepId, done: true, today } }),
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
          setPromptGoal({ id: goal.id, title: goal.title, icon: goal.icon, accent: goal.accent });
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
    <AppShell>
      <div className="mt-6 space-y-4">
        {profile && (
          <StreakCard streak={profile.streak_count ?? 0} />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* A random goal's next step — rotates daily */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              A goal to nudge today
            </p>
            {randomGoal ? (
              <div className="mt-2">
                <NextStepCard
                  goal={randomGoal.goal}
                  step={randomGoal.next!}
                  onComplete={() =>
                    handleComplete(
                      randomGoal.goal.id,
                      randomGoal.next!.title,
                      randomGoal.next!.id,
                    )
                  }
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {goals.length === 0
                  ? "Add a goal to see a next step here."
                  : "You're all caught up — nice work."}
              </p>
            )}
          </section>

          {/* A random win — rotates daily */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              A win to remember
            </p>
            {randomWin && winStyle ? (
              <div className="mt-2 flex items-center gap-3">
                <Stamp
                  icon={winStyle.icon}
                  accent={winStyle.accent}
                  className="size-14 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-heading text-base leading-tight text-black">
                    {randomWin.title}
                  </p>
                  <p className="mt-0.5 font-serif text-xs text-black/45">
                    {winDateLabel(randomWin.achieved_on)}
                  </p>
                  {randomWin.note && (
                    <p className="mt-1 line-clamp-2 font-serif text-sm italic text-black/55">
                      {randomWin.note}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Log a win and it'll show up here to look back on.
              </p>
            )}
          </section>
        </div>

        <TodayHabits />
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

/**
 * The sign-in streak as a flame count plus the current week, so the run of
 * connected days reads at a glance: active days show a tick, the rest show
 * their date, and today is highlighted.
 */
function StreakCard({
  streak,
  className,
}: {
  streak: number;
  className?: string;
}) {
  const filled = Math.min(streak, 7);
  // Days left in the current run before the next 7-day, 5-stamp reward.
  const untilBonus = streak > 0 ? (7 - (streak % 7)) % 7 : 7;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl bg-white px-5 py-4 shadow-sm",
        className,
      )}
    >
      <span className="font-heading text-3xl leading-none text-black">{streak}</span>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: 7 }, (_, i) =>
          i < filled ? (
            <StampMark key={i} className="size-7 text-clay-deep">
              <Check className="size-3.5 text-white" strokeWidth={3} />
            </StampMark>
          ) : (
            <StampMark key={i} className="size-7 text-black/10" />
          ),
        )}
      </div>

      {streak === 0 && (
        <p className="min-w-0 flex-1 font-serif text-sm italic text-black/50">
          Check in each day to start your streak.
        </p>
      )}

      <span className="inline-flex items-center gap-1.5 rounded-full bg-clay/10 px-3 py-1.5">
        <Stamp icon={null} accent="clay" className="size-4" />
        <span className="font-heading text-[11px] uppercase text-clay-deep">
          {streak === 0
            ? "7 days in a row earns 5 stamps"
            : untilBonus === 0
              ? "You just earned 5 stamps!"
              : `${untilBonus} more day${untilBonus === 1 ? "" : "s"} for 5 stamps`}
        </span>
      </span>
    </div>
  );
}

function NextStepCard({
  goal,
  step,
  onComplete,
  portrait,
}: {
  goal: { id: string; title: string; accent: string; steps: { id: string; title: string; done: boolean }[] };
  step: { id: string; title: string };
  onComplete: () => void;
  portrait?: boolean;
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

  const complete = () => {
    celebrate();
    onComplete();
  };

  return (
    <>
      {portrait ? (
        <NextStepPortrait
          goal={goal}
          step={step}
          onOpen={() => setOpen(true)}
          onStartTimer={() => openFocus(step.id)}
          onComplete={complete}
        />
      ) : (
        <NextStepRow
          goal={goal}
          step={step}
          onOpen={() => setOpen(true)}
          onStartTimer={() => openFocus(step.id)}
          onComplete={complete}
        />
      )}
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
function MissedYesterday({ className }: { className?: string }) {
  const today = localToday();
  const yKey = yesterdayKey(today);
  const yDate = new Date(`${yKey}T00:00:00`);
  const queryClient = useQueryClient();
  const { openTimer, celebrate } = useAppShell();
  const { data: yesterdayHabits } = useQuery(habitsQueryOptions(yKey));
  const { data: todayHabits } = useQuery(habitsQueryOptions(today));
  const [selected, setSelected] = useState<HabitFull | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
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

  // Nothing missed — don't show the card at all.
  if (missed.length === 0) return null;

  return (
    <section className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Missed yesterday
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {missed.length === 0
          ? "Nothing missed — you're all caught up."
          : "Habits you didn't complete yesterday. Can you do them today?"}
      </p>
      <div className="mt-3 space-y-2">
        {missed.map((h) => (
          <HabitRow
            key={h.id}
            name={h.name}
            timeOfDay={h.time_of_day as HabitTime}
            frequencyLabel={frequencyLabel(h)}
            icon={h.icon}
            done={false}
            onOpen={() =>
              setSelected({ ...h, time_of_day: h.time_of_day as HabitTime })
            }
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
      {selected && (
        <HabitDetailModal habit={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

type RoutineLite = {
  id: string;
  title: string;
  icon: string | null;
  on_home: boolean;
  items: { done: boolean }[];
};

/**
 * Home "Routines" section: up to three routines the user has chosen to keep on
 * the home page, each linking to the full routine. "Choose" opens a picker.
 */
function RoutinesHome({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const { data: lists } = useQuery(checklistsQueryOptions);
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setHome = useMutation({
    mutationFn: (v: { id: string; onHome: boolean }) =>
      setChecklistHome({ data: v }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Something went wrong."),
  });

  const all = (lists ?? []) as RoutineLite[];
  const pinned = all.filter((l) => l.on_home).slice(0, 3);

  // Nothing to pin until there's at least one routine.
  if (all.length === 0) return null;

  return (
    <section className={cn("rounded-3xl bg-white p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Routines
        </p>
        <button
          type="button"
          onClick={() => setChoosing(true)}
          className="font-heading text-[11px] uppercase text-olive transition-opacity hover:opacity-70"
        >
          Choose
        </button>
      </div>

      {pinned.length === 0 ? (
        <button
          type="button"
          onClick={() => setChoosing(true)}
          className="mt-3 w-full rounded-xl border border-dashed border-border bg-card/50 px-4 py-4 text-left font-serif text-sm text-muted-foreground transition-colors hover:bg-card"
        >
          Pick up to 3 routines to keep on your home page.
        </button>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {pinned.map((l) => (
            <HomeRoutineCard key={l.id} list={l} />
          ))}
        </div>
      )}

      {choosing && (
        <RoutinePickerModal
          lists={all}
          error={error}
          pending={setHome.isPending}
          onToggle={(id, onHome) => setHome.mutate({ id, onHome })}
          onClose={() => {
            setChoosing(false);
            setError(null);
          }}
        />
      )}
    </section>
  );
}

/** A compact pinned routine, linking to its full page with a progress bar. */
function HomeRoutineCard({ list }: { list: RoutineLite }) {
  const total = list.items.length;
  const done = list.items.filter((i) => i.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link
      to="/routines/$routineId"
      params={{ routineId: list.id }}
      className="group flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2.5">
        <Stamp icon={list.icon} accent="mint" className="size-9 shrink-0" />
        <span className="min-w-0 flex-1 truncate font-heading text-sm text-black">
          {list.title}
        </span>
        <ChevronRight className="size-4 shrink-0 text-black/25 transition-colors group-hover:text-black/50" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-olive transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[11px] text-black/40">
          {done}/{total}
        </span>
      </div>
    </Link>
  );
}

/** Pick which routines (up to three) show on the home page. */
function RoutinePickerModal({
  lists,
  error,
  pending,
  onToggle,
  onClose,
}: {
  lists: RoutineLite[];
  error: string | null;
  pending: boolean;
  onToggle: (id: string, onHome: boolean) => void;
  onClose: () => void;
}) {
  const pinnedCount = lists.filter((l) => l.on_home).length;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">
            Home routines
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-2 font-serif text-sm text-black/50">
          Choose up to 3 routines to keep on your home page ({pinnedCount}/3).
        </p>
        {error && (
          <p className="mt-3 rounded-xl bg-clay-deep/10 px-3 py-2 font-serif text-sm text-clay-deep">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {lists.map((l) => {
            const atLimit = !l.on_home && pinnedCount >= 3;
            return (
              <button
                key={l.id}
                type="button"
                disabled={pending || atLimit}
                onClick={() => onToggle(l.id, !l.on_home)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm transition-colors",
                  atLimit ? "opacity-40" : "hover:bg-white/70",
                )}
              >
                <Stamp icon={l.icon} accent="mint" className="size-8 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-heading text-sm text-black">
                  {l.title}
                </span>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    l.on_home
                      ? "border-olive bg-olive text-white"
                      : "border-black/20 text-transparent",
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** The current time-of-day's habits, shown on Home in place of the goal list. */
function TodayHabits({ className }: { className?: string }) {
  const today = localToday();
  const bucket = currentBucket();
  const queryClient = useQueryClient();
  const { openTimer, celebrate } = useAppShell();
  const { data: habits } = useQuery(habitsQueryOptions(today));
  const [selected, setSelected] = useState<HabitFull | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["habits"] });
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
    <section className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {BUCKET_LABEL[bucket]}
      </p>
      <div className="mt-3 space-y-2">
        {active.length === 0 ? (
          <p className="mt-1 text-sm italic text-muted-foreground">
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
              icon={h.icon}
              done={h.done}
              onOpen={() =>
                setSelected({ ...h, time_of_day: h.time_of_day as HabitTime })
              }
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
      {selected && (
        <HabitDetailModal habit={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
