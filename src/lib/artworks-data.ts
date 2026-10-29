import type { CelestialShape } from "@/components/celestial-body";

/**
 * Moongrove collectibles — the celestial bodies you buy with stardust and place
 * in your universe (stars, moons, planets, suns, comets, galaxies, constellations).
 *
 * This file used to hold famous paintings; it now holds celestial collectibles.
 * The export names (Artwork, ARTWORKS, artworkById, dailyArtworkIds, …) are kept
 * so the gallery/showcase code and its database tables — which key off the
 * numeric `id` — keep working unchanged.
 */
export type Tier = "common" | "uncommon" | "rare" | "legendary";

export type Artwork = {
  id: number;
  name: string;
  tier: Tier;
  /** Price in stardust. */
  cost: number;
  shape: CelestialShape;
  /** 0–360, the body's colour. */
  hue: number;
};

/** The cheapest collectible's price — a sensible default where a flat cost is needed. */
export const ARTWORK_COST = 8;

export const TIER_LABEL: Record<Tier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

export const ARTWORKS: Artwork[] = [
  // Common — the everyday sky
  { id: 1, name: "Twinkle", tier: "common", cost: 8, shape: "star4", hue: 48 },
  { id: 2, name: "Wishing Star", tier: "common", cost: 10, shape: "star5", hue: 45 },
  { id: 3, name: "Crescent", tier: "common", cost: 10, shape: "crescent", hue: 210 },
  { id: 4, name: "Half Moon", tier: "common", cost: 12, shape: "halfmoon", hue: 220 },
  { id: 5, name: "Dwarf Star", tier: "common", cost: 12, shape: "starburst", hue: 32 },

  // Uncommon — worlds of your own
  { id: 6, name: "Full Moon", tier: "uncommon", cost: 16, shape: "fullmoon", hue: 48 },
  { id: 7, name: "Little World", tier: "uncommon", cost: 18, shape: "planet", hue: 160 },
  { id: 8, name: "Red Planet", tier: "uncommon", cost: 20, shape: "planet", hue: 10 },
  { id: 9, name: "Blue Marble", tier: "uncommon", cost: 22, shape: "planet", hue: 205 },
  { id: 10, name: "Amber Star", tier: "uncommon", cost: 24, shape: "star5", hue: 28 },

  // Rare — the harder-won sights
  { id: 11, name: "Ringed World", tier: "rare", cost: 35, shape: "ringed", hue: 42 },
  { id: 12, name: "Gas Giant", tier: "rare", cost: 40, shape: "gasgiant", hue: 26 },
  { id: 13, name: "Ice World", tier: "rare", cost: 38, shape: "iceworld", hue: 195 },
  { id: 14, name: "The Sun", tier: "rare", cost: 45, shape: "sun", hue: 45 },
  { id: 15, name: "Comet", tier: "rare", cost: 35, shape: "comet", hue: 190 },
  { id: 16, name: "Blood Moon", tier: "rare", cost: 42, shape: "fullmoon", hue: 6 },
  { id: 17, name: "Blue Moon", tier: "rare", cost: 48, shape: "fullmoon", hue: 222 },

  // Legendary — once-in-a-lifetime
  { id: 18, name: "Orion", tier: "legendary", cost: 70, shape: "orion", hue: 220 },
  { id: 19, name: "The Swan", tier: "legendary", cost: 75, shape: "swan", hue: 260 },
  { id: 20, name: "The Great Bear", tier: "legendary", cost: 80, shape: "bear", hue: 200 },
  { id: 21, name: "Spiral Galaxy", tier: "legendary", cost: 100, shape: "galaxy", hue: 285 },
  { id: 22, name: "Nebula", tier: "legendary", cost: 90, shape: "nebula", hue: 300 },
  { id: 23, name: "Solar Eclipse", tier: "legendary", cost: 95, shape: "eclipse", hue: 40 },
  { id: 24, name: "Supernova", tier: "legendary", cost: 100, shape: "supernova", hue: 320 },
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
  const step = 3;
  const base = ((dayIndex * step) % n + n) % n;
  return [0, 8, 16].map((offset) => {
    const idx = (base + offset) % n;
    return ARTWORKS[idx]!.id;
  });
}
