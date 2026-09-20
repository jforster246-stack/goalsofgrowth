import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
  queryOptions,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  addStep,
  claimUnownedGoals,
  createGoal,
  deleteGoal,
  deleteStep,
  getProfile,
  listGoals,
  toggleStep,
  updateDisplayName,
  updateGoal,
  updateStep,
} from "@/lib/goals.functions";

const goalsQueryOptions = queryOptions({
  queryKey: ["goals"],
  queryFn: () => listGoals(),
});

const profileQueryOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: () => getProfile(),
});

type GoalWithSteps = Awaited<ReturnType<typeof listGoals>>[number];

const ACCENT_STYLES = {
  mint: { dot: "bg-mint", bar: "bg-mint", check: "fill-mint" },
  sea: { dot: "bg-sea", bar: "bg-sea", check: "fill-sea" },
  clay: { dot: "bg-clay", bar: "bg-clay", check: "fill-clay" },
} as const;

// Four-pointed diamond (sparkle) used for step checkboxes.
const DIAMOND_PATH =
  "M12 2.5c.55 4.35 3.1 6.9 7.5 7.5-4.4.6-6.95 3.15-7.5 7.5-.55-4.35-3.1-6.9-7.5-7.5 4.4-.6 6.95-3.15 7.5-7.5Z";

// Six-pointed star with a hollow centre, used for the scattered background.
// Even-odd fill punches the donut hole out of the middle.
const STAR_PATH =
  "M12 0.5 14.1 8.36 21.96 6.25 16.2 12 21.96 17.75 14.1 15.64 12 23.5 9.9 15.64 2.04 17.75 7.8 12 2.04 6.25 9.9 8.36Z M12 9.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z";

const SCATTERED_STARS = [
  { top: "6%", left: "8%", size: 14, delay: "0s", base: 0.55 },
  { top: "12%", left: "84%", size: 18, delay: "0.8s", base: 0.5 },
  { top: "22%", left: "58%", size: 11, delay: "1.6s", base: 0.45 },
  { top: "31%", left: "12%", size: 16, delay: "2.2s", base: 0.4 },
  { top: "44%", left: "90%", size: 12, delay: "0.4s", base: 0.5 },
  { top: "52%", left: "4%", size: 15, delay: "1.2s", base: 0.45 },
  { top: "63%", left: "76%", size: 17, delay: "2.8s", base: 0.4 },
  { top: "71%", left: "18%", size: 11, delay: "1.9s", base: 0.45 },
  { top: "82%", left: "66%", size: 14, delay: "0.6s", base: 0.5 },
  { top: "88%", left: "38%", size: 12, delay: "2.5s", base: 0.4 },
  { top: "16%", left: "32%", size: 9, delay: "3.1s", base: 0.45 },
  { top: "68%", left: "45%", size: 10, delay: "1.4s", base: 0.4 },
] as const;

function StarField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {SCATTERED_STARS.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute fill-star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.base,
            ["--tw-base" as string]: s.base,
            animation: `twinkle 3.6s ease-in-out ${s.delay} infinite`,
          }}
        >
          <path d={STAR_PATH} fillRule="evenodd" />
        </svg>
      ))}
    </div>
  );
}

type Accent = keyof typeof ACCENT_STYLES;

