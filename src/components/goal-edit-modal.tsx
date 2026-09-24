import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { GOAL_ACCENTS, type Accent } from "@/components/goal-ui";
import { GoalHero, type HomeGoal } from "@/components/home-cards";
import { IconPicker } from "@/components/icon-picker";
import { updateGoalDetails } from "@/lib/goals.functions";
import { cn } from "@/lib/utils";

/**
 * Edits a goal's name, colour and icon in a pop-up (opened from the pencil on
 * the goal's hero card). Previews the changes live, then saves them.
 */
export function GoalEditModal({
  goal,
  onClose,
}: {
  goal: HomeGoal & { icon?: string | null };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(goal.title);
  const [accent, setAccent] = useState<string>(goal.accent);
  const [icon, setIcon] = useState<string | null>(goal.icon ?? null);

  const save = useMutation({
    mutationFn: () =>
      updateGoalDetails({
        data: {
          id: goal.id,
          title: title.trim() || goal.title,
          accent: accent as Accent,
          icon: icon ?? "",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal", goal.id] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">
            Edit goal
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Live preview */}
        <div className="mt-5">
          <GoalHero goal={{ ...goal, accent, icon }}>
            <p className="w-full break-words text-center font-heading text-2xl leading-tight text-white">
              {title.trim() || "Name this goal"}
            </p>
          </GoalHero>
        </div>

        {/* Name */}
        <label className="mt-5 block font-heading text-sm uppercase text-olive">
          Name
        </label>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={2}
          maxLength={140}
          aria-label="Goal name"
          className="mt-2 w-full resize-none rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-olive/40"
        />

        {/* Colour */}
        <p className="mt-4 font-heading text-sm uppercase text-olive">Colour</p>
        <div className="mt-2 flex gap-3">
          {GOAL_ACCENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAccent(a.key)}
              aria-label={a.label}
              aria-pressed={accent === a.key}
              className={cn(
                "grid size-11 place-items-center rounded-full text-white transition-transform",
                a.swatch,
                accent === a.key
                  ? "ring-2 ring-black/40 ring-offset-2 ring-offset-background"
                  : "",
              )}
            >
              {accent === a.key && <Check className="size-5" strokeWidth={2.5} />}
            </button>
          ))}
        </div>

        {/* Icon */}
        <p className="mt-4 font-heading text-sm uppercase text-olive">Icon</p>
        <div className="mt-2">
          <IconPicker value={icon} onChange={setIcon} defaultLabel="Star" />
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl px-5 py-3.5 font-heading text-sm uppercase text-black/50 transition-colors hover:text-black/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex-1 rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
          >
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
