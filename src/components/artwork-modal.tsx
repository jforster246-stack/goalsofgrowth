import { X } from "lucide-react";
import { ConstellationArt } from "@/components/collectible-art";
import { constellationById } from "@/components/constellations-data";
import { type Artwork } from "@/lib/artworks-data";

/**
 * A collectible in its frame: the constellation's star-line asterism drawn in
 * soft gold on a night sky.
 */
export function ArtworkPlacard({ artwork }: { artwork: Artwork }) {
  const constellation = constellationById(artwork.ref);
  return (
    <div className="flex size-full items-center justify-center overflow-hidden bg-[radial-gradient(130%_130%_at_30%_15%,#352a63_0%,#1c1740_55%,#0c0a1e_100%)] p-[14%] text-[#f6e8b0] [filter:drop-shadow(0_0_1.5px_rgba(246,232,176,0.55))]">
      {constellation ? <ConstellationArt c={constellation} /> : null}
    </div>
  );
}

export function ModalShell({
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

/** The artwork pop-up from the gallery wall. "Take down" only appears on the
 *  gallery itself, where the piece hangs in a slot. */
export function ArtworkDetailModal({
  artwork,
  seed,
  onClose,
  onRemove,
}: {
  artwork: Artwork;
  seed: string;
  onClose: () => void;
  onRemove?: (() => void) | undefined;
}) {
  return (
    <ModalShell title="Collectible" onClose={onClose}>
      <div className="mt-3 flex flex-col items-center gap-4 text-center">
        <div className="aspect-square w-44 overflow-hidden rounded-2xl ring-1 ring-black/5">
          <ArtworkPlacard artwork={artwork} />
        </div>
        <div>
          <p className="font-display text-2xl leading-tight text-black">
            {artwork.name}
          </p>
          <p className="mt-1 font-serif text-sm italic text-black/60">
            Constellation
          </p>
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-6 w-full py-2 font-heading text-sm text-black/40 transition-colors hover:text-clay-deep"
        >
          Take down from wall
        </button>
      )}
    </ModalShell>
  );
}
