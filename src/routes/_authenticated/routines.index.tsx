import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { Stamp } from "@/components/stamp";
import { checklistsQueryOptions } from "@/lib/goal-queries";

export const Route = createFileRoute("/_authenticated/routines/")({
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
  const { data: lists, isPending } = useQuery(checklistsQueryOptions);

  return (
    <AppShell title="Routines" hideSettings>
      <div className="mt-4 pb-4">
        <p className="font-serif text-sm text-black/50">
          Simple checklists for your routines. Open one to tick things off, then
          reset it to run again.
        </p>

        {isPending || !lists ? (
          <Loading />
        ) : lists.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-heading text-base text-black">No routines yet</p>
            <p className="mt-2 font-serif text-sm text-black/50">
              Tap the + button to make one — a morning ritual, a packing list,
              anything you repeat.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <Stamp icon={list.icon} accent="mint" className="size-11 shrink-0" />
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
