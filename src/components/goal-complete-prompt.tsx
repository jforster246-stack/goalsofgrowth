import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { createWin } from "@/lib/wins.functions";

export type CompletedGoal = { id: string; title: string };

/** sessionStorage flag telling the goal page to focus its add-step box. */
export const FOCUS_ADD_STEP_KEY = "gog-focus-add-step";

/**
 * Shown when the last remaining step of a goal is ticked.
 * "Yes" → saves the goal as a win. "Not yet" → goes to the goal page
 * with the add-step box focused.
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

  return (
    <AnimatePresence>
      {goal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Goal completion prompt"
        >
          <motion.div
            initial={{ scale: 0.9, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="w-full max-w-sm rounded-3xl bg-background p-6 text-center shadow-xl"
          >
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-2xl text-primary">
              ✓
            </div>
            <h2 className="mt-4 font-heading text-lg text-focus">
              Every step is done
            </h2>
            <p className="mt-2 font-serif text-sm text-black/70">
              Have you completed “{goal.title}”?
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={winMutation.isPending}
                onClick={() => winMutation.mutate(goal.title)}
                className="w-full rounded-2xl bg-primary py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {winMutation.isPending ? "Saving…" : "Yes, I did it!"}
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(FOCUS_ADD_STEP_KEY, goal.id);
                  navigate({
                    to: "/goals/$goalId",
                    params: { goalId: goal.id },
                  });
                }}
                className="w-full rounded-2xl bg-focus py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-focus/90"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
