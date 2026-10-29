import { CONSTELLATION_DATA } from "@/components/constellations-data";
import { TAROT, ICONIC_TAROT } from "@/components/tarot-data";

/**
 * Moongrove collectibles — what you buy with stardust and place in your universe:
 * constellation star-maps and original tarot cards.
 *
 * The export names (Artwork, ARTWORKS, artworkById, dailyArtworkIds, …) are kept
 * so the gallery/showcase code and its database tables — which key off the numeric
 * `id` — keep working unchanged. `kind` + `ref` say what each collectible is and
 * which constellation/tarot it points to.
 */
export type Tier = "common" | "uncommon" | "rare" | "legendary";

export type Artwork = {
  id: number;
  name: string;
  tier: Tier;
  /** Price in stardust. */
  cost: number;
  kind: "constellation" | "tarot";
  /** Constellation id or tarot id. */
  ref: string;
};

/** The cheapest collectible's price — a sensible default where a flat cost is needed. */
export const ARTWORK_COST = 10;

export const TIER_LABEL: Record<Tier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

/** Non-zodiac constellations priced a notch higher as "rare" finds. */
const RARE_CONSTELLATIONS = new Set(["ori", "uma", "cas", "cyg", "cru", "peg"]);

const CONSTELLATION_ARTWORKS: Artwork[] = CONSTELLATION_DATA.map((c, i) => {
  const zodiac = i < 12;
  const rare = RARE_CONSTELLATIONS.has(c.id);
  return {
    id: i + 1,
    name: c.name,
    tier: zodiac ? "common" : rare ? "rare" : "uncommon",
    cost: zodiac ? 10 + (i % 4) * 2 : rare ? 36 + (i % 3) * 4 : 20 + (i % 5) * 3,
    kind: "constellation",
    ref: c.id,
  };
});

const TAROT_ARTWORKS: Artwork[] = TAROT.map((t, i) => {
  const iconic = ICONIC_TAROT.has(t.id);
  return {
    id: CONSTELLATION_ARTWORKS.length + 1 + i,
    name: t.name,
    tier: iconic ? "legendary" : "rare",
    cost: iconic ? 100 : 55 + (i % 4) * 6,
    kind: "tarot",
    ref: t.id,
  };
});

export const ARTWORKS: Artwork[] = [
  ...CONSTELLATION_ARTWORKS,
  ...TAROT_ARTWORKS,
];

const BY_ID = new Map(ARTWORKS.map((a) => [a.id, a]));
export function artworkById(id: number): Artwork | undefined {
  return BY_ID.get(id);
}

/** A soft, neutral tile behind a collectible (line art sits in ink on top). */
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
  const step = 7;
  const base = ((dayIndex * step) % n + n) % n;
  return [0, 17, 34].map((offset) => ARTWORKS[(base + offset) % n]!.id);
}
