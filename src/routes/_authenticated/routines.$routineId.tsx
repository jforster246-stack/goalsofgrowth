import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Check, GripVertical, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { IconPicker } from "@/components/icon-picker";
import { Stamp } from "@/components/stamp";
import { Button } from "@/components/ui/button";
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
    meta: [
      { title: "Your routine — Moongrove" },
      { name: "description", content: "Your personal routine and its small steps, ready to revisit and complete." },
      { property: "og:title", content: "Your routine — Moongrove" },
      { property: "og:description", content: "Your personal routine and its small steps, ready to revisit and complete." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
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
    <AppShell backTo="/routines" title="Routine" hideSettings hideFloatingAdd>
      {isPending ? (
        <Loading />
      ) : !list ? (
        <p className="mt-8 text-center font-serif text-sm text-muted-foreground">
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
    <div className="mx-auto mt-4 w-full min-w-0 max-w-3xl pb-6 sm:mt-6">
      {/* Header: icon + name + count */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIconOpen((v) => !v)}
          aria-label="Change icon"
          title="Change icon"
          className="size-12 shrink-0 rounded-lg [&_svg]:size-12 sm:size-14 sm:[&_svg]:size-14"
        >
          <Stamp icon={list.icon} accent="mint" className="size-12" />
        </Button>
        <AutosizeTextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Routine name"
          maxLength={140}
          className="w-full min-w-0 rounded-lg bg-transparent px-1 py-2 font-heading text-xl text-foreground focus:bg-muted focus:outline-none focus:ring-1 focus:ring-ring sm:text-2xl"
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

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-4">
        <span className="min-w-0 font-mono text-xs text-muted-foreground">
          {doneCount}/{list.items.length} done
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={() => resetMutation.mutate()}
          disabled={doneCount === 0}
          className="h-11 shrink-0 px-3 font-heading text-xs"
        >
          <RotateCcw className="size-3.5" strokeWidth={2} />
          Reset
        </Button>
      </div>

      {/* Items */}
      <Reorder.Group
        as="div"
        axis="y"
        values={order}
        onReorder={handleReorder}
        className="mt-2 min-w-0 divide-y divide-border"
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
        className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:gap-3"
      >
        <AutosizeTextField
          value={itemDraft}
          onChange={(e) => setItemDraft(e.target.value)}
          placeholder="Add an item…"
          aria-label="New routine item"
          maxLength={300}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addItem();
            }
          }}
          className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2.5 font-serif text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          type="submit"
          disabled={!itemDraft.trim()}
          aria-label="Add item"
          size="icon"
          title="Add item"
          className="size-11 shrink-0"
        >
          <Plus className="size-4" strokeWidth={2} />
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        onClick={() => deleteMutation.mutate()}
        className="mt-8 h-11 w-full font-heading text-sm text-muted-foreground hover:text-destructive sm:w-auto"
      >
        <Trash2 className="size-4" strokeWidth={2} />
        Delete routine
      </Button>
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
      <div className="group grid min-w-0 grid-cols-[24px_44px_minmax(0,1fr)_36px] items-start gap-1 py-2 sm:grid-cols-[32px_44px_minmax(0,1fr)_44px] sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          title="Drag to reorder"
          className="h-11 w-6 shrink-0 cursor-grab touch-none text-muted-foreground/60 active:cursor-grabbing sm:w-8"
        >
          <GripVertical className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={item.done ? "Mark not done" : "Mark done"}
          aria-pressed={item.done}
          title={item.done ? "Mark not done" : "Mark done"}
          className="size-11 shrink-0"
        >
          <span className={cn("grid size-6 place-items-center rounded-md border-2 transition-colors", item.done ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent")}>
            <Check className="size-4" strokeWidth={3} />
          </span>
        </Button>
        <AutosizeTextField
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Item text"
          maxLength={300}
          className={cn(
            "min-h-11 w-full min-w-0 rounded-md bg-transparent px-1 py-2.5 font-serif text-base leading-6 focus:bg-muted focus:outline-none focus:ring-1 focus:ring-ring",
            item.done
              ? "text-muted-foreground line-through decoration-muted-foreground/50"
              : "text-foreground",
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Delete item"
          title="Delete item"
          className="h-11 w-9 shrink-0 text-muted-foreground/60 hover:text-destructive sm:w-11"
        >
          <X className="size-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}

function AutosizeTextField(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    const resize = () => {
      field.style.height = "auto";
      field.style.height = `${field.scrollHeight}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(field);
    return () => observer.disconnect();
  }, [props.value]);
  return <textarea {...props} ref={ref} rows={1} className={cn("block resize-none overflow-hidden [overflow-wrap:anywhere]", props.className)} />;
}
