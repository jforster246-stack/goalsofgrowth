import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createWin } from "@/lib/wins.functions";

export type CompletedGoal = { id: string; title: string };

/** sessionStorage flag telling the goal page to focus its add-step box. */
export const FOCUS_ADD_STEP_KEY = "gog-focus-add-step";

/**
 * Shown when the last remaining step of a goal is ticked, from Home, the
 * goals grid, or the goal page. Two actions:
 *  - "Yes, add to my wins"  → saves the goal as a win
 *  - "Not yet — add more steps" → opens the goal with the add-step box focused
 */
export function GoalCompletePrompt({
  goal,
  onClose,
}: {
  goal: CompletedGoal | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const winMutation = useMutation({
    mutationFn: (title: string) =>
      createWin({ data: { title, kind: "achievement" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wins"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      onClose();
    },
  });

  if (!goal) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Goal completion prompt"
        className="w-full max-w-sm rounded-3xl bg-background p-6 text-center shadow-xl [animation:rise_0.25s_both]"
      >
        <p className="font-heading text-xs uppercase tracking-wide text-olive/60">
          Nice work
        </p>
        <h2 className="mt-2 font-heading text-xl leading-snug text-black">
          You completed “{goal.title}”
        </h2>
        <p className="mt-3 font-serif text-sm text-black/60">
          That was the last step. Is this goal done?
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={winMutation.isPending}
            onClick={() => winMutation.mutate(goal.title)}
            className="w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90 disabled:opacity-50"
          >
            {winMutation.isPending ? "Adding…" : "Yes, add to my wins"}
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(FOCUS_ADD_STEP_KEY, goal.id);
              navigate({ to: "/goals/$goalId", params: { goalId: goal.id } });
            }}
            className="w-full rounded-2xl bg-black/5 py-3.5 font-heading text-sm uppercase text-black/70 transition-colors hover:bg-black/10"
          >
            Not yet — add more steps
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 font-heading text-xs uppercase text-black/40 transition-colors hover:text-black/70"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