export const Route = createFileRoute("/_authenticated/goals")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(goalsQueryOptions),
  head: () => ({
    meta: [
      { title: "Your goals — Hatch" },
      {
        name: "description",
        content:
          "Your private goals in Hatch: create goals, break them into small steps, and check them off.",
      },
      { property: "og:title", content: "Your goals — Hatch" },
      {
        property: "og:description",
        content: "Your private goals, one small step at a time.",
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
  component: GoalsPage,
});

function GoalsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: goals } = useSuspenseQuery(goalsQueryOptions);
  const { data: profile } = useQuery(profileQueryOptions);

  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [stepDrafts, setStepDrafts] = useState<Record<string, string>>({});
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [focusOpen, setFocusOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
      .catch(() => {});
  }, []);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["goals"] });

  // Adopt goals created before sign-in existed (no-op after the first account).
  const claimed = useRef(false);
  useEffect(() => {
    if (claimed.current) return;
    claimed.current = true;
    claimUnownedGoals()
      .then((r) => {
        if (r.claimed > 0) invalidate();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createGoalMutation = useMutation({
    mutationFn: (input: { title: string }) => createGoal({ data: input }),
    onSuccess: () => {
      setNewGoalTitle("");
      setShowNewGoal(false);
      invalidate();
    },
  });
  const updateGoalMutation = useMutation({
    mutationFn: (input: { id: string; title: string }) =>
      updateGoal({ data: input }),
    onSuccess: invalidate,
  });
  const deleteGoalMutation = useMutation({
    mutationFn: (input: { id: string }) => deleteGoal({ data: input }),
    onSuccess: invalidate,
  });
  const addStepMutation = useMutation({
    mutationFn: (input: { goalId: string; title: string }) =>
      addStep({ data: input }),
    onSuccess: invalidate,
  });
  const updateStepMutation = useMutation({
    mutationFn: (input: { id: string; title: string }) =>
      updateStep({ data: input }),
    onSuccess: invalidate,
  });
  const toggleStepMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleStep({ data: input }),
    onSuccess: invalidate,
  });
  const deleteStepMutation = useMutation({
    mutationFn: (input: { id: string }) => deleteStep({ data: input }),
    onSuccess: invalidate,
  });
  const nameMutation = useMutation({
    mutationFn: (input: { displayName: string }) =>
      updateDisplayName({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const submitNewGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newGoalTitle.trim();
    if (!title || createGoalMutation.isPending) return;
    createGoalMutation.mutate({ title });
  };

  const submitStep = (goalId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    const title = (stepDrafts[goalId] ?? "").trim();
    if (!title || addStepMutation.isPending) return;
    addStepMutation.mutate({ goalId, title });
    setStepDrafts((drafts) => ({ ...drafts, [goalId]: "" }));
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const saveName = () => {
    const next = nameDraft.trim();
    if (next && next !== profile?.display_name)
      nameMutation.mutate({ displayName: next });
    setEditingName(false);
  };


  return (
    <div className="relative min-h-dvh bg-background font-body text-foreground antialiased">
      <StarField />
      <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pt-6">
        <header className="flex items-center justify-between gap-3">
          <button
            onClick={() => setProfileOpen(true)}
            aria-label="Open profile"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground transition-colors hover:bg-muted/70"
          >
            {(profile?.display_name?.trim()?.[0] ?? "?").toUpperCase()}
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center font-display text-[30px] font-normal leading-tight tracking-tight">
            {profile?.display_name
              ? `${profile.display_name}'s goals`
              : "Your goals"}
          </h1>
          <button
            onClick={() => setShowNewGoal(true)}
            aria-label="New goal"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </header>

        <p className="mt-2 text-center text-sm italic text-muted-foreground">
          “I am a vibrational match to all that I desire”
        </p>

        {showNewGoal && (
          <form
            onSubmit={submitNewGoal}
            className="mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border [animation:rise_0.3s_both]"
          >
            <input
              autoFocus
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              maxLength={140}
              className="w-full bg-transparent text-base placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={!newGoalTitle.trim() || createGoalMutation.isPending}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                Add goal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewGoal(false);
                  setNewGoalTitle("");
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {goals.length === 0 && !showNewGoal ? (
          <div className="mt-5 rounded-2xl bg-card p-8 text-center shadow-sm ring-1 ring-border [animation:rise_0.4s_both]">
            <p className="text-base font-semibold">No goals yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the + button up top to add your first one.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {goals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                draft={stepDrafts[goal.id] ?? ""}
                onDraftChange={(value) =>
                  setStepDrafts((drafts) => ({ ...drafts, [goal.id]: value }))
                }
                onSubmitStep={submitStep(goal.id)}
                onToggle={(id, done) => toggleStepMutation.mutate({ id, done })}
                onEditStep={(id, title) =>
                  updateStepMutation.mutate({ id, title })
                }
                onDeleteStep={(id) => deleteStepMutation.mutate({ id })}
                onEditGoal={(title) =>
                  updateGoalMutation.mutate({ id: goal.id, title })
                }
                onDeleteGoal={() => deleteGoalMutation.mutate({ id: goal.id })}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Fixed bottom focus bar — thumb reach */}
        <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pb-5 pt-8">
          <div className="mx-auto flex max-w-md">
            <button
              onClick={() => setFocusOpen(true)}
              aria-label="Open focus mode"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-focus py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-focus/90"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              Focus
            </button>
          </div>
        </div>

        {focusOpen && (
          <FocusMode
            goals={goals}
            onClose={() => setFocusOpen(false)}
            onCompleteStep={(stepId) =>
              toggleStepMutation.mutate({ id: stepId, done: true })
            }
          />
        )}

        {profileOpen && (
          <ProfileSheet
            profile={profile ?? null}
            email={email}
            editingName={editingName}
            nameDraft={nameDraft}
            onNameDraftChange={setNameDraft}
            onStartEdit={() => {
              setNameDraft(profile?.display_name ?? "");
              setEditingName(true);
            }}
            onEndEdit={() => setEditingName(false)}
            onSaveName={saveName}
            onSignOut={handleSignOut}
            onClose={() => setProfileOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  draft,
  onDraftChange,
  onSubmitStep,
  onToggle,
  onEditStep,
  onDeleteStep,
  onEditGoal,
  onDeleteGoal,
  index,
}: {
  goal: GoalWithSteps;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmitStep: (e: React.FormEvent) => void;
  onToggle: (id: string, done: boolean) => void;
  onEditStep: (id: string, title: string) => void;
  onDeleteStep: (id: string) => void;
  onEditGoal: (title: string) => void;
  onDeleteGoal: () => void;
  index: number;
}) {
  const accent =
    ACCENT_STYLES[(goal.accent as Accent) ?? "mint"] ?? ACCENT_STYLES.mint;
  const total = goal.steps.length;
  const done = goal.steps.filter((s) => s.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(goal.title);

  const saveGoalTitle = () => {
    const title = goalDraft.trim();
    if (title && title !== goal.title) onEditGoal(title);
    else setGoalDraft(goal.title);
    setEditingGoal(false);
  };

  return (
    <article
      className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
      style={{ animation: `rise 0.35s ${index * 0.05}s both` }}
    >
      <div className="flex items-center gap-3">
        <span className={`size-2.5 shrink-0 rounded-full ${accent.dot}`} />
        {editingGoal ? (
          <input
            autoFocus
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
            onBlur={saveGoalTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveGoalTitle();
              if (e.key === "Escape") {
                setGoalDraft(goal.title);
                setEditingGoal(false);
              }
            }}
            maxLength={140}
            aria-label={`Edit goal: ${goal.title}`}
            className="min-w-0 flex-1 rounded-lg bg-muted/60 px-2 py-1 text-[15px] font-semibold tracking-tight focus:outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">
            {goal.title}
          </h3>
        )}
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {done}/{total}
        </span>
        <button
          onClick={() => {
            setGoalDraft(goal.title);
            setEditingGoal((v) => !v);
          }}
          aria-label={`Edit goal: ${goal.title}`}
          className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
        <button
          onClick={onDeleteGoal}
          aria-label={`Delete goal: ${goal.title}`}
          className="grid size-7 shrink-0 place-items-center rounded-full text-sm text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          ×
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${accent.bar} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 space-y-1">
        {goal.steps.map((step) => (
          <div
            key={step.id}
            className="group flex items-center gap-3 rounded-xl px-1 py-1.5"
          >
            <button
              onClick={() => onToggle(step.id, !step.done)}
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
              onSave={(title) => onEditStep(step.id, title)}
            />
            <button
              onClick={() => onDeleteStep(step.id)}
              aria-label={`Delete step: ${step.title}`}
              className="grid size-7 shrink-0 place-items-center rounded-full text-sm text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}

        <form onSubmit={onSubmitStep} className="flex items-center gap-2 pt-1">
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Add a step…"
            maxLength={240}
            className="min-w-0 flex-1 rounded-xl bg-muted/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="shrink-0 rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 disabled:opacity-40"
          >
            Add
          </button>
        </form>
      </div>
    </article>
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

type ProfileInfo = { id: string; display_name: string | null } | null;

function ProfileSheet({
  profile,
  email,
  editingName,
  nameDraft,
  onNameDraftChange,
  onStartEdit,
  onEndEdit,
  onSaveName,
  onSignOut,
  onClose,
}: {
  profile: ProfileInfo;
  email: string | null;
  editingName: boolean;
  nameDraft: string;
  onNameDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onSaveName: () => void;
  onSignOut: () => void;
  onClose: () => void;
}) {
  const initial = (profile?.display_name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-background [animation:rise_0.25s_both]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="grid size-9 place-items-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="mt-10 flex flex-col items-center text-center">
          <div className="grid size-20 place-items-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
            {initial}
          </div>

          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => onNameDraftChange(e.target.value)}
              onBlur={onSaveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveName();
                if (e.key === "Escape") onEndEdit();
              }}
              maxLength={60}
              aria-label="Edit your name"
              className="mt-4 w-full rounded-lg bg-muted/60 px-2 py-1 text-center font-display text-[28px] font-normal tracking-tight focus:outline-none focus:ring-1 focus:ring-ring"
            />
          ) : (
            <button
              onClick={onStartEdit}
              aria-label="Edit your name"
              className="mt-4 font-display text-[28px] font-normal tracking-tight"
            >
              {profile?.display_name || "Set your name"}
            </button>
          )}

          {email && (
            <p className="mt-1 text-sm text-muted-foreground">{email}</p>
          )}
          {!editingName && (
            <button
              onClick={onStartEdit}
              className="mt-2 text-xs font-medium text-muted-foreground underline underline-offset-4"
            >
              edit name
            </button>
          )}
        </div>

        <div className="mt-auto pt-8">
          <button
            onClick={onSignOut}
            className="w-full rounded-2xl bg-muted py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

type FocusTarget = {
  goalTitle: string;
  stepTitle: string;
  stepId: string;
};

const FOCUS_MINUTES = 25;

function FocusMode({
  goals,
  onClose,
  onCompleteStep,
}: {
  goals: GoalWithSteps[];
  onClose: () => void;
  onCompleteStep: (stepId: string) => void;
}) {
  const [target, setTarget] = useState<FocusTarget | null>(null);

  // Next undone step for each goal
  const nextSteps = goals
    .map((goal) => {
      const step = goal.steps.find((s) => !s.done);
      return step
        ? {
            goalTitle: goal.title,
            stepTitle: step.title,
            stepId: step.id,
          }
        : null;
    })
    .filter((t): t is FocusTarget => t !== null);

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-background [animation:rise_0.25s_both]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-6">
        {target ? (
          <FocusSession
            key={target.stepTitle}
            target={target}
            onComplete={() => {
              onCompleteStep(target.stepId);
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
                    key={`${t.goalTitle}-${t.stepTitle}`}
                    onClick={() => setTarget(t)}
                    className="w-full rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border transition-colors hover:bg-muted/40"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t.goalTitle}
                    </p>
                    <p className="mt-1 text-[15px] font-semibold tracking-tight">
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
