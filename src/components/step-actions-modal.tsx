import { useState } from "react";
import { Check, Repeat, Trash2, X } from "lucide-react";

/**
 * Tapping a step (on Home or the goal page) opens this: rename, complete,
 * turn it into a habit, or delete.
 */
export function StepActionsModal({
  title,
  done,
  onClose,
  onRename,
  onToggle,
  onDelete,
  onAddAsHabit,
}: {
  title: string;
  done: boolean;
  onClose: () => void;
  onRename: (title: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  onAddAsHabit: (name: string) => void;
}) {
  const [name, setName] = useState(title);
  const trimmed = name.trim();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">Step</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={240}
          aria-label="Step title"
          className="mt-5 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-olive/40"
        />

        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={!trimmed || trimmed === title}
            onClick={() => {
              onRename(trimmed);
              onClose();
            }}
            className="w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90 disabled:opacity-40"
          >
            Save changes
          </button>

          <button
            type="button"
            onClick={() => {
              onToggle();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sage/60 py-3.5 font-heading text-sm uppercase text-white transition-colors hover:bg-sage/80"
          >
            <Check className="size-5" strokeWidth={2} />
            {done ? "Mark not done" : "Mark as done"}
          </button>

          <button
            type="button"
            onClick={() => onAddAsHabit(trimmed || title)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black/5 py-3.5 font-heading text-sm uppercase text-black/70 transition-colors hover:bg-black/10"
          >
            <Repeat className="size-5" strokeWidth={2} />
            Add this as a habit
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
            Delete step
          </button>
        </div>
      </div>
    </div>
  );
}
