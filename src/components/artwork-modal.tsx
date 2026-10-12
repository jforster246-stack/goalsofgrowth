import { X } from "lucide-react";
import { GoldFrame } from "@/components/gold-frame";
import { artworkTint, type Artwork } from "@/lib/artworks-data";

/**
 * How an artwork fills its frame: a public-domain image when we have one,
 * otherwise a museum placard (work, artist, year on a soft canvas) — used for
 * works still under copyright, whose images we don't reproduce.
 */
export function ArtworkPlacard({ artwork }: { artwork: Artwork }) {
  if (artwork.image) {
    return (
      <img
        src={artwork.image}
        alt={`${artwork.work} by ${artwork.artist}`}
        loading="lazy"
        className="size-full object-cover"
        style={{ background: artworkTint(artwork.id) }}
      />
    );
  }
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
    <ModalShell title="Artwork" onClose={onClose}>
      <div className="mt-3 flex flex-col items-center gap-4 text-center">
        <div className="w-44">
          <GoldFrame seed={seed} ariaLabel={artwork.work}>
            <ArtworkPlacard artwork={artwork} />
          </GoldFrame>
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
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-6 w-full py-2 font-heading text-sm uppercase text-black/40 transition-colors hover:text-clay-deep"
        >
          Take down from wall
        </button>
      )}
    </ModalShell>
  );
}
