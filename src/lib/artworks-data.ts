import { TAROT } from "@/components/tarot-data";

/**
 * Moongrove collectibles — the rewards you buy with stardust and place in your
 * universe. For now these are the 22 original tarot cards (Major Arcana), all at
 * one flat price, no rarity tiers.
 *
 * The export names (Artwork, ARTWORKS, artworkById, dailyArtworkIds, …) are kept
 * so the gallery/showcase code and its database tables — which key off the
 * numeric `id` — keep working unchanged.
 */
export type Artwork = {
  id: number;
  name: string;
  /** Price in stardust (flat for every collectible). */
  cost: number;
  kind: "tarot";
  /** Tarot card id (from tarot-data). */
  ref: string;
};

/** Flat price for every collectible. */
export const ARTWORK_COST = 50;

export const ARTWORKS: Artwork[] = TAROT.map((t, i) => ({
  id: i + 1,
  name: t.name,
  cost: ARTWORK_COST,
  kind: "tarot",
  ref: t.id,
}));

const BY_ID = new Map(ARTWORKS.map((a) => [a.id, a]));
export function artworkById(id: number): Artwork | undefined {
  return BY_ID.get(id);
}

/** A soft, neutral tile behind a collectible (the card art sits on top). */
export function artworkTint(_id: number): string {
  return "#efe9de";
}

/**
 * The three collectibles offered today, chosen deterministically from the local
 * date so the picks are stable for the day and rotate over time.
 */
export function dailyArtworkIds(today: string): number[] {
  const dayIndex = Math.floor(
    new Date(`${today}T00:00:00`).getTime() / 86_400_000,
  );
  const n = ARTWORKS.length;
  const base = ((dayIndex * 7) % n + n) % n;
  return [0, 7, 14].map((o) => ARTWORKS[(base + o) % n]!.id);
}
