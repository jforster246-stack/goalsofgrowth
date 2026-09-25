import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GoldFrame } from "@/components/gold-frame";
import { Stamp } from "@/components/stamp";
import { localToday, type Accent } from "@/components/goal-ui";
import { StampStyleEditor } from "@/components/stamp-style-editor";
import { WinFormModal, type EditableWin } from "@/components/win-form-modal";
import {
  goalsQueryOptions,
  purchasesQueryOptions,
  showcaseQueryOptions,
  stampBalanceQueryOptions,
  stampsQueryOptions,
  winsQueryOptions,
} from "@/lib/goal-queries";
import {
  buyArtwork,
  clearShowcaseSlot,
  setShowcaseSlot,
} from "@/lib/artworks.functions";
import { updateStamp } from "@/lib/stamps.functions";
import { updateGoalDetails } from "@/lib/goals.functions";
import {
  ARTWORK_COST,
  ARTWORKS,
  artworkById,
  artworkTint,
  dailyArtworkIds,
  type Artwork,
} from "@/lib/artworks-data";
import { mergeStamps, type StampView } from "@/lib/stamp-view";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Goals of Growth" },
      {
        name: "description",
        content:
          "Your wall of wins, completed goals and artworks bought with the stamps you earn.",
      },
    ],
  }),
  component: GalleryPage,
});

type Win = {
  id: string;
  title: string;
  note: string | null;
  kind: string;
  achieved_on: string;
};

type GalleryGoal = {
  id: string;
  title: string;
  accent: string;
  icon: string | null;
  why: string | null;
  vision: string | null;
  steps: { id: string; title: string; done: boolean }[];
};

const SLOTS = [0, 1, 2, 3, 4];

