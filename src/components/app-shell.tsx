import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { House, Repeat, Settings, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { localToday } from "@/components/goal-ui";
import { FocusMode } from "@/components/focus-mode";
import { AddFab } from "@/components/add-fab";
import { Confetti } from "@/components/confetti";
import { goalsQueryOptions, profileQueryOptions } from "@/lib/goal-queries";
import {
  toggleStep,
  touchStreak,
  updateDisplayName,
} from "@/lib/goals.functions";

type CustomFocus = {
  title: string;
  subtitle?: string;
  onComplete?: () => void;
};

const AppShellContext = createContext<{
  openFocus: (stepId?: string) => void;
  openTimer: (target: CustomFocus) => void;
  celebrate: () => void;
} | null>(null);

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) throw new Error("useAppShell must be used inside AppShell");
  return context;
}

export function AppShell({
  right,
  backTo,
  title,
  hideSettings,
  children,
}: {
  right?: ReactNode;
  backTo?: "/overview" | "/goals";
  title?: string;
  hideSettings?: boolean;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const { data: profile } = useQuery(profileQueryOptions);
  const { data: goals } = useQuery(goalsQueryOptions);

  const [profileOpen, setProfileOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusStepId, setFocusStepId] = useState<string | null>(null);
  const [customFocus, setCustomFocus] = useState<CustomFocus | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
      .catch(() => {});
  }, []);

  const touched = useRef(false);
  useEffect(() => {
    if (touched.current) return;
    touched.current = true;
    touchStreak({ data: { today: localToday() } })
      .then(() => queryClient.invalidateQueries({ queryKey: ["profile"] }))
      .catch(() => {});
  }, [queryClient]);

  const nameMutation = useMutation({
    mutationFn: (input: { displayName: string }) =>
      updateDisplayName({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const toggleStepMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleStep({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  const saveName = () => {
    const next = nameDraft.trim();
    if (next && next !== profile?.display_name)
      nameMutation.mutate({ displayName: next });
    setEditingName(false);
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="relative min-h-dvh bg-background font-body text-foreground antialiased">
      <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pt-6">
        <header className="flex items-center justify-between gap-2">
          {backTo ? (
            <button
              type="button"
              aria-label="Back"
              onClick={() => {
                if (window.history.length > 1) router.history.back();
                else navigate({ to: backTo });
              }}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-focus text-white shadow-md transition-colors hover:bg-focus/90"
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
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : hideSettings ? (
            <div className="size-10 shrink-0" />
          ) : (
            <button
              onClick={() => setProfileOpen(true)}
              aria-label="Open settings"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-muted"
            >
              <Settings className="size-4" strokeWidth={2} />
            </button>
          )}

          {title ? (
            <h1 className="min-w-0 flex-1 truncate text-center font-heading text-lg tracking-tight">
              {title}
            </h1>
          ) : (
            <h1 className="min-w-0 flex-1 text-center font-display text-2xl font-normal leading-[1.15] tracking-tight">
              <span className="block truncate">
                {profile?.display_name ? `${profile.display_name}'s` : "Your"}
              </span>
              <span className="block truncate">Goals of Growth</span>
            </h1>
          )}

          <div className="flex shrink-0 items-center justify-end">
            {right ?? <div className="size-10" />}
          </div>
        </header>

        {!title && (
          <p className="mt-2 text-center text-sm italic text-muted-foreground">
            "I am a vibrational match to all that I desire"
          </p>
        )}

        <AppShellContext.Provider
          value={{
            openFocus: (stepId) => {
              setCustomFocus(null);
              setFocusStepId(stepId ?? null);
              setFocusOpen(true);
            },
            openTimer: (target) => {
              setFocusStepId(null);
              setCustomFocus(target);
              setFocusOpen(true);
            },
            celebrate: () => setConfettiKey((k) => k + 1),
          }}
        >
          {children}
          <AddFab />
        </AppShellContext.Provider>

        <BottomNav />

        {confettiKey > 0 && <Confetti key={confettiKey} />}

        {focusOpen && (
          <FocusMode
            goals={goals ?? []}
            initialStepId={focusStepId}
            customTarget={customFocus}
            onClose={() => {
              setFocusOpen(false);
              setFocusStepId(null);
              setCustomFocus(null);
            }}
            onCompleteStep={(stepId) => {
              setConfettiKey((k) => k + 1);
              toggleStepMutation.mutate({ id: stepId, done: true });
            }}
          />
        )}

        {profileOpen && (
          <ProfileSheet
            displayName={profile?.display_name ?? null}
            streak={profile?.streak_count ?? 0}
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

function BottomNav() {
  const itemClass =
    "flex flex-1 flex-col items-center justify-center gap-1 py-3.5 text-[11px] font-semibold uppercase tracking-wide transition-colors";

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pb-4 pt-8">
      <nav className="mx-auto flex max-w-md items-stretch rounded-2xl bg-card shadow-lg ring-1 ring-border">
        <Link
          to="/overview"
          className={`${itemClass} text-muted-foreground`}
          activeProps={{ className: `${itemClass} text-foreground` }}
        >
          <House className="size-5" strokeWidth={2} />
          Home
        </Link>
        <Link
          to="/goals"
          className={`${itemClass} text-muted-foreground`}
          activeProps={{ className: `${itemClass} text-foreground` }}
        >
          <Target className="size-5" strokeWidth={2} />
          Goals
        </Link>
        <Link
          to="/habits"
          className={`${itemClass} text-muted-foreground`}
          activeProps={{ className: `${itemClass} text-foreground` }}
        >
          <Repeat className="size-5" strokeWidth={2} />
          Habits
        </Link>
      </nav>
    </div>
  );
}

function ProfileSheet({
  displayName,
  email,
  streak,
  editingName,
  nameDraft,
  onNameDraftChange,
  onStartEdit,
  onEndEdit,
  onSaveName,
  onSignOut,
  onClose,
}: {
  displayName: string | null;
  email: string | null;
  streak: number;
  editingName: boolean;
  nameDraft: string;
  onNameDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onSaveName: () => void;
  onSignOut: () => void;
  onClose: () => void;
}) {
  const initial = (displayName?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background [animation:rise_0.25s_both]">
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
              {displayName || "Set your name"}
            </button>
          )}

          {email && <p className="mt-1 text-sm text-muted-foreground">{email}</p>}
          {!editingName && (
            <button
              onClick={onStartEdit}
              className="mt-2 text-xs font-medium text-muted-foreground underline underline-offset-4"
            >
              edit name
            </button>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            {streak} day{streak === 1 ? "" : "s"} in a row
          </p>
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
