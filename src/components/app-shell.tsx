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
import {
  Brain,
  Check,
  House,
  ListChecks,
  Repeat,
  Settings,
  Target,
  Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTheme, setTheme, THEMES, type ThemeId } from "@/lib/theme";
import { cn } from "@/lib/utils";
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
    <div className="relative min-h-dvh bg-background font-body text-foreground antialiased lg:pl-60">
      <Sidebar onOpenSettings={() => setProfileOpen(true)} />
      <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pt-6 md:max-w-3xl lg:max-w-5xl lg:pb-12">
        <header className="flex items-center justify-between gap-2">
          <div className="size-10 shrink-0">
            {backTo ? (
              <button
                type="button"
                aria-label="Back"
                onClick={() => {
                  if (window.history.length > 1) router.history.back();
                  else navigate({ to: backTo });
                }}
                className="grid size-10 place-items-center rounded-full bg-focus text-white shadow-md transition-colors hover:bg-focus/90"
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
            ) : hideSettings ? null : (
              <button
                onClick={() => setProfileOpen(true)}
                aria-label="Open settings"
                className="grid size-10 place-items-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-muted lg:hidden"
              >
                <Settings className="size-4" strokeWidth={2} />
              </button>
            )}
          </div>

          {title ? (
            <h1 className="min-w-0 flex-1 truncate text-center font-heading text-lg tracking-tight">
              {title}
            </h1>
          ) : (
            <h1 className="min-w-0 flex-1 text-center font-display text-2xl font-normal leading-[1.15] tracking-tight md:text-left md:text-3xl">
              <span className="block truncate md:inline">
                {profile?.display_name ? `${profile.display_name}'s ` : "Your "}
              </span>
              <span className="block truncate md:inline">Goals of Growth</span>
            </h1>
          )}

          <div className="flex shrink-0 items-center justify-end">
            {right ?? <div className="size-10" />}
          </div>
        </header>

        {!title && (
          <p className="mt-2 text-center text-sm italic text-muted-foreground md:text-left">
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

/** Desktop-only left rail: app identity, primary nav, and settings. */
function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-card px-4 py-7 lg:flex">
      <p className="px-2 font-display text-[26px] leading-tight text-foreground">
        Goals of Growth
      </p>

      <nav className="mt-9 flex flex-col gap-1.5">
        <SideLink to="/overview" icon={House} label="Home" />
        <SideLink to="/goals" icon={Target} label="Goals" />
        <SideLink to="/habits" icon={Repeat} label="Habits" />
        <SideLink to="/braindump" icon={Brain} label="Brain dump" />
        <SideLink to="/routines" icon={ListChecks} label="Routines" />
        <SideLink to="/wins" icon={Trophy} label="Wins" />
      </nav>

      <button
        type="button"
        onClick={onOpenSettings}
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 font-heading text-sm uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/50"
      >
        <Settings className="size-5" strokeWidth={2} />
        Settings
      </button>
    </aside>
  );
}

function SideLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof House;
  label: string;
}) {
  const base =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 font-heading text-sm uppercase tracking-wide transition-colors";
  return (
    <Link
      to={to}
      className={`${base} text-muted-foreground hover:bg-muted/50`}
      activeProps={{ className: `${base} bg-olive text-white` }}
    >
      <Icon className="size-5" strokeWidth={2} />
      {label}
    </Link>
  );
}

function BottomNav() {
  const itemClass =
    "flex flex-1 flex-col items-center justify-center gap-1 py-3.5 text-[11px] font-semibold uppercase tracking-wide transition-colors";

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pb-4 pt-8 lg:hidden">
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
        <Link
          to="/braindump"
          className={`${itemClass} text-muted-foreground`}
          activeProps={{ className: `${itemClass} text-foreground` }}
        >
          <Brain className="size-5" strokeWidth={2} />
          Brain
        </Link>
        <Link
          to="/routines"
          className={`${itemClass} text-muted-foreground`}
          activeProps={{ className: `${itemClass} text-foreground` }}
        >
          <ListChecks className="size-5" strokeWidth={2} />
          Routines
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
  const [theme, setThemeState] = useState<ThemeId>(() => getTheme());
  const chooseTheme = (id: ThemeId) => {
    setTheme(id);
    setThemeState(id);
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background [animation:rise_0.25s_both]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-5 pb-8 pt-6">
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

        <div className="mt-10">
          <p className="font-heading text-sm uppercase tracking-wide text-olive">
            Appearance
          </p>
          <div className="mt-3 space-y-2">
            {THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseTheme(t.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 transition-colors",
                    active ? "ring-olive" : "ring-border hover:bg-muted/50",
                  )}
                >
                  <span className="flex shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
                    {t.swatches.map((c, i) => (
                      <span
                        key={i}
                        className="size-6"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-sm text-foreground">
                      {t.label}
                    </span>
                    <span className="block truncate font-serif text-xs text-muted-foreground">
                      {t.blurb}
                    </span>
                  </span>
                  {active && (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-olive text-white">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 pt-2">
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
