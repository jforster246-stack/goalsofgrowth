import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Stamp } from "@/components/stamp";
import {
  WinFormModal,
  winStampStyle,
  type EditableWin,
} from "@/components/win-form-modal";
import {
  goalsQueryOptions,
  stampBalanceQueryOptions,
  stampsQueryOptions,
  winsQueryOptions,
} from "@/lib/goal-queries";
import { mergeStamps, type StampView } from "@/lib/stamp-view";
import { ARTWORK_COST } from "@/lib/artworks-data";

type Win = {
  id: string;
  title: string;
  note: string | null;
  kind: string;
  achieved_on: string;
  icon: string | null;
  accent: string | null;
};

/**
 * The stamp collections — completed-goal stamps, achievements and life events —
 * shown on the Wins page and inside the pill popup. `onNavigate` fires just
 * before a click sends you elsewhere (so a host popup can close itself).
 */
export function StampCollections({
  defaultAdd = false,
  onNavigate,
}: {
  defaultAdd?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();

  const { data: stamps } = useQuery(stampsQueryOptions);
  const { data: goals } = useQuery(goalsQueryOptions);
  const { data: balance } = useQuery(stampBalanceQueryOptions);
  const { data: wins } = useQuery(winsQueryOptions);

  const [adding, setAdding] = useState(defaultAdd);
  const [editingWin, setEditingWin] = useState<EditableWin | null>(null);
  const [snapshot, setSnapshot] = useState<StampView | null>(null);

  const stampList = mergeStamps(stamps, goals);
  const spendable = balance?.balance ?? 0;
  const winList = (wins ?? []) as Win[];
  const achievements = winList.filter((w) => w.kind === "achievement");
  const lifeEvents = winList.filter((w) => w.kind === "life_event");

  const liveGoalIds = useMemo(
    () => new Set((goals ?? []).map((g) => g.id)),
    [goals],
  );

  const openGoalStamp = (s: StampView) => {
    if (s.goalId && liveGoalIds.has(s.goalId)) {
      onNavigate?.();
      navigate({ to: "/goals/$goalId", params: { goalId: s.goalId } });
    } else {
      setSnapshot(s);
    }
  };

  return (
    <div className="space-y-7">
      <p className="font-serif text-sm text-black/50">
        You have{" "}
        <span className="font-heading text-olive">
          {spendable} star stamp{spendable === 1 ? "" : "s"}
        </span>{" "}
        left to spend on artworks for your{" "}
        <Link
          to="/gallery"
          onClick={() => onNavigate?.()}
          className="text-olive underline underline-offset-2"
        >
          gallery
        </Link>
        .
      </p>

      {/* How to earn stamps */}
      <section className="rounded-2xl bg-white/60 p-4">
        <p className="font-heading text-sm uppercase text-olive">How to earn stamps</p>
        <ul className="mt-3 space-y-2 font-serif text-sm text-black/60">
          <li className="flex items-baseline gap-2">
            <span className="font-heading text-olive">+5</span>
            <span>finish a whole part of your day — all your morning, afternoon or evening habits</span>
          </li>
          <li className="flex items-baseline gap-2">
            <span className="font-heading text-olive">+2</span>
            <span>every 3 habits you tick off in a day</span>
          </li>
          <li className="flex items-baseline gap-2">
            <span className="font-heading text-olive">+1</span>
            <span>finish a goal</span>
          </li>
          <li className="flex items-baseline gap-2">
            <span className="font-heading text-olive">+5</span>
            <span>sign in 7 days in a row</span>
          </li>
        </ul>
        <p className="mt-3 border-t border-black/5 pt-3 font-serif text-sm text-black/50">
          Each artwork in the gallery costs{" "}
          <span className="font-heading text-olive">{ARTWORK_COST} stamps</span>.
        </p>
      </section>

      {/* Completed goals */}
      <section>
        <div className="flex items-center gap-1.5">
          <p className="font-heading text-sm uppercase text-olive">
            Completed goals
          </p>
          <span className="ml-1 font-mono text-xs text-olive/50">
            {stampList.length}
          </span>
        </div>
        {stampList.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white/60 px-4 py-4 font-serif text-sm text-black/40">
            Complete a goal to earn your first stamp.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {stampList.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => openGoalStamp(s)}
                aria-label={`Open ${s.title}`}
                className="flex w-[76px] flex-col items-center gap-1.5 rounded-xl p-1 text-center transition-colors hover:bg-black/5"
              >
                <Stamp icon={s.icon} accent={s.accent} />
                <span className="font-serif text-[10px] leading-tight text-black/50 [overflow-wrap:anywhere]">
                  for {s.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <WinCollection
        title="Achievements"
        wins={achievements}
        onAdd={() => setAdding(true)}
        onOpen={setEditingWin}
      />
      <WinCollection
        title="Life events"
        wins={lifeEvents}
        onAdd={() => setAdding(true)}
        onOpen={setEditingWin}
      />

      {/* How to earn stamps */}
      <section className="rounded-2xl bg-white/60 p-4">
        <p className="font-heading text-sm uppercase text-olive">How to earn stamps</p>
        <ul className="mt-3 space-y-2 font-serif text-sm text-black/60">
          <li className="flex items-baseline gap-2">
            <span className="font-heading text-olive">+5</span>
            <span>finish a whole part of your day — all your morning, afternoon or evening habits</span>
          </li>
          <li className="flex items-baseline gap-2">
            <span className="font-heading text-olive">+2</span>
            <span>every 3 habits you tick off in a day</span>
          </li>
          <li className="flex items-baseline gap-2">
            <span className="font-heading text-olive">+1</span>
            <span>finish a goal</span>
          </li>
          <li className="flex items-baseline gap-2">
            <span className="font-heading text-olive">+5</span>
            <span>sign in 7 days in a row</span>
          </li>
        </ul>
        <p className="mt-3 border-t border-black/5 pt-3 font-serif text-sm text-black/50">
          Each artwork in the gallery costs{" "}
          <span className="font-heading text-olive">{ARTWORK_COST} stamps</span>.
        </p>
      </section>

      {adding && <WinFormModal onClose={() => setAdding(false)} />}
      {editingWin && (
        <WinFormModal win={editingWin} onClose={() => setEditingWin(null)} />
      )}
      {snapshot && (
        <StampSnapshotModal stamp={snapshot} onClose={() => setSnapshot(null)} />
      )}
    </div>
  );
}

/** The pill popup: the collections in a centred sheet. */
export function StampCollectionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">
            Your stamps
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-4">
          <StampCollections onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}

/** A gallery section of win stamps (achievements or life events). */
function WinCollection({
  title,
  wins,
  onAdd,
  onOpen,
}: {
  title: string;
  wins: Win[];
  onAdd: () => void;
  onOpen: (win: EditableWin) => void;
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
            <WinStamp key={win.id} win={win} onOpen={() => onOpen(win)} />
          ))}
        </div>
      )}
    </section>
  );
}

