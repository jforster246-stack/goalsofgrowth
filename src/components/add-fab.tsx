import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ListChecks,
  Plus,
  Repeat,
  Target,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { useAppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

/**
 * Floating "+" that expands into a speed-dial of things you can create:
 * Goal, Habit, Routine, Focus session, Win.
 */
export function AddFab() {
  const navigate = useNavigate();
  const { openFocus } = useAppShell();
  const [open, setOpen] = useState(false);
  const [winSoon, setWinSoon] = useState(false);

  const close = () => setOpen(false);

  const items: { label: string; Icon: typeof Plus; onClick: () => void }[] = [
    { label: "Goal", Icon: Target, onClick: () => navigate({ to: "/goals/new" }) },
    {
      label: "Habit",
      Icon: Repeat,
      onClick: () => navigate({ to: "/habits", search: { new: true } }),
    },
    { label: "Routine", Icon: ListChecks, onClick: () => navigate({ to: "/routines" }) },
    { label: "Focus session", Icon: Timer, onClick: () => openFocus() },
    { label: "Win", Icon: Trophy, onClick: () => setWinSoon(true) },
  ];

  return (
    <>
      {/* Tap-away overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={close}
          className="fixed inset-0 z-20 bg-black/20 [animation:fade_0.15s_both]"
        />
      )}

      <div className="fixed bottom-24 right-5 z-30 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col-reverse items-end gap-3">
            {items.map(({ label, Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  close();
                  onClick();
                }}
                className="flex items-center gap-3 [animation:rise_0.18s_both]"
              >
                <span className="rounded-full bg-white px-3 py-1.5 font-heading text-xs uppercase text-black shadow-md">
                  {label}
                </span>
                <span className="grid size-11 place-items-center rounded-full bg-white text-olive shadow-md ring-1 ring-black/5">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close add menu" : "Add something"}
          aria-expanded={open}
          className={cn(
            "grid size-14 place-items-center rounded-full bg-olive text-white shadow-lg transition-transform",
            open && "rotate-45",
          )}
        >
          <Plus className="size-6" strokeWidth={2} />
        </button>
      </div>

      {winSoon && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-background p-6 text-center shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-gold/20 text-gold-deep">
              <Trophy className="size-7" strokeWidth={1.5} />
            </div>
            <p className="mt-4 font-display text-2xl text-black">Wins are coming</p>
            <p className="mt-2 font-serif text-sm text-black/50">
              Logging your wins isn't built yet — it's next on the list.
            </p>
            <button
              type="button"
              onClick={() => setWinSoon(false)}
              className="mt-6 w-full rounded-2xl bg-olive py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
