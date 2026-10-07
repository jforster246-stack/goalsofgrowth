import { useState } from "react";
import { Brain, ListChecks, Plus, Repeat, Target, Timer, Trophy } from "lucide-react";
import { useAppShell } from "@/components/app-shell";
import { HabitFormModal } from "@/components/habit-form-modal";
import { WinFormModal } from "@/components/win-form-modal";
import {
  BrainDumpQuickModal,
  GoalFormModal,
  RoutineFormModal,
} from "@/components/create-modals";
import { cn } from "@/lib/utils";

type Create = "goal" | "habit" | "routine" | "braindump" | "win";

/**
 * The "+" add button shown top-right in the header. Expands into a dropdown of
 * things you can create; each opens its create flow as a popup in place.
 */
export function AddMenu() {
  const { openFocus } = useAppShell();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState<Create | null>(null);

  const close = () => setOpen(false);
  const dismiss = () => setCreating(null);

  const items: { label: string; Icon: typeof Plus; onClick: () => void }[] = [
    { label: "Goal", Icon: Target, onClick: () => setCreating("goal") },
    { label: "Habit", Icon: Repeat, onClick: () => setCreating("habit") },
    { label: "Routine", Icon: ListChecks, onClick: () => setCreating("routine") },
    { label: "Brain dump", Icon: Brain, onClick: () => setCreating("braindump") },
    { label: "Focus session", Icon: Timer, onClick: () => openFocus() },
    { label: "Win", Icon: Trophy, onClick: () => setCreating("win") },
  ];

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close add menu" : "Add something"}
          aria-expanded={open}
          className={cn(
            "grid size-10 place-items-center rounded-full bg-olive text-white shadow-sm ring-1 ring-black/5 transition-transform",
            open && "rotate-45",
          )}
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>

        {open && (
          <>
            {/* Tap-away overlay */}
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="fixed inset-0 z-30 [animation:fade_0.15s_both]"
            />
            <div className="absolute right-0 top-full z-40 mt-2 flex w-48 flex-col gap-0.5 rounded-2xl bg-card p-2 shadow-xl ring-1 ring-border [animation:rise_0.15s_both]">
              {items.map(({ label, Icon, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    close();
                    onClick();
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/60"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage/15 text-olive">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <span className="font-heading text-xs uppercase tracking-wide text-foreground">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create flows — each pops up in place instead of navigating. */}
      {creating === "goal" && <GoalFormModal onClose={dismiss} />}
      {creating === "habit" && <HabitFormModal onClose={dismiss} />}
      {creating === "routine" && <RoutineFormModal onClose={dismiss} />}
      {creating === "braindump" && <BrainDumpQuickModal onClose={dismiss} />}
      {creating === "win" && <WinFormModal onClose={dismiss} />}
    </>
  );
}
