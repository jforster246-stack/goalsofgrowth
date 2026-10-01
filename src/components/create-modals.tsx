import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { NewGoalForm } from "@/routes/_authenticated/goals.new";
import { addChecklistItem, createChecklist } from "@/lib/checklists.functions";
import { createBrainDumpItem } from "@/lib/braindump.functions";

/** Shared bottom-sheet / centred-dialog chrome for the create flows. */
function Sheet({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl ${wide ? "max-w-xl" : "max-w-md"}`}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** The goal wizard, in a popup instead of its own page. */
export function GoalFormModal({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="New goal" onClose={onClose} wide>
      <NewGoalForm onCreated={onClose} />
    </Sheet>
  );
}

/** Name a routine and seed its first items, without leaving the page. */
export function RoutineFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const addDraft = () => {
    const v = draft.trim();
    if (!v) return;
    setItems((s) => [...s, v]);
    setDraft("");
  };

  const create = useMutation({
    mutationFn: async () => {
      const list = await createChecklist({ data: { title: title.trim() } });
      for (const text of items) {
        await addChecklistItem({ data: { checklistId: list.id, text } });
      }
      return list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      onClose();
    },
  });

  const canCreate = title.trim().length > 0 && !create.isPending;

  return (
    <Sheet title="New routine" onClose={onClose}>
      <label className="mt-6 block font-heading text-sm uppercase text-olive">
        Name
      </label>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Morning ritual, packing list…"
        maxLength={140}
        className="mt-2 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-base placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
      />

      <p className="mt-6 font-heading text-sm uppercase text-olive">Steps</p>
      <p className="mt-1 font-serif text-sm text-black/50">
        Add a few now, or more later. (optional)
      </p>
      {items.length > 0 && (
        <div className="mt-3 space-y-2">
          {items.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm"
            >
              <span className="min-w-0 flex-1 truncate font-serif text-sm text-black">
                {s}
              </span>
              <button
                type="button"
                onClick={() => setItems((arr) => arr.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${s}`}
                className="grid size-7 shrink-0 place-items-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="Add a step…"
          maxLength={300}
          className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
        />
        <button
          type="button"
          onClick={addDraft}
          disabled={!draft.trim()}
          aria-label="Add step"
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage/60 text-white transition-colors hover:bg-sage/80 disabled:opacity-40"
        >
          <Plus className="size-5" strokeWidth={2} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => create.mutate()}
        disabled={!canCreate}
        className="mt-6 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
      >
        {create.isPending ? "Creating…" : "Create routine"}
      </button>
    </Sheet>
  );
}

/** Quick-capture a thought straight into the brain dump, without leaving. */
export function BrainDumpQuickModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const add = useMutation({
    mutationFn: () => createBrainDumpItem({ data: { text: text.trim() } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain-dump"] });
      onClose();
    },
  });

  const canAdd = text.trim().length > 0 && !add.isPending;

  return (
    <Sheet title="Brain dump" onClose={onClose}>
      <p className="mt-2 font-serif text-sm text-black/50">
        Get it out of your head — capture a thought, task or idea.
      </p>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canAdd) add.mutate();
        }}
        rows={4}
        maxLength={500}
        placeholder="Whatever's on your mind…"
        className="mt-4 w-full resize-y rounded-2xl bg-black/5 px-4 py-3 font-serif text-base leading-relaxed placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
      />
      <button
        type="button"
        onClick={() => add.mutate()}
        disabled={!canAdd}
        className="mt-4 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
      >
        {add.isPending ? "Adding…" : "Add to brain dump"}
      </button>
    </Sheet>
  );
}
