import {
  createFileRoute,
  Link,
  useNavigate,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WinFormModal } from "@/components/win-form-modal";
import { Stamp } from "@/components/stamp";
import { goalProgress } from "@/components/goal-ui";
import { goalsQueryOptions, winsQueryOptions } from "@/lib/goal-queries";
import { deleteWin } from "@/lib/wins.functions";

export const Route = createFileRoute("/_authenticated/wins")({
  validateSearch: (search: { new?: boolean } & SearchSchemaInput) => ({
    new: search["new"] === true || (search["new"] as unknown) === "true",
  }),
  head: () => ({
    meta: [
      { title: "Wins stamps — Goals of Growth" },
      {
        name: "description",
        content:
          "Your gallery: the stamps you've collected for completed goals, achievements, and life events.",
      },
    ],
  }),
  component: WinsPage,
});

type Win = {
  id: string;
  title: string;
  note: string | null;
  kind: string;
  achieved_on: string;
};

function WinsPage() {
  const { new: openNew } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: goals } = useQuery(goalsQueryOptions);
  const { data: wins } = useQuery(winsQueryOptions);

  const [adding, setAdding] = useState(false);
  const showModal = adding || openNew;
  const closeModal = () => {
    setAdding(false);
    if (openNew) navigate({ to: "/wins", search: { new: false }, replace: true });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWin({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wins"] }),
  });

  const completedGoals = (goals ?? []).filter((g) => goalProgress(g).complete);
  const winList = (wins ?? []) as Win[];
  const achievements = winList.filter((w) => w.kind === "achievement");
  const lifeEvents = winList.filter((w) => w.kind === "life_event");

  return (
    <AppShell title="Wins stamps">
      <div className="mt-4 space-y-8 pb-4 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0">
        {/* Intro */}
        <p className="font-serif text-sm text-black/50 md:col-span-2">
          Every star stamp you've collected. Spend them on artworks in the{" "}
          <Link to="/gallery" className="text-olive underline underline-offset-2">
            gallery
          </Link>{" "}
          — coming soon.
        </p>

        {/* Completed goals */}
        <section className="md:col-span-2">
          <div className="flex items-center gap-1.5">
            <p className="font-heading text-sm uppercase text-olive">
              Completed goals
            </p>
            <span className="ml-1 font-mono text-xs text-olive/50">
              {completedGoals.length}
            </span>
          </div>
          {completedGoals.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-white/60 px-4 py-4 font-serif text-sm text-black/40">
              Complete a goal to earn your first stamp.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {completedGoals.map((goal) => (
                <Link
                  key={goal.id}
                  to="/goals/$goalId"
                  params={{ goalId: goal.id }}
                  aria-label={`Goal: ${goal.title}`}
                  className="flex w-[76px] flex-col items-center gap-1.5 text-center"
                >
                  <Stamp icon={goal.icon} accent={goal.accent} />
                  <span className="font-serif text-[10px] leading-tight text-black/50 [overflow-wrap:anywhere]">
                    for {goal.title}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Achievements */}
        <WinCollection
          title="Achievements"
          wins={achievements}
          onAdd={() => setAdding(true)}
          onDelete={(id) => deleteMutation.mutate(id)}
        />

        {/* Life events */}
        <WinCollection
          title="Life events"
          wins={lifeEvents}
          onAdd={() => setAdding(true)}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>

      {showModal && <WinFormModal onClose={closeModal} />}
    </AppShell>
  );
}

/** A gallery section of win stamps (achievements or life events). */
function WinCollection({
  title,
  wins,
  onAdd,
  onDelete,
}: {
  title: string;
  wins: Win[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="font-heading text-sm uppercase text-olive">{title}</p>
          <span className="ml-1 font-mono text-xs text-olive/50">
            {wins.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 font-heading text-xs uppercase text-olive transition-opacity hover:opacity-70"
        >
          <Plus className="size-4" strokeWidth={2} />
          Add
        </button>
      </div>
      {wins.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white/60 px-4 py-4 font-serif text-sm text-black/40">
          Nothing here yet.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {wins.map((win) => (
            <WinStamp key={win.id} win={win} onDelete={() => onDelete(win.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function WinStamp({ win, onDelete }: { win: Win; onDelete: () => void }) {
  const isLifeEvent = win.kind === "life_event";
  return (
    <div className="relative flex w-[76px] flex-col items-center gap-1.5 text-center">
      <Stamp
        icon={isLifeEvent ? "m024" : null}
        accent={isLifeEvent ? "clay" : "sea"}
      />
      <span className="font-serif text-[10px] leading-tight text-black/50 [overflow-wrap:anywhere]">
        {win.title}
      </span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${win.title}`}
        className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-white text-black/40 shadow ring-1 ring-black/5 transition-colors hover:text-clay-deep"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
