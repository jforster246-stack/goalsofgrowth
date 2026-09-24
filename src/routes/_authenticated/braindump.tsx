import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Check, GripVertical, Plus, Repeat, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BrainDumpItemModal } from "@/components/braindump-item-modal";
import { HabitFormModal } from "@/components/habit-form-modal";
import { Loading } from "@/components/loading";
import { brainDumpQueryOptions } from "@/lib/goal-queries";
import {
  createBrainDumpItem,
  deleteBrainDumpItem,
  reorderBrainDump,
  toggleBrainDumpItem,
  updateBrainDumpItem,
} from "@/lib/braindump.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/braindump")({
  head: () => ({
    meta: [
      { title: "Brain dump — Goals of Growth" },
      {
        name: "description",
        content:
          "A running list of everything you want to do or try — reorder it, and turn any idea into a goal or a habit.",
      },
    ],
  }),
  component: BrainDumpPage,
});

type Item = {
  id: string;
  text: string;
  done: boolean;
  position: number;
  created_at: string;
  user_id: string;
};

function BrainDumpPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: items, isPending } = useQuery(brainDumpQueryOptions);

  const [draft, setDraft] = useState("");
  const [order, setOrder] = useState<Item[]>([]);
  const [active, setActive] = useState<Item | null>(null);
  const [habitPrefill, setHabitPrefill] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  // Keep the local (drag-reorderable) copy in step with the server list.
  useEffect(() => {
    if (items) setOrder(items as Item[]);
  }, [items]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["brain-dump"] });

  const addMutation = useMutation({
    mutationFn: (text: string) => createBrainDumpItem({ data: { text } }),
    onSuccess: invalidate,
  });
  const renameMutation = useMutation({
    mutationFn: (input: { id: string; text: string }) =>
      updateBrainDumpItem({ data: input }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBrainDumpItem({ data: { id } }),
    onSuccess: invalidate,
  });
  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderBrainDump({ data: { orderedIds } }),
    onSuccess: invalidate,
  });
  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      toggleBrainDumpItem({ data: input }),
    onSuccess: invalidate,
  });

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    addMutation.mutate(text);
  };

  // Only the active (un-ticked) ideas are draggable; ticked ones collapse
  // into a "Done" toggle underneath.
  const handleReorder = (nextActive: Item[]) => {
    const merged = [...nextActive, ...order.filter((i) => i.done)];
    setOrder(merged);
    reorderMutation.mutate(merged.map((i) => i.id));
  };

  const activeItems = order.filter((i) => !i.done);
  const doneItems = order.filter((i) => i.done);

  const itemHandlers = (item: Item) => ({
    onOpen: () => setActive(item),
    onAddGoal: () =>
      navigate({ to: "/goals/new", search: { title: item.text } }),
    onAddHabit: () => setHabitPrefill(item.text),
    onToggle: () => toggleMutation.mutate({ id: item.id, done: !item.done }),
  });

  return (
    <AppShell title="Brain dump" hideSettings>
      <div className="mt-4 pb-4">
        <p className="font-serif text-sm text-black/50">
          Everything you want to do or try. Drag to reorder, or tap an idea to
          turn it into a goal or a habit.
        </p>

        {/* Add a new idea */}
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
            placeholder="Brain dump an idea…"
            maxLength={500}
            className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Add idea"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-olive text-white transition-colors hover:bg-olive/90 disabled:opacity-40"
          >
            <Plus className="size-5" strokeWidth={2} />
          </button>
        </form>

        {isPending || !items ? (
          <Loading />
        ) : order.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-heading text-base text-black">Nothing here yet</p>
            <p className="mt-2 font-serif text-sm text-black/50">
              Add anything on your mind — you can shape it into a goal or habit
              later.
            </p>
          </div>
        ) : (
          <>
            <Reorder.Group
              as="div"
              axis="y"
              values={activeItems}
              onReorder={handleReorder}
              className="mt-4 space-y-2"
            >
              {activeItems.map((item) => (
                <DraggableItem key={item.id} item={item} {...itemHandlers(item)} />
              ))}
            </Reorder.Group>

            {doneItems.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowDone((v) => !v)}
                  className="font-heading text-[11px] uppercase text-black/40 transition-colors hover:text-black/70"
                >
                  {showDone ? "Hide done" : `Done (${doneItems.length})`}
                </button>
                {showDone && (
                  <div className="mt-2 space-y-2">
                    {doneItems.map((item) => (
                      <ItemRow key={item.id} item={item} {...itemHandlers(item)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {active && (
        <BrainDumpItemModal
          text={active.text}
          onClose={() => setActive(null)}
          onRename={(text) => renameMutation.mutate({ id: active.id, text })}
          onDelete={() => deleteMutation.mutate(active.id)}
          onAddAsGoal={(text) => {
            setActive(null);
            navigate({ to: "/goals/new", search: { title: text } });
          }}
          onAddAsHabit={(text) => {
            setActive(null);
            setHabitPrefill(text);
          }}
        />
      )}

      {habitPrefill !== null && (
        <HabitFormModal
          initialName={habitPrefill}
          onClose={() => setHabitPrefill(null)}
        />
      )}
    </AppShell>
  );
}

type RowHandlers = {
  onOpen: () => void;
  onAddGoal: () => void;
  onAddHabit: () => void;
  onToggle: () => void;
};

/**
 * The idea row: tappable text (opens edit/delete), quick "make a goal" /
 * "make a habit" shortcuts, and a tick so the list can double as a to-do.
 * `dragHandle` is supplied only for the active, draggable rows.
 */
function ItemRow({
  item,
  onOpen,
  onAddGoal,
  onAddHabit,
  onToggle,
  dragHandle,
}: RowHandlers & { item: Item; dragHandle?: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-1 rounded-2xl bg-white py-2 pl-1.5 pr-2 shadow-sm">
      {dragHandle ?? <span className="w-2 shrink-0" />}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "min-w-0 flex-1 py-1 text-left font-serif text-sm [overflow-wrap:anywhere]",
          item.done
            ? "text-black/40 line-through decoration-black/30"
            : "text-black",
        )}
      >
        {item.text}
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onAddGoal}
          aria-label="Make this a goal"
          title="Make this a goal"
          className="grid size-8 place-items-center rounded-lg text-olive transition-colors hover:bg-black/5"
        >
          <Target className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onAddHabit}
          aria-label="Make this a habit"
          title="Make this a habit"
          className="grid size-8 place-items-center rounded-lg text-olive transition-colors hover:bg-black/5"
        >
          <Repeat className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={item.done ? "Mark not done" : "Mark done"}
          className={cn(
            "ml-0.5 grid size-7 place-items-center rounded-md border-2 transition-colors",
            item.done
              ? "border-olive bg-olive text-white"
              : "border-black/20 text-transparent hover:border-olive/50",
          )}
        >
          <Check className="size-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

/** An active idea wrapped for drag-reordering. */
function DraggableItem({ item, ...handlers }: RowHandlers & { item: Item }) {
  const controls = useDragControls();
  return (
    <Reorder.Item as="div" value={item} dragListener={false} dragControls={controls}>
      <ItemRow
        item={item}
        {...handlers}
        dragHandle={
          <button
            type="button"
            aria-label="Drag to reorder"
            onPointerDown={(e) => controls.start(e)}
            className="grid size-8 shrink-0 cursor-grab touch-none place-items-center text-black/25 active:cursor-grabbing"
          >
            <GripVertical className="size-5" />
          </button>
        }
      />
    </Reorder.Item>
  );
}
