import { X } from "lucide-react";
import { TarotCard } from "@/components/collectible-art";
import { tarotById } from "@/components/tarot-data";
import { type Artwork } from "@/lib/artworks-data";

/**
 * How an artwork fills its frame: a public-domain image when we have one,
 * otherwise a museum placard (work, artist, year on a soft canvas) — used for
 * works still under copyright, whose images we don't reproduce.
 */
export function ArtworkPlacard({ artwork }: { artwork: Artwork }) {
  const tarot = tarotById(artwork.ref);
  return (
    <div className="flex size-full items-center justify-center bg-white p-3 text-[var(--tarot-ink)]">
      {tarot ? <TarotCard card={tarot} /> : null}
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
            Major Arcana
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