function WinStamp({ win, onOpen }: { win: Win; onOpen: () => void }) {
  const style = winStampStyle(win.kind, win.icon, win.accent);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${win.title}`}
      className="flex w-[76px] flex-col items-center gap-1.5 rounded-xl p-1 text-center transition-colors hover:bg-black/5"
    >
      <Stamp icon={style.icon} accent={style.accent} />
      <span className="font-serif text-[10px] leading-tight text-black/50 [overflow-wrap:anywhere]">
        {win.title}
      </span>
    </button>
  );
}

/** Read-only detail for a completed-goal stamp whose goal has been deleted. */
function StampSnapshotModal({
  stamp,
  onClose,
}: {
  stamp: StampView;
  onClose: () => void;
}) {
  const earned = stamp.earnedAt
    ? new Date(stamp.earnedAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between">
          <p className="font-heading text-sm uppercase text-olive">
            Completed goal
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-2 flex flex-col items-center gap-3 text-center">
          <Stamp icon={stamp.icon} accent={stamp.accent} className="size-28" />
          <p className="font-display text-2xl leading-tight text-black">
            {stamp.title}
          </p>
          {earned && (
            <p className="font-serif text-sm text-black/50">Earned {earned}</p>
          )}
          <p className="mt-1 font-serif text-xs text-black/40">
            This goal is no longer in your list, so its steps and notes aren't
            here — but the stamp stays yours.
          </p>
        </div>
      </div>
    </div>
  );
}
