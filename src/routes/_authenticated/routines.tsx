import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Check, GripVertical, ListChecks, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { IconPicker } from "@/components/icon-picker";
import { Motif } from "@/components/motif-icons";
import { checklistsQueryOptions } from "@/lib/goal-queries";
import {
  addChecklistItem,
  createChecklist,
  deleteChecklist,
  deleteChecklistItem,
  renameChecklist,
  reorderChecklistItems,
  resetChecklist,
  setChecklistIcon,
  toggleChecklistItem,
  updateChecklistItem,
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
  icon: string | null;
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
  const [iconOpen, setIconOpen] = useState(false);
  const [order, setOrder] = useState<Item[]>(list.items);

  // Keep the local (drag-reorderable) copy in step with the server list.
  useEffect(() => setOrder(list.items), [list.items]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["checklists"] });

  const renameMutation = useMutation({
    mutationFn: (t: string) => renameChecklist({ data: { id: list.id, title: t } }),
    onSuccess: invalidate,
  });
  const iconMutation = useMutation({
    mutationFn: (icon: string) => setChecklistIcon({ data: { id: list.id, icon } }),
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
  const renameItemMutation = useMutation({
    mutationFn: (input: { id: string; text: string }) =>
      updateChecklistItem({ data: input }),
    onSuccess: invalidate,
  });
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => deleteChecklistItem({ data: { id } }),
    onSuccess: invalidate,
  });
  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderChecklistItems({ data: { orderedIds } }),
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

  const handleReorder = (next: Item[]) => {
    setOrder(next);
    reorderMutation.mutate(next.map((i) => i.id));
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIconOpen((v) => !v)}
          aria-label="Change icon"
          title="Change icon"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-olive transition-colors hover:bg-black/5"
        >
          {list.icon ? (
            <Motif id={list.icon} className="size-5" />
          ) : (
            <ListChecks className="size-5" strokeWidth={2} />
          )}
        </button>
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

      {iconOpen && (
        <div className="mt-3">
          <IconPicker
            value={list.icon ?? null}
            onChange={(id) => {
              iconMutation.mutate(id ?? "");
              setIconOpen(false);
            }}
            defaultLabel="Default"
          />
        </div>
      )}

      <Reorder.Group
        as="div"
        axis="y"
        values={order}
        onReorder={handleReorder}
        className="mt-3 space-y-0.5"
      >
        {order.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onToggle={() =>
              toggleMutation.mutate({ id: item.id, done: !item.done })
            }
            onRename={(text) => renameItemMutation.mutate({ id: item.id, text })}
            onDelete={() => deleteItemMutation.mutate(item.id)}
          />
        ))}
      </Reorder.Group>

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

/** A draggable, editable checklist item: grip, checkbox, inline text, delete. */
function ChecklistItemRow({
  item,
  onToggle,
  onRename,
  onDelete,
}: {
  item: Item;
  onToggle: () => void;
  onRename: (text: string) => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  const [text, setText] = useState(item.text);
  useEffect(() => setText(item.text), [item.text]);

  const save = () => {
    const t = text.trim();
    if (t && t !== item.text) onRename(t);
    else if (!t) setText(item.text);
  };

  return (
    <Reorder.Item as="div" value={item} dragListener={false} dragControls={controls}>
      <div className="group flex items-center gap-1">
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          className="grid size-7 shrink-0 cursor-grab touch-none place-items-center text-black/20 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={item.done ? "Mark not done" : "Mark done"}
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
            item.done
              ? "border-olive bg-olive text-white"
              : "border-black/20 text-transparent hover:border-olive/50",
          )}
        >
          <Check className="size-4" strokeWidth={3} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Item text"
          maxLength={300}
          className={cn(
            "min-w-0 flex-1 rounded bg-transparent px-1 py-1 font-serif text-sm focus:bg-black/5 focus:outline-none",
            item.done
              ? "text-black/40 line-through decoration-black/30"
              : "text-black",
          )}
        />
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete item"
          className="grid size-6 shrink-0 place-items-center rounded-full text-black/25 opacity-0 transition-opacity hover:text-black/60 group-hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}