function GalleryPage() {
  const today = localToday();
  const queryClient = useQueryClient();

  const { data: goals } = useQuery(goalsQueryOptions);
  const { data: stamps } = useQuery(stampsQueryOptions);
  const { data: wins } = useQuery(winsQueryOptions);
  const { data: balance } = useQuery(stampBalanceQueryOptions);
  const { data: purchases } = useQuery(purchasesQueryOptions);
  const { data: showcase } = useQuery(showcaseQueryOptions);

  const [pickSlot, setPickSlot] = useState<number | null>(null);
  const [detailArtwork, setDetailArtwork] = useState<{
    slot: number;
    artwork: Artwork;
  } | null>(null);
  const [editingWin, setEditingWin] = useState<EditableWin | null>(null);
  const [detailGoal, setDetailGoal] = useState<{
    stamp: StampView;
    goal?: GalleryGoal | undefined;
  } | null>(null);
  const [confirmBuy, setConfirmBuy] = useState<Artwork | null>(null);

  const goalStamps = mergeStamps(stamps, goals);
  const winList = (wins ?? []) as Win[];
  const owned = purchases ?? [];
  const spendable = balance?.balance ?? 0;

  const slotArtwork = (slot: number): Artwork | undefined => {
    const row = (showcase ?? []).find((s) => s.position === slot);
    return row ? artworkById(row.artwork_id) : undefined;
  };
  const shownArtworkIds = new Set(
    (showcase ?? []).map((s) => s.artwork_id),
  );

  const buy = useMutation({
    mutationFn: (artworkId: number) => buyArtwork({ data: { artworkId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artwork-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["stamp-balance"] });
      setConfirmBuy(null);
    },
  });
  const place = useMutation({
    mutationFn: (input: { position: number; artworkId: number }) =>
      setShowcaseSlot({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-showcase"] });
      setPickSlot(null);
    },
  });
  const clearSlot = useMutation({
    mutationFn: (position: number) => clearShowcaseSlot({ data: { position } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-showcase"] });
      setDetailArtwork(null);
    },
  });
  const saveStyle = useMutation({
    mutationFn: ({
      stamp,
      icon,
      accent,
    }: {
      stamp: StampView;
      icon: string | null;
      accent: string;
    }) =>
      stamp.stampId
        ? updateStamp({ data: { id: stamp.stampId, icon: icon ?? undefined, accent } })
        : updateGoalDetails({
            data: {
              id: stamp.goalId!,
              title: stamp.title,
              icon: icon ?? "",
              accent: accent as Accent,
            },
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stamps"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setDetailGoal(null);
    },
  });

  const openGoal = (s: StampView) => {
    const full = s.goalId
      ? (goals ?? []).find((g) => g.id === s.goalId)
      : undefined;
    setDetailGoal({ stamp: s, goal: full as GalleryGoal | undefined });
  };

  const dailyIds = dailyArtworkIds(today);

  return (
    <AppShell
      title="Gallery"
      right={
        <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <Stamp icon={null} accent="sea" className="size-5" />
          <span className="font-mono text-sm text-olive">{spendable}</span>
        </span>
      }
    >
      {/* Today's picks */}
      <section className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="font-heading text-sm uppercase text-olive">
            Today's artworks
          </p>
          <span className="font-serif text-xs text-black/50">
            {ARTWORK_COST} stamps each
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {dailyIds.map((id) => {
            const art = artworkById(id);
            if (!art) return null;
            const isOwned = owned.includes(id);
            const canBuy = !isOwned && spendable >= ARTWORK_COST;
            return (
              <div key={id} className="flex flex-col">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-sm">
                  <ArtworkPlacard artwork={art} />
                </div>
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={() => setConfirmBuy(art)}
                  className={cn(
                    "mt-2 rounded-full py-2 font-heading text-[11px] uppercase transition-colors",
                    isOwned
                      ? "bg-black/5 text-black/40"
                      : canBuy
                        ? "bg-olive text-white hover:bg-olive/90"
                        : "bg-black/5 text-black/30",
                  )}
                >
                  {isOwned
                    ? "Owned"
                    : canBuy
                      ? `Buy · ${ARTWORK_COST}`
                      : `${ARTWORK_COST} stamps`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* The wall */}
      <section className="mt-6">
        <p className="font-heading text-sm uppercase text-olive">Your wall</p>
        <p className="mt-1 font-serif text-xs text-black/40">
          Completed goals and wins, plus five spots for artworks. Swipe around to
          explore.
        </p>

        <div
          className="mt-3 -mx-5 overflow-auto px-5 py-6 sm:mx-0 sm:rounded-3xl"
          style={{ background: "#2c141c" }}
        >
          <div className="grid w-max gap-5 [grid-template-columns:repeat(4,132px)] sm:w-full sm:[grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
            {/* Artwork slots */}
            {SLOTS.map((slot) => {
              const art = slotArtwork(slot);
              return (
                <FrameCell key={`slot-${slot}`} caption={art ? art.work : "Add artwork"}>
                  <GoldFrame
                    ariaLabel={art ? `Artwork: ${art.work}` : "Add an artwork"}
                    onClick={() =>
                      art ? setDetailArtwork({ slot, artwork: art }) : setPickSlot(slot)
                    }
                  >
                    {art ? (
                      <ArtworkPlacard artwork={art} />
                    ) : (
                      <span className="grid size-full place-items-center bg-background/70">
                        <Plus className="size-8 text-olive/50" strokeWidth={2} />
                      </span>
                    )}
                  </GoldFrame>
                </FrameCell>
              );
            })}

            {/* Completed goals */}
            {goalStamps.map((s) => (
              <FrameCell key={s.key} caption={s.title}>
                <GoldFrame
                  ariaLabel={`Goal: ${s.title}`}
                  onClick={() => openGoal(s)}
                  mountClassName="bg-[#f4ece0]"
                >
                  <Stamp icon={s.icon} accent={s.accent} className="w-3/4" />
                </GoldFrame>
              </FrameCell>
            ))}

            {/* Wins */}
            {winList.map((w) => {
              const life = w.kind === "life_event";
              return (
                <FrameCell key={w.id} caption={w.title}>
                  <GoldFrame
                    ariaLabel={`Win: ${w.title}`}
                    onClick={() =>
                      setEditingWin({
                        id: w.id,
                        title: w.title,
                        kind: w.kind,
                        note: w.note,
                        achieved_on: w.achieved_on,
                      })
                    }
                    mountClassName="bg-[#f4ece0]"
                  >
                    <Stamp
                      icon={life ? "m024" : null}
                      accent={life ? "clay" : "sea"}
                      className="w-3/4"
                    />
                  </GoldFrame>
                </FrameCell>
              );
            })}
          </div>
        </div>
      </section>

      {/* Slot picker */}
      {pickSlot !== null && (
        <SlotPickerModal
          owned={owned}
          shown={shownArtworkIds}
          onClose={() => setPickSlot(null)}
          onPick={(artworkId) => place.mutate({ position: pickSlot, artworkId })}
        />
      )}

      {/* Artwork detail */}
      {detailArtwork && (
        <ArtworkDetailModal
          artwork={detailArtwork.artwork}
          onClose={() => setDetailArtwork(null)}
          onRemove={() => clearSlot.mutate(detailArtwork.slot)}
        />
      )}

      {/* Goal details + restyle */}
      {detailGoal && (
        <GoalInfoModal
          stamp={detailGoal.stamp}
          goal={detailGoal.goal}
          saving={saveStyle.isPending}
          onSave={(icon, accent) =>
            saveStyle.mutate({ stamp: detailGoal.stamp, icon, accent })
          }
          onClose={() => setDetailGoal(null)}
        />
      )}

      {/* Win edit */}
      {editingWin && (
        <WinFormModal win={editingWin} onClose={() => setEditingWin(null)} />
      )}

      {/* Confirm purchase */}
      {confirmBuy && (
        <ConfirmPurchaseModal
          artwork={confirmBuy}
          pending={buy.isPending}
          onConfirm={() => buy.mutate(confirmBuy.id)}
          onClose={() => setConfirmBuy(null)}
        />
      )}
    </AppShell>
  );
}

/** A gold frame with a caption underneath, hung with a slight tilt. */
function FrameCell({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center">
      {children}
      <span className="mt-2 line-clamp-2 text-center font-serif text-[11px] leading-tight text-white/70">
        {caption}
      </span>
    </div>
  );
}

/** Museum placard: work, artist, year on a soft canvas (we don't ship images). */
function ArtworkPlacard({ artwork }: { artwork: Artwork }) {
  return (
    <div
      className="flex size-full flex-col items-center justify-center gap-1.5 px-2 text-center"
      style={{ background: artworkTint(artwork.id) }}
    >
      <p className="font-display text-[13px] font-medium leading-tight text-black/80">
        {artwork.work}
      </p>
      <span className="my-0.5 h-px w-6 bg-black/30" />
      <p className="font-serif text-[10px] italic leading-tight text-black/60">
        {artwork.artist}
      </p>
      <p className="font-mono text-[9px] text-black/45">{artwork.year}</p>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Pick one of your purchased artworks to hang in an empty slot. */
function SlotPickerModal({
  owned,
  shown,
  onClose,
  onPick,
}: {
  owned: number[];
  shown: Set<number>;
  onClose: () => void;
  onPick: (artworkId: number) => void;
}) {
  const available = ARTWORKS.filter(
    (a) => owned.includes(a.id) && !shown.has(a.id),
  );
  return (
    <ModalShell title="Choose an artwork" onClose={onClose}>
      {available.length === 0 ? (
        <p className="mt-4 font-serif text-sm text-black/50">
          {owned.length === 0
            ? "You haven't bought any artworks yet — grab one from today's picks."
            : "Every artwork you own is already on the wall."}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {available.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a.id)}
              className="aspect-[4/5] overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
            >
              <ArtworkPlacard artwork={a} />
            </button>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function ArtworkDetailModal({
  artwork,
  onClose,
  onRemove,
}: {
  artwork: Artwork;
  onClose: () => void;
  onRemove: () => void;
}) {
  return (
    <ModalShell title="Artwork" onClose={onClose}>
      <div className="mt-3 flex flex-col items-center gap-3 text-center">
        <div className="aspect-[4/5] w-40 overflow-hidden rounded-2xl shadow">
          <ArtworkPlacard artwork={artwork} />
        </div>
        <div>
          <p className="font-display text-2xl leading-tight text-black">
            {artwork.work}
          </p>
          <p className="mt-1 font-serif text-sm italic text-black/60">
            {artwork.artist}, {artwork.year}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-6 w-full py-2 font-heading text-sm uppercase text-black/40 transition-colors hover:text-clay-deep"
      >
        Take down from wall
      </button>
    </ModalShell>
  );
}

/** Confirm spending stamps on an artwork before it's bought. */
function ConfirmPurchaseModal({
  artwork,
  pending,
  onConfirm,
  onClose,
}: {
  artwork: Artwork;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title="Purchase artwork" onClose={onClose}>
      <div className="mt-2 flex flex-col items-center gap-4 text-center">
        <div className="aspect-[4/5] w-32 overflow-hidden rounded-2xl shadow">
          <ArtworkPlacard artwork={artwork} />
        </div>
        <p className="font-serif text-base leading-relaxed text-black/80">
          Purchase{" "}
          <span className="font-heading text-black">{artwork.work}</span> for{" "}
          <span className="font-heading text-olive">
            {ARTWORK_COST} stamps
          </span>
          ?
        </p>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        disabled={pending}
        className="mt-6 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
      >
        {pending ? "Purchasing…" : "Purchase"}
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={pending}
        className="mt-2 w-full py-2 font-heading text-sm uppercase text-black/40 transition-colors hover:text-black/70 disabled:opacity-40"
      >
        Cancel
      </button>
    </ModalShell>
  );
}

/**
 * A completed-goal frame: its stamp (recolour / re-icon it here), plus the
 * goal's why, vision and steps when the goal still exists.
 */
function GoalInfoModal({
  stamp,
  goal,
  saving,
  onSave,
  onClose,
}: {
  stamp: StampView;
  goal?: GalleryGoal | undefined;
  saving: boolean;
  onSave: (icon: string | null, accent: string) => void;
  onClose: () => void;
}) {
  const [icon, setIcon] = useState<string | null>(stamp.icon);
  const [accent, setAccent] = useState<string>(stamp.accent);
  const dirty = icon !== stamp.icon || accent !== stamp.accent;

  const steps = goal?.steps ?? [];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <ModalShell title="Completed goal" onClose={onClose}>
      <div className="mt-2 flex flex-col items-center gap-3 text-center">
        <Stamp icon={icon} accent={accent} className="size-24" />
        <p className="font-display text-2xl leading-tight text-black">
          {stamp.title}
        </p>
        <p className="flex items-center gap-1.5 font-serif text-sm text-black/50">
          <Check className="size-4 text-olive" strokeWidth={2.5} /> Completed
        </p>
      </div>

      {/* Recolour / re-icon */}
      <div className="mt-5">
        <StampStyleEditor
          icon={icon}
          accent={accent}
          onIcon={setIcon}
          onAccent={setAccent}
        />
        <button
          type="button"
          onClick={() => onSave(icon, accent)}
          disabled={!dirty || saving}
          className="mt-4 w-full rounded-2xl bg-olive py-3 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save look"}
        </button>
      </div>

      {goal?.why?.trim() && (
        <section className="mt-5">
          <p className="font-heading text-sm uppercase text-olive">
            Why I did this
          </p>
          <p className="mt-1 whitespace-pre-wrap font-serif text-sm leading-relaxed text-black/70">
            {goal.why}
          </p>
        </section>
      )}

      {goal?.vision?.trim() && (
        <section className="mt-4">
          <p className="font-heading text-sm uppercase text-olive">
            What it looked like when done
          </p>
          <p className="mt-1 whitespace-pre-wrap font-serif text-sm leading-relaxed text-black/70">
            {goal.vision}
          </p>
        </section>
      )}

      {steps.length > 0 && (
        <section className="mt-4">
          <p className="font-heading text-sm uppercase text-olive">
            Steps
            <span className="ml-1.5 font-mono text-xs text-olive/50">
              {doneCount}/{steps.length}
            </span>
          </p>
          <ul className="mt-2 space-y-1.5">
            {steps.map((st) => (
              <li key={st.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md",
                    st.done
                      ? "bg-olive text-white"
                      : "border-2 border-black/20",
                  )}
                >
                  {st.done && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span
                  className={cn(
                    "font-serif text-sm",
                    st.done
                      ? "text-black/50 line-through decoration-black/30"
                      : "text-black",
                  )}
                >
                  {st.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ModalShell>
  );
}
