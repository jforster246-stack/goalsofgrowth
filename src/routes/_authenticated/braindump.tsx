import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BrainDumpItemModal } from "@/components/braindump-item-modal";
import { HabitFormModal } from "@/components/habit-form-modal";
import { Loading } from "@/components/loading";
import { brainDumpQueryOptions } from "@/lib/goal-queries";
import {
  createBrainDumpItem,
  deleteBrainDumpItem,
  reorderBrainDump,
  updateBrainDumpItem,
} from "@/lib/braindump.functions";

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

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    addMutation.mutate(text);
  };

  const handleReorder = (next: Item[]) => {
    setOrder(next);
    reorderMutation.mutate(next.map((i) => i.id));
  };

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
          <Reorder.Group
            as="div"
            axis="y"
            values={order}
            onReorder={handleReorder}
            className="mt-4 space-y-2"
          >
            {order.map((item) => (
              <DraggableItem
                key={item.id}
                item={item}
                onOpen={() => setActive(item)}
              />
            ))}
          </Reorder.Group>
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

/** One draggable idea: a grip handle plus the (tappable) text. */
function DraggableItem({
  item,
  onOpen,
}: {
  item: Item;
  onOpen: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item as="div" value={item} dragListener={false} dragControls={controls}>
      <div className="flex w-full items-center gap-1.5 rounded-2xl bg-white py-2.5 pl-1.5 pr-3 shadow-sm">
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          className="grid size-8 shrink-0 cursor-grab touch-none place-items-center text-black/25 active:cursor-grabbing"
        >
          <GripVertical className="size-5" />
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 py-1 text-left font-serif text-sm text-black [overflow-wrap:anywhere]"
        >
          {item.text}
        </button>
      </div>
    </Reorder.Item>
  );
}
