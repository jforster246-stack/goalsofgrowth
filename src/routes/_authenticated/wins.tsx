import {
  createFileRoute,
  Link,
  useNavigate,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Flame, Heart, Plus, Trophy, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WinFormModal } from "@/components/win-form-modal";
import { Stamp } from "@/components/stamp";
import { goalProgress, localToday } from "@/components/goal-ui";
import {
  goalsQueryOptions,
  habitStreaksQueryOptions,
  winsQueryOptions,
} from "@/lib/goal-queries";
import { deleteWin } from "@/lib/wins.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/wins")({
  validateSearch: (search: { new?: boolean } & SearchSchemaInput) => ({
    new: search["new"] === true || (search["new"] as unknown) === "true",
  }),
  head: () => ({
    meta: [
      { title: "Gallery — Goals of Growth" },
      {
        name: "description",
        content:
          "Your gallery: the stamps you've collected, completed goals, habit streaks, and wins worth remembering.",
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

function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function WinsPage() {
  const today = localToday();
  const { new: openNew } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: goals } = useQuery(goalsQueryOptions);
  const { data: streaks } = useQuery(habitStreaksQueryOptions(today));
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

  return (
    <AppShell title="Gallery">
      <div className="mt-4 space-y-8 pb-4 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0">
        {/* Stamps — one for every completed goal */}
        <section className="md:col-span-2">
          <div className="flex items-center gap-1.5">
            <p className="font-heading text-sm uppercase text-olive">
              Your stamps
            </p>
            <span className="ml-1 font-mono text-xs text-olive/50">
              {completedGoals.length}
            </span>
          </div>
          <p className="mt-1 font-serif text-xs text-black/40">
            You earn a stamp each time you finish a goal. Spend them on artworks
            for your gallery — coming soon.
          </p>
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

        {/* Habit streaks */}
        <section>
          <p className="font-heading text-sm uppercase text-olive">Habit streaks</p>
          <div className="mt-4 space-y-2">
            {!streaks || streaks.length === 0 ? (
              <p className="rounded-2xl bg-white/60 px-4 py-4 font-serif text-sm text-black/40">
                Tick off a habit two days running to start a streak.
              </p>
            ) : (
              streaks.slice(0, 3).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 rounded-2xl bg-white py-3 pl-3 pr-4 shadow-sm"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-clay/15 text-clay-deep">
                    <Flame className="size-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 font-serif text-sm text-black">
                    {h.name}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-clay-deep">
                    {h.streak} day{h.streak === 1 ? "" : "s"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Manual wins */}
        <section className="md:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm uppercase text-olive">Your wins</p>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 font-heading text-xs uppercase text-olive transition-opacity hover:opacity-70"
            >
              <Plus className="size-4" strokeWidth={2} />
              Add
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {!wins || wins.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <p className="font-serif text-sm text-black/50">
                  Log an achievement or a life event worth remembering.
                </p>
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-olive px-5 py-2.5 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
                >
                  <Plus className="size-4" strokeWidth={2} />
                  Add a win
                </button>
              </div>
            ) : (
              (wins as Win[]).map((win) => <WinCard key={win.id} win={win} onDelete={() => deleteMutation.mutate(win.id)} />)
            )}
          </div>
        </section>
      </div>

      {showModal && <WinFormModal onClose={closeModal} />}
    </AppShell>
  );
}

function WinCard({ win, onDelete }: { win: Win; onDelete: () => void }) {
  const isLifeEvent = win.kind === "life_event";
  const Icon = isLifeEvent ? Heart : Trophy;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
            isLifeEvent ? "bg-clay/15 text-clay-deep" : "bg-gold/20 text-gold-deep",
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm text-black">{win.title}</p>
          <p className="mt-0.5 font-heading text-[10px] uppercase text-black/40">
            {isLifeEvent ? "Life event" : "Achievement"} · {fmtDate(win.achieved_on)}
          </p>
          {win.note && (
            <p className="mt-2 font-serif text-sm leading-relaxed text-black/60">
              {win.note}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${win.title}`}
          className="grid size-7 shrink-0 place-items-center rounded-full text-black/30 transition-colors hover:bg-black/5 hover:text-black/60"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
