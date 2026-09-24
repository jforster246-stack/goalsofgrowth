import { useState } from "react";
import { Repeat, Target, Trash2, X } from "lucide-react";

/**
 * Tapping a brain-dump item opens this: rename it, turn it into a goal or a
 * habit, or delete it.
 */
export function BrainDumpItemModal({
  text,
  onClose,
  onRename,
  onAddAsGoal,
  onAddAsHabit,
  onDelete,
}: {
  text: string;
  onClose: () => void;
  onRename: (text: string) => void;
  onAddAsGoal: (text: string) => void;
  onAddAsHabit: (text: string) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(text);
  const trimmed = value.trim();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">Idea</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          maxLength={500}
          aria-label="Idea text"
          className="mt-5 w-full resize-y rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-olive/40"
        />

        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={!trimmed}
            onClick={() => onAddAsGoal(trimmed)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90 disabled:opacity-40"
          >
            <Target className="size-5" strokeWidth={2} />
            Add as a goal
          </button>

          <button
            type="button"
            disabled={!trimmed}
            onClick={() => onAddAsHabit(trimmed)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sage/60 py-3.5 font-heading text-sm uppercase text-white transition-colors hover:bg-sage/80 disabled:opacity-40"
          >
            <Repeat className="size-5" strokeWidth={2} />
            Add as a habit
          </button>

          <button
            type="button"
            disabled={!trimmed || trimmed === text}
            onClick={() => {
              onRename(trimmed);
              onClose();
            }}
            className="w-full rounded-2xl bg-black/5 py-3.5 font-heading text-sm uppercase text-black/70 transition-colors hover:bg-black/10 disabled:opacity-40"
          >
            Save changes
          </button>

          <button
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 py-2 font-heading text-sm uppercase text-clay-deep transition-opacity hover:opacity-70"
          >
            <Trash2 className="size-4" strokeWidth={2} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
