import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { checklistsQueryOptions } from "@/lib/goal-queries";
import {
  addChecklistItem,
  createChecklist,
  deleteChecklist,
  deleteChecklistItem,
  renameChecklist,
  resetChecklist,
  toggleChecklistItem,
} from "@/lib/checklists.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/routines")({
  head: () => ({
    meta: [
      { title: "Routines — Goals of Growth" },
      {
        name: "description",
        content:
          "Simple checklists for your routines — tick things off, then reset the list to run it again.",
      },
    ],
  }),
  component: RoutinesPage,
});

type Item = {
  id: string;
  checklist_id: string;
  text: string;
  done: boolean;
  position: number;
  created_at: string;
};
type Checklist = {
  id: string;
  title: string;
  position: number;
  created_at: string;
  user_id: string;
  items: Item[];
};

function RoutinesPage() {
  const queryClient = useQueryClient();
  const { data: lists, isPending } = useQuery(checklistsQueryOptions);
  const [draft, setDraft] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["checklists"] });

  const createMutation = useMutation({
    mutationFn: (title: string) => createChecklist({ data: { title } }),
    onSuccess: invalidate,
  });

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    createMutation.mutate(title);
  };

  return (
    <AppShell title="Routines" hideSettings>
      <div className="mt-4 pb-4">
        <p className="font-serif text-sm text-black/50">
          Simple checklists for your routines. Tick things off, then reset the
          list to run it again.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="mt-4 flex items-center gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="New checklist… e.g. Morning routine"
            maxLength={140}
            className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Add checklist"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-olive text-white transition-colors hover:bg-olive/90 disabled:opacity-40"
          >
            <Plus className="size-5" strokeWidth={2} />
          </button>
        </form>

        {isPending || !lists ? (
          <Loading />
        ) : lists.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-heading text-base text-black">No checklists yet</p>
            <p className="mt-2 font-serif text-sm text-black/50">
              Make one for a routine you repeat — a morning ritual, a packing
              list, anything.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(lists as Checklist[]).map((list) => (
              <ChecklistCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ChecklistCard({ list }: { list: Checklist }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(list.title);
  const [itemDraft, setItemDraft] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["checklists"] });

  const renameMutation = useMutation({
    mutationFn: (t: string) => renameChecklist({ data: { id: list.id, title: t } }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteChecklist({ data: { id: list.id } }),
    onSuccess: invalidate,
  });
  const resetMutation = useMutation({
    mutationFn: () => resetChecklist({ data: { id: list.id } }),
    onSuccess: invalidate,
  });
  const addItemMutation = useMutation({
    mutationFn: (text: string) =>
      addChecklistItem({ data: { checklistId: list.id, text } }),
    onSuccess: invalidate,
  });
  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleChecklistItem({ data: input }),
    onSuccess: invalidate,
  });
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => deleteChecklistItem({ data: { id } }),
    onSuccess: invalidate,
  });

  const doneCount = list.items.filter((i) => i.done).length;

  const addItem = () => {
    const text = itemDraft.trim();
    if (!text) return;
    setItemDraft("");
    addItemMutation.mutate(text);
  };

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== list.title) renameMutation.mutate(t);
    else if (!t) setTitle(list.title);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Checklist name"
          maxLength={140}
          className="min-w-0 flex-1 rounded-lg bg-transparent font-heading text-base text-black focus:bg-black/5 focus:outline-none focus:ring-1 focus:ring-olive/30"
        />
        <span className="shrink-0 font-mono text-xs text-black/40">
          {doneCount}/{list.items.length}
        </span>
        <button
          type="button"
          onClick={() => resetMutation.mutate()}
          disabled={doneCount === 0}
          aria-label="Reset checklist"
          title="Reset — uncheck all"
          className="flex shrink-0 items-center gap-1 rounded-full bg-black/5 px-2.5 py-1.5 font-heading text-[11px] uppercase text-black/60 transition-colors hover:bg-black/10 disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" strokeWidth={2} />
          Reset
        </button>
        <button
          type="button"
          onClick={() => deleteMutation.mutate()}
          aria-label="Delete checklist"
          className="grid size-8 shrink-0 place-items-center rounded-full text-black/30 transition-colors hover:bg-black/5 hover:text-clay-deep"
        >
          <Trash2 className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {list.items.map((item) => (
          <div key={item.id} className="group flex items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                toggleMutation.mutate({ id: item.id, done: !item.done })
              }
              aria-label={item.done ? `Uncheck ${item.text}` : `Check ${item.text}`}
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
                item.done
                  ? "border-olive bg-olive text-white"
                  : "border-black/20 text-transparent hover:border-olive/50",
              )}
            >
              <Check className="size-4" strokeWidth={3} />
            </button>
            <span
              className={cn(
                "min-w-0 flex-1 font-serif text-sm [overflow-wrap:anywhere]",
                item.done
                  ? "text-black/40 line-through decoration-black/30"
                  : "text-black",
              )}
            >
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => deleteItemMutation.mutate(item.id)}
              aria-label={`Delete ${item.text}`}
              className="grid size-6 shrink-0 place-items-center rounded-full text-black/25 opacity-0 transition-opacity hover:text-black/60 group-hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addItem();
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={itemDraft}
          onChange={(e) => setItemDraft(e.target.value)}
          placeholder="Add an item…"
          maxLength={300}
          className="min-w-0 flex-1 rounded-xl bg-black/5 px-3 py-2 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
        />
        <button
          type="submit"
          disabled={!itemDraft.trim()}
          aria-label="Add item"
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-sage/60 text-white transition-colors hover:bg-sage/80 disabled:opacity-40"
        >
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
