import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Armchair,
  Brain,
  ListChecks,
  Plus,
  Repeat,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { useAppShell } from "@/components/app-shell-context";
import { HabitFormModal } from "@/components/habit-form-modal";
import { WinFormModal } from "@/components/win-form-modal";
import {
  BrainDumpQuickModal,
  GoalFormModal,
  RoutineFormModal,
} from "@/components/create-modals";
import { AwaLogModal, type AwaHobby } from "@/components/awa-log-modal";
import { awaHobbiesQueryOptions } from "@/lib/goal-queries";
import { cn } from "@/lib/utils";

type Create = "goal" | "habit" | "routine" | "braindump" | "win" | "hobbylog";

/**
 * The "+" add button. In the header on desktop; a floating bottom-right button
 * on mobile (`floating`). Expands into a dropdown of things you can create or
 * log, each opening its flow as a popup in place.
 */
export function AddMenu({ floating = false }: { floating?: boolean }) {
  const { openFocus } = useAppShell();
  const navigate = useNavigate();
  const { data: hobbies } = useQuery(awaHobbiesQueryOptions);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState<Create | null>(null);

  const close = () => setOpen(false);
  const dismiss = () => setCreating(null);

  const hobbyList = ((hobbies ?? []) as AwaHobby[]).filter((h) => !h.archived_at);

  const items: { label: string; Icon: typeof Plus; onClick: () => void }[] = [
    { label: "Hobby log", Icon: Armchair, onClick: () => setCreating("hobbylog") },
    { label: "Goal", Icon: Target, onClick: () => setCreating("goal") },
    { label: "Habit", Icon: Repeat, onClick: () => setCreating("habit") },
    { label: "Routine", Icon: ListChecks, onClick: () => setCreating("routine") },
    { label: "Brain dump", Icon: Brain, onClick: () => setCreating("braindump") },
    { label: "Focus session", Icon: Timer, onClick: () => openFocus() },
    { label: "Win", Icon: Trophy, onClick: () => setCreating("win") },
  ];

  return (
    <>
      <div
        className={cn(
          "relative",
          floating && "fixed bottom-24 right-5 z-30 lg:hidden",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close add menu" : "Add something"}
          aria-expanded={open}
          className={cn(
            "grid place-items-center rounded-full bg-olive text-white ring-1 ring-black/5 transition-transform",
            floating ? "size-14 shadow-lg" : "size-10 shadow-sm",
            open && "rotate-45",
          )}
        >
          <Plus className={floating ? "size-6" : "size-5"} strokeWidth={2.5} />
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
            <div
              className={cn(
                "absolute right-0 z-40 flex w-48 flex-col gap-0.5 rounded-2xl bg-card p-2 shadow-xl ring-1 ring-border [animation:rise_0.15s_both]",
                floating ? "bottom-full mb-2" : "top-full mt-2",
              )}
            >
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

      {/* Create / log flows — each pops up in place instead of navigating. */}
      {creating === "hobbylog" && (
        <AwaLogModal
          hobbies={hobbyList}
          onAddHobby={() => {
            dismiss();
            navigate({ to: "/awa" });
          }}
          onClose={dismiss}
        />
      )}
      {creating === "goal" && <GoalFormModal onClose={dismiss} />}
      {creating === "habit" && <HabitFormModal onClose={dismiss} />}
      {creating === "routine" && <RoutineFormModal onClose={dismiss} />}
      {creating === "braindump" && <BrainDumpQuickModal onClose={dismiss} />}
      {creating === "win" && <WinFormModal onClose={dismiss} />}
    </>
  );
}
