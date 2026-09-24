import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2, Trophy, X } from "lucide-react";
import { localToday } from "@/components/goal-ui";
import { createWin, deleteWin, updateWin } from "@/lib/wins.functions";
import { cn } from "@/lib/utils";

type Kind = "achievement" | "life_event";

const KINDS: { key: Kind; label: string; Icon: typeof Trophy }[] = [
  { key: "achievement", label: "Achievement", Icon: Trophy },
  { key: "life_event", label: "Life event", Icon: Heart },
];

export type EditableWin = {
  id: string;
  title: string;
  kind: string;
  note: string | null;
  achieved_on: string;
};

/**
 * One-screen win sheet. With no `win` it adds a new win; with a `win` it edits
 * that one in place and offers a delete.
 */
export function WinFormModal({
  win,
  onClose,
}: {
  win?: EditableWin | undefined;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!win;

  const [title, setTitle] = useState(win?.title ?? "");
  const [kind, setKind] = useState<Kind>(
    win?.kind === "life_event" ? "life_event" : "achievement",
  );
  const [achievedOn, setAchievedOn] = useState(win?.achieved_on ?? localToday());
  const [note, setNote] = useState(win?.note ?? "");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["wins"] });
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: (input: {
      title: string;
      kind: Kind;
      achievedOn: string;
      note?: string;
    }) => createWin({ data: input }),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: (input: {
      id: string;
      title: string;
      kind: Kind;
      achievedOn: string;
      note?: string;
    }) => updateWin({ data: input }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWin({ data: { id } }),
    onSuccess: invalidate,
  });

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value || busy) return;
    const trimmedNote = note.trim();
    if (isEdit && win) {
      updateMutation.mutate({
        id: win.id,
        title: value,
        kind,
        achievedOn,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      });
    } else {
      createMutation.mutate({
        title: value,
        kind,
        achievedOn,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <form
        onSubmit={submit}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">
            {isEdit ? "Edit win" : "Add a win"}
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

        <label className="mt-6 block font-heading text-sm uppercase text-olive">
          What happened
        </label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Ran my first 10k"
          maxLength={140}
          className="mt-2 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
        />

        <p className="mt-5 font-heading text-sm uppercase text-olive">Type</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {KINDS.map((k) => {
            const active = kind === k.key;
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                aria-pressed={active}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-2xl py-2.5 font-heading text-xs uppercase transition-colors",
                  active ? "bg-olive text-white" : "bg-black/5 text-black/50",
                )}
              >
                <k.Icon className="size-4" strokeWidth={2} />
                {k.label}
              </button>
            );
          })}
        </div>

        <label className="mt-5 block font-heading text-sm uppercase text-olive">
          When
        </label>
        <input
          type="date"
          value={achievedOn}
          max={localToday()}
          onChange={(e) => setAchievedOn(e.target.value)}
          className="mt-2 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-olive/40"
        />

        <div className="mt-5 flex items-baseline justify-between">
          <p className="font-heading text-sm uppercase text-olive">Note</p>
          <span className="font-serif text-xs italic text-black/40">optional</span>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Anything you want to remember about it"
          className="mt-2 w-full resize-y rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
        />

        <button
          type="submit"
          disabled={!title.trim() || busy}
          className="mt-6 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
        >
          {busy ? "Saving…" : isEdit ? "Save changes" : "Save win"}
        </button>

        {isEdit && win && (
          <button
            type="button"
            onClick={() => {
              if (!busy) deleteMutation.mutate(win.id);
            }}
            disabled={busy}
            className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 font-heading text-sm uppercase text-black/40 transition-colors hover:text-clay-deep disabled:opacity-40"
          >
            <Trash2 className="size-4" strokeWidth={2} />
            Delete win
          </button>
        )}
      </form>
    </div>
  );
}
