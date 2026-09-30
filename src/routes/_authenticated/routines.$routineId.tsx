import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Check, GripVertical, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { IconPicker } from "@/components/icon-picker";
import { Stamp } from "@/components/stamp";
import { checklistsQueryOptions } from "@/lib/goal-queries";
import {
  addChecklistItem,
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

export const Route = createFileRoute("/_authenticated/routines/$routineId")({
  head: () => ({
    meta: [{ title: "Routine — Goals of Growth" }],
  }),
  component: RoutineDetailPage,
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

function RoutineDetailPage() {
  const { routineId } = Route.useParams();
  const { data: lists, isPending } = useQuery(checklistsQueryOptions);
  const list = (lists as Checklist[] | undefined)?.find((l) => l.id === routineId);

  return (
    <AppShell backTo="/routines" hideSettings>
      {isPending ? (
        <Loading />
      ) : !list ? (
        <p className="mt-8 text-center font-serif text-sm text-black/50">
          This routine no longer exists.
        </p>
      ) : (
        <RoutineEditor list={list} />
      )}
    </AppShell>
  );
}

function RoutineEditor({ list }: { list: Checklist }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState(list.title);
  const [itemDraft, setItemDraft] = useState("");
  const [iconOpen, setIconOpen] = useState(false);
  const [order, setOrder] = useState<Item[]>(list.items);

  useEffect(() => setTitle(list.title), [list.title]);
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
    onSuccess: () => {
      invalidate();
      navigate({ to: "/routines", replace: true });
    },
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
    <div className="mt-4 pb-6 md:mx-auto md:max-w-2xl">
      {/* Header: icon + name + count */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIconOpen((v) => !v)}
          aria-label="Change icon"
          className="shrink-0 rounded-xl transition-transform hover:-translate-y-0.5"
        >
          <Stamp icon={list.icon} accent="mint" className="size-12" />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Routine name"
          maxLength={140}
          className="min-w-0 flex-1 rounded-lg bg-transparent font-heading text-2xl text-black focus:bg-black/5 focus:outline-none focus:ring-1 focus:ring-olive/30"
        />
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

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-xs text-black/40">
          {doneCount}/{list.items.length} done
        </span>
        <button
          type="button"
          onClick={() => resetMutation.mutate()}
          disabled={doneCount === 0}
          className="flex items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 font-heading text-[11px] uppercase text-black/60 transition-colors hover:bg-black/10 disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" strokeWidth={2} />
          Reset
        </button>
      </div>

      {/* Items */}
      <Reorder.Group
        as="div"
        axis="y"
        values={order}
        onReorder={handleReorder}
        className="mt-4 space-y-0.5"
      >
        {order.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onToggle={() => toggleMutation.mutate({ id: item.id, done: !item.done })}
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
          className="min-w-0 flex-1 rounded-xl bg-black/5 px-3 py-2.5 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
        />
        <button
          type="submit"
          disabled={!itemDraft.trim()}
          aria-label="Add item"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage/60 text-white transition-colors hover:bg-sage/80 disabled:opacity-40"
        >
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </form>

      <button
        type="button"
        onClick={() => deleteMutation.mutate()}
        className="mt-8 flex w-full items-center justify-center gap-2 py-2 font-heading text-sm uppercase text-black/40 transition-colors hover:text-clay-deep"
      >
        <Trash2 className="size-4" strokeWidth={2} />
        Delete routine
      </button>
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
            "min-w-0 flex-1 rounded bg-transparent px-1 py-1.5 font-serif text-sm focus:bg-black/5 focus:outline-none",
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
