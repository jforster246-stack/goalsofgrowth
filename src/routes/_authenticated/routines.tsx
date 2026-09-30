import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, ListChecks, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { Motif } from "@/components/motif-icons";
import { checklistsQueryOptions } from "@/lib/goal-queries";
import { createChecklist } from "@/lib/checklists.functions";

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

type Item = { id: string; done: boolean };
type Checklist = {
  id: string;
  title: string;
  icon: string | null;
  items: Item[];
};

function RoutinesPage() {
  const queryClient = useQueryClient();
  const { data: lists, isPending } = useQuery(checklistsQueryOptions);
  const [draft, setDraft] = useState("");

  const createMutation = useMutation({
    mutationFn: (title: string) => createChecklist({ data: { title } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checklists"] }),
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
          Simple checklists for your routines. Open one to tick things off, then
          reset it to run again.
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
            placeholder="New routine… e.g. Morning routine"
            maxLength={140}
            className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Add routine"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-olive text-white transition-colors hover:bg-olive/90 disabled:opacity-40"
          >
            <Plus className="size-5" strokeWidth={2} />
          </button>
        </form>

        {isPending || !lists ? (
          <Loading />
        ) : lists.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-heading text-base text-black">No routines yet</p>
            <p className="mt-2 font-serif text-sm text-black/50">
              Make one for a routine you repeat — a morning ritual, a packing
              list, anything.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(lists as Checklist[]).map((list) => (
              <RoutineCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/** A compact routine summary that opens the full routine on its own page. */
function RoutineCard({ list }: { list: Checklist }) {
  const total = list.items.length;
  const done = list.items.filter((i) => i.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link
      to="/routines/$routineId"
      params={{ routineId: list.id }}
      className="group flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/5 text-olive">
          {list.icon ? (
            <Motif id={list.icon} className="size-5" />
          ) : (
            <ListChecks className="size-5" strokeWidth={2} />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate font-heading text-base text-black">
          {list.title}
        </span>
        <ChevronRight className="size-5 shrink-0 text-black/25 transition-colors group-hover:text-black/50" />
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-olive transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[11px] text-black/40">
          {done}/{total}
        </span>
      </div>
    </Link>
  );
}
