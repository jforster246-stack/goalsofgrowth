import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Repeat, Target, Timer, Trophy } from "lucide-react";
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

  const close = () => setOpen(false);

  const items: { label: string; Icon: typeof Plus; onClick: () => void }[] = [
    { label: "Goal", Icon: Target, onClick: () => navigate({ to: "/goals/new" }) },
    {
      label: "Habit",
      Icon: Repeat,
      onClick: () => navigate({ to: "/habits", search: { new: true } }),
    },
    { label: "Focus session", Icon: Timer, onClick: () => openFocus() },
    {
      label: "Win",
      Icon: Trophy,
      onClick: () => navigate({ to: "/wins", search: { new: true } }),
    },
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

      <div className="fixed bottom-24 right-5 z-30 flex flex-col items-end gap-3 lg:bottom-8 lg:right-8">
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
    </>
  );
}
