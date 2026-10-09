import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Armchair,
  Brain,
  Check,
  Ellipsis,
  Frame,
  House,
  ListChecks,
  NotebookPen,
  Repeat,
  Settings,
  Target,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTheme, setTheme, THEMES, type ThemeId } from "@/lib/theme";
import { FONTS, getFont, setFont, type FontStyle } from "@/lib/font";
import { cn } from "@/lib/utils";
import { localToday } from "@/components/goal-ui";
import { quoteOfTheDay } from "@/lib/quotes";
import { FocusMode } from "@/components/focus-mode";
import { AddMenu } from "@/components/add-fab";
import { StampPill } from "@/components/stamp-pill";
import { Confetti } from "@/components/confetti";
import { goalsQueryOptions, profileQueryOptions } from "@/lib/goal-queries";
import { toggleStep, touchStreak, updateDisplayName } from "@/lib/goals.functions";

import { AppShellContext, useAppShell, type CustomFocus } from "@/components/app-shell-context";

export { useAppShell };

export function AppShell({
  right,
  subtitle,
  backTo,
  title,
  titleLeft,
  hideSettings,
  children,
}: {
  right?: ReactNode;
  /** A short line under the page title (e.g. the habits tally). */
  subtitle?: ReactNode;
  backTo?: "/overview" | "/goals" | "/routines" | "/awa";
  title?: string;
  titleLeft?: boolean;
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
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["stamp-balance"] });
      })
      .catch(() => {});
  }, [queryClient]);

  const nameMutation = useMutation({
    mutationFn: (input: { displayName: string }) => updateDisplayName({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const toggleStepMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleStep({ data: { ...input, today: localToday() } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  const saveName = () => {
    const next = nameDraft.trim();
    if (next && next !== profile?.display_name) nameMutation.mutate({ displayName: next });
    setEditingName(false);
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="relative min-h-dvh bg-background font-body text-foreground antialiased lg:pl-64">
      <Sidebar onOpenSettings={() => setProfileOpen(true)} />
      <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pt-6 md:max-w-3xl lg:max-w-5xl lg:pb-12">
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
          {/* Header: page heading on the left, stamps + add lined up on the right. */}
          <header className="flex items-center gap-3">
            {backTo && (
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
            )}

            <div className="min-w-0 flex-1">
              {title ? (
                <>
                  <h1 className="font-heading text-2xl tracking-tight text-foreground">{title}</h1>
                  {subtitle && <div className="mt-1">{subtitle}</div>}
                </>
              ) : (
                <>
                  <h1 className="truncate font-display text-xl font-normal leading-[1.1] tracking-tight md:text-2xl">
                    {profile?.display_name ? `${profile.display_name}'s ` : "Your "}
                    Goals of Growth
                  </h1>
                  <p className="mt-1 text-sm italic text-muted-foreground">
                    "{quoteOfTheDay(localToday())}"
                  </p>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {!hideSettings && (
                <button
                  onClick={() => setProfileOpen(true)}
                  aria-label="Open settings"
                  className="grid size-10 place-items-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-muted lg:hidden"
                >
                  <Settings className="size-4" strokeWidth={2} />
                </button>
              )}
              <StampPill />
              <div className="hidden lg:block">
                <AddMenu />
              </div>
            </div>
          </header>

          {children}

          {/* Mobile: the add button floats bottom-right. */}
          <AddMenu floating />

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
        </AppShellContext.Provider>
      </div>
    </div>
  );
}

/** Desktop-only left rail: app identity, primary nav, and settings. */
function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <aside className="fixed inset-y-3 left-3 z-20 hidden w-56 flex-col rounded-3xl bg-card px-4 py-6 shadow-xl ring-1 ring-border lg:flex">
      <p className="px-2 font-display text-[26px] leading-tight text-foreground">Goals of Growth</p>

      <nav className="mt-8 flex flex-col">
        <div className="flex flex-col gap-1.5">
          <SideLink to="/overview" icon={House} label="Home" />
          <SideLink to="/gallery" icon={Frame} label="Gallery" />
        </div>

        <SideSection title="Daily">
          <SideLink to="/habits" icon={Repeat} label="Habits" />
          <SideLink to="/goals" icon={Target} label="Goals" />
          <MorningPagesLink />
        </SideSection>

        <SideSection title="Now & then">
          <SideLink to="/routines" icon={ListChecks} label="Routines" />
          <SideLink to="/braindump" icon={Brain} label="Brain dump" />
          <SideLink to="/finance" icon={Wallet} label="Finance planner" />
          <SideLink to="/awa" icon={Armchair} label="A While Away" />
        </SideSection>
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

const MORNING_PAGES_URL = "https://morning-ink.lovable.app/";

/** Morning pages lives in a separate app, so check before leaving. */
function MorningPagesLink() {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-heading text-sm uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/50"
      >
        <NotebookPen className="size-5" strokeWidth={2} />
        Morning pages
      </button>
      {asking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
          onClick={() => setAsking(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="morning-pages-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-background p-6 text-center shadow-xl [animation:rise_0.25s_both]"
          >
            <NotebookPen className="mx-auto size-8 text-olive" strokeWidth={1.75} />
            <h2
              id="morning-pages-title"
              className="mt-3 font-display text-2xl leading-tight text-black"
            >
              Open Morning pages?
            </h2>
            <p className="mt-2 font-serif text-sm text-black/55">
              This will open externally, in a new tab. Do you want to proceed?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setAsking(false)}
                className="rounded-2xl bg-black/5 py-3 font-heading text-sm uppercase text-black/60 transition-colors hover:bg-black/10"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(MORNING_PAGES_URL, "_blank", "noopener,noreferrer");
                  setAsking(false);
                }}
                className="rounded-2xl bg-olive py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** A titled group of sidebar links. */
function SideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col gap-1.5">
      <p className="px-3 pb-0.5 font-serif text-xs italic text-muted-foreground/70">{title}</p>
      {children}
    </div>
  );
}

function SideLink({ to, icon: Icon, label }: { to: string; icon: typeof House; label: string }) {
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

type NavItem = {
  to: string;
  icon: typeof House;
  label: string;
  className?: string;
};

// First five get a direct tab; the rest live behind "More".
// Gallery is hidden on phones (the stamp pill opens it instead) but stays on
// tablet and desktop.
const BOTTOM_PRIMARY: NavItem[] = [
  { to: "/overview", icon: House, label: "Home" },
  { to: "/gallery", icon: Frame, label: "Gallery", className: "max-md:hidden" },
  { to: "/habits", icon: Repeat, label: "Habits" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/routines", icon: ListChecks, label: "Routines" },
];
const BOTTOM_MORE: NavItem[] = [
  { to: "/braindump", icon: Brain, label: "Brain dump" },
  { to: "/finance", icon: Wallet, label: "Finance planner" },
  { to: "/awa", icon: Armchair, label: "A While Away" },
];

function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const itemClass =
    "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[9px] font-semibold uppercase tracking-wide transition-colors";

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-transparent px-3 pb-4 pt-8 lg:hidden">
        <nav className="mx-auto flex max-w-md items-stretch rounded-2xl bg-card px-1 shadow-lg ring-1 ring-border">
          {BOTTOM_PRIMARY.map(({ to, icon: Icon, label, className }) => (
            <Link
              key={to}
              to={to}
              className={`${itemClass} text-muted-foreground ${className ?? ""}`}
              activeProps={{ className: `${itemClass} text-foreground ${className ?? ""}` }}
            >
              <Icon className="size-5" strokeWidth={2} />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`${itemClass} text-muted-foreground`}
          >
            <Ellipsis className="size-5" strokeWidth={2} />
            More
          </button>
        </nav>
      </div>

      {moreOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 lg:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-background p-5 pb-8 shadow-xl [animation:rise_0.25s_both]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/15" />
            <p className="mb-3 px-1 font-serif text-xs italic text-muted-foreground">
              Now &amp; then
            </p>
            <div className="grid grid-cols-3 gap-3">
              {BOTTOM_MORE.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-card px-2 py-4 text-center shadow-sm ring-1 ring-border"
                  activeProps={{ className: "ring-olive" }}
                >
                  <Icon className="size-6 text-olive" strokeWidth={2} />
                  <span className="font-heading text-[10px] uppercase tracking-wide text-foreground">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
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
  const [font, setFontState] = useState<FontStyle>(() => getFont());
  const chooseFont = (id: FontStyle) => {
    setFont(id);
    setFontState(id);
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
          <p className="font-heading text-sm uppercase tracking-wide text-olive">Appearance</p>
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
                      <span key={i} className="size-6" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-sm text-foreground">{t.label}</span>
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

          <p className="mt-6 font-heading text-sm uppercase tracking-wide text-olive">Font style</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {FONTS.map((f) => {
              const active = font === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => chooseFont(f.id)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-2xl bg-card p-3 text-left ring-1 transition-colors",
                    active ? "ring-olive" : "ring-border hover:bg-muted/50",
                  )}
                >
                  <span
                    className="block text-2xl leading-none text-foreground"
                    style={{
                      fontFamily:
                        f.id === "modern"
                          ? "Inter, ui-sans-serif, system-ui, sans-serif"
                          : "'Pinyon Script', cursive",
                    }}
                  >
                    Aa
                  </span>
                  <span className="mt-2 block font-heading text-sm text-foreground">{f.label}</span>
                  <span className="mt-0.5 block font-serif text-xs text-muted-foreground">
                    {f.blurb}
                  </span>
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
